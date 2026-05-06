import { EventEmitter } from "node:events";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  agentMatchesSnapshot,
  buildModelGovernancePatch,
  governanceMatchesSnapshot,
  managedBootstrapDefaultsMatchSnapshot,
  parseRateLimitError,
  RuntimeRateLimitError,
  shouldRetryWithLegacyOperatorScopes,
  type OpenClawConfigSnapshot,
} from "./client";

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

describe("parseRateLimitError", () => {
  it("turns the gateway's structured rate-limit message into a typed error", () => {
    const error = parseRateLimitError("rate limit exceeded for config.patch; retry after 4s");
    expect(error).toBeInstanceOf(RuntimeRateLimitError);
    expect(error?.method).toBe("config.patch");
    expect(error?.retryAfterMs).toBe(4_000);
  });

  it("returns null for unrelated errors so they propagate verbatim", () => {
    expect(parseRateLimitError("Runtime gateway timeout")).toBeNull();
    expect(parseRateLimitError("rate limit exceeded for config.patch")).toBeNull();
  });
});

describe("governanceMatchesSnapshot", () => {
  function snapshotWith(defaults: Record<string, unknown>): OpenClawConfigSnapshot {
    return { hash: "h", config: { agents: { defaults } } };
  }

  it("returns true when primary model and approved ids already match the gateway state", () => {
    const snapshot = snapshotWith({
      model: { primary: "openrouter/auto" },
      models: [
        { id: "openrouter/auto", label: "Auto" },
        { id: "anthropic/claude-sonnet-4-6", label: "Claude" },
      ],
      skipBootstrap: true,
      thinkingDefault: "off",
      memorySearch: {
        enabled: false,
        sync: {
          onSessionStart: false,
          onSearch: false,
          watch: false,
        },
      },
    });
    expect(
      governanceMatchesSnapshot(snapshot, {
        defaultModel: "openrouter/auto",
        approvedModels: [
          { id: "anthropic/claude-sonnet-4-6" },
          { id: "openrouter/auto" },
        ],
      }),
    ).toBe(true);
  });

  it("returns false when managed bootstrap skipping is missing", () => {
    const snapshot = snapshotWith({
      model: { primary: "openrouter/auto" },
      models: [{ id: "openrouter/auto" }],
    });
    expect(
      governanceMatchesSnapshot(snapshot, {
        defaultModel: "openrouter/auto",
        approvedModels: [{ id: "openrouter/auto" }],
      }),
    ).toBe(false);
  });

  it("returns false when the primary model differs", () => {
    const snapshot = snapshotWith({
      model: { primary: "openrouter/auto" },
      models: [{ id: "openrouter/auto" }],
    });
    expect(
      governanceMatchesSnapshot(snapshot, {
        defaultModel: "anthropic/claude-sonnet-4-6",
        approvedModels: [{ id: "openrouter/auto" }],
      }),
    ).toBe(false);
  });

  it("returns false when the allowlist set differs", () => {
    const snapshot = snapshotWith({
      model: { primary: "openrouter/auto" },
      models: [{ id: "openrouter/auto" }],
    });
    expect(
      governanceMatchesSnapshot(snapshot, {
        defaultModel: "openrouter/auto",
        approvedModels: [{ id: "openrouter/auto" }, { id: "anthropic/claude-sonnet-4-6" }],
      }),
    ).toBe(false);
  });

  it("returns false when the snapshot has no agents.defaults at all", () => {
    expect(
      governanceMatchesSnapshot({ hash: "h", config: {} }, {
        defaultModel: "openrouter/auto",
        approvedModels: [{ id: "openrouter/auto" }],
      }),
    ).toBe(false);
  });
});

describe("agentMatchesSnapshot", () => {
  function snapshotWith(list: Array<Record<string, unknown>>): OpenClawConfigSnapshot {
    return { hash: "h", config: { agents: { list } } };
  }

  it("returns true when an agent with the same id, workspace, and model already exists", () => {
    const snapshot = snapshotWith([
      { id: "ant-agent", workspace: "/data/agents/ant-agent", model: "openrouter/auto" },
    ]);
    expect(
      agentMatchesSnapshot(snapshot, {
        agentId: "ant-agent",
        workspace: "/data/agents/ant-agent",
        model: "openrouter/auto",
      }),
    ).toBe(true);
  });

  it("returns false when the agent exists but the workspace was reassigned", () => {
    const snapshot = snapshotWith([
      { id: "ant-agent", workspace: "/data/agents/ant-agent", model: "openrouter/auto" },
    ]);
    expect(
      agentMatchesSnapshot(snapshot, {
        agentId: "ant-agent",
        workspace: "/data/agents/ant-agent-v2",
        model: "openrouter/auto",
      }),
    ).toBe(false);
  });

  it("returns false when no entry with this id exists", () => {
    const snapshot = snapshotWith([{ id: "other-agent" }]);
    expect(
      agentMatchesSnapshot(snapshot, {
        agentId: "ant-agent",
        workspace: "/data/agents/ant-agent",
        model: "openrouter/auto",
      }),
    ).toBe(false);
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
    expect(patch.agents.defaults.skipBootstrap).toBe(true);
    expect(patch.agents.defaults.thinkingDefault).toBe("off");
    expect(patch.agents.defaults.memorySearch).toEqual({
      enabled: false,
      sync: {
        onSessionStart: false,
        onSearch: false,
        watch: false,
      },
    });
  });
});

describe("managedBootstrapDefaultsMatchSnapshot", () => {
  it("requires the live gateway defaults to skip vendored bootstrap templates, thinking, and memory search", () => {
    expect(
      managedBootstrapDefaultsMatchSnapshot({
        hash: "h",
        config: {
          agents: {
            defaults: {
              skipBootstrap: true,
              thinkingDefault: "off",
              memorySearch: {
                enabled: false,
                sync: {
                  onSessionStart: false,
                  onSearch: false,
                  watch: false,
                },
              },
            },
          },
        },
      }),
    ).toBe(true);
    expect(
      managedBootstrapDefaultsMatchSnapshot({
        hash: "h",
        config: { agents: { defaults: {} } },
      }),
    ).toBe(false);
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

  it("rejects with a typed RuntimeRateLimitError when the gateway throttles config.patch", async () => {
    const { OpenClawClient } = await import("./client");
    const client = new OpenClawClient({
      gatewayUrl: "wss://gateway.test/socket",
      gatewayToken: "token",
    });

    const sessionPromise = client.withSession(async (rpc) =>
      rpc<{ ok: true }>("config.patch", { raw: "{}", baseHash: "hash" }),
    );

    await flushMicrotasks();
    const socket = sockets[0];
    const connectFrame = parseFrame(socket.sent[0]);
    socket.receive({ type: "res", id: connectFrame.id, ok: true });

    await flushMicrotasks();
    const patchFrame = parseFrame(socket.sent[1]);
    expect(patchFrame.method).toBe("config.patch");
    socket.receive({
      type: "res",
      id: patchFrame.id,
      ok: false,
      error: { message: "rate limit exceeded for config.patch; retry after 4s" },
    });

    await expect(sessionPromise).rejects.toMatchObject({
      name: "RuntimeRateLimitError",
      method: "config.patch",
      retryAfterMs: 4_000,
    });
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
