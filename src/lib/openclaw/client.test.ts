import { EventEmitter } from "node:events";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildModelGovernancePatch, shouldRetryWithLegacyOperatorScopes } from "./client";

class FakeSocket extends EventEmitter {
  public sent: string[] = [];
  public closed = false;

  constructor(public readonly url: string) {
    super();
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.closed = true;
    queueMicrotask(() => this.emit("close"));
  }

  open() {
    queueMicrotask(() => this.emit("open"));
  }

  receive(frame: unknown) {
    queueMicrotask(() => this.emit("message", Buffer.from(JSON.stringify(frame))));
  }
}

const sockets: FakeSocket[] = [];

vi.mock("ws", () => {
  function MockWebSocket(this: FakeSocket, url: string) {
    const socket = new FakeSocket(url);
    sockets.push(socket);
    socket.open();
    return socket;
  }

  return { default: MockWebSocket };
});

describe("shouldRetryWithLegacyOperatorScopes", () => {
  it("retries production gateways that still report legacy operator scopes", () => {
    expect(shouldRetryWithLegacyOperatorScopes("missing scope: operator:read")).toBe(true);
    expect(shouldRetryWithLegacyOperatorScopes("Missing scope: operator:admin")).toBe(true);
  });

  it("does not retry unrelated gateway failures", () => {
    expect(shouldRetryWithLegacyOperatorScopes("missing scope: operator.read")).toBe(false);
    expect(shouldRetryWithLegacyOperatorScopes("Runtime gateway timeout")).toBe(false);
  });
});

describe("buildModelGovernancePatch", () => {
  it("uses the current OpenClaw agents defaults config shape", () => {
    const patch = buildModelGovernancePatch({
      defaultModel: "openrouter/auto",
      approvedModels: [
        { id: "openrouter/auto", label: "Auto" },
        { id: "anthropic/claude-sonnet-4-6" },
      ],
    });

    expect(patch).not.toHaveProperty("agent");
    expect(patch.agents.defaults.model).toEqual({ primary: "openrouter/auto" });
    expect(patch.agents.defaults.models).toHaveProperty("openrouter/auto");
    expect(patch.agents.defaults.models).toHaveProperty("anthropic/claude-sonnet-4-6");
  });
});

describe("OpenClawClient.withSession", () => {
  beforeEach(() => {
    sockets.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function parseFrame(raw: string) {
    return JSON.parse(raw) as {
      type: string;
      id: string;
      method?: string;
      params?: Record<string, unknown>;
    };
  }

  async function flushMicrotasks(rounds = 12) {
    for (let i = 0; i < rounds; i += 1) {
      await Promise.resolve();
    }
  }

  it("reuses one WebSocket across multiple RPC calls and acks the connect handshake first", async () => {
    const { OpenClawClient } = await import("./client");
    const client = new OpenClawClient({
      gatewayUrl: "wss://gateway.test/socket",
      gatewayToken: "token",
    });

    const sessionPromise = client.withSession(async (rpc) => {
      const first = rpc<{ value: string }>("config.get", {});
      const second = rpc<{ ok: true }>("config.patch", { raw: "{}", baseHash: "hash" });
      return { first: await first, second: await second };
    });

    await flushMicrotasks();
    expect(sockets).toHaveLength(1);
    const socket = sockets[0];
    expect(socket.url).toBe("wss://gateway.test/socket");

    const connectFrame = parseFrame(socket.sent[0]);
    expect(connectFrame.method).toBe("connect");
    expect(connectFrame.params?.scopes).toEqual([
      "operator.read",
      "operator.write",
      "operator.admin",
    ]);
    socket.receive({ type: "res", id: connectFrame.id, ok: true });

    await flushMicrotasks();
    expect(socket.sent).toHaveLength(3);

    const firstFrame = parseFrame(socket.sent[1]);
    const secondFrame = parseFrame(socket.sent[2]);
    expect(firstFrame.method).toBe("config.get");
    expect(secondFrame.method).toBe("config.patch");

    socket.receive({ type: "res", id: firstFrame.id, ok: true, payload: { value: "hello" } });
    socket.receive({ type: "res", id: secondFrame.id, ok: true, payload: { ok: true } });

    const result = await sessionPromise;
    expect(result).toEqual({ first: { value: "hello" }, second: { ok: true } });
    expect(sockets).toHaveLength(1);
    expect(socket.closed).toBe(true);
  });

  it("retries the entire session with legacy operator scopes when the gateway rejects modern scopes", async () => {
    const { OpenClawClient } = await import("./client");
    const client = new OpenClawClient({
      gatewayUrl: "wss://gateway.test/socket",
      gatewayToken: "token",
    });

    const sessionPromise = client.withSession(async (rpc) => rpc<{ ok: true }>("health", {}));

    await flushMicrotasks();
    const firstSocket = sockets[0];
    const firstConnect = parseFrame(firstSocket.sent[0]);
    expect(firstConnect.params?.scopes).toEqual([
      "operator.read",
      "operator.write",
      "operator.admin",
    ]);
    firstSocket.receive({
      type: "res",
      id: firstConnect.id,
      ok: false,
      error: { message: "missing scope: operator:read" },
    });

    await flushMicrotasks();
    expect(sockets).toHaveLength(2);
    const secondSocket = sockets[1];
    const secondConnect = parseFrame(secondSocket.sent[0]);
    expect(secondConnect.method).toBe("connect");
    expect(secondConnect.params?.scopes).toEqual([
      "operator:read",
      "operator:write",
      "operator:admin",
    ]);
    secondSocket.receive({ type: "res", id: secondConnect.id, ok: true });

    await flushMicrotasks();
    const healthFrame = parseFrame(secondSocket.sent[1]);
    expect(healthFrame.method).toBe("health");
    secondSocket.receive({
      type: "res",
      id: healthFrame.id,
      ok: true,
      payload: { ok: true },
    });

    await expect(sessionPromise).resolves.toEqual({ ok: true });
    expect(firstSocket.closed).toBe(true);
    expect(secondSocket.closed).toBe(true);
  });
});
