import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storeDeviceAuthToken } from "./device-auth.ts";
import type { DeviceIdentity } from "./device-identity.ts";

const wsInstances = vi.hoisted((): MockWebSocket[] => []);
const loadOrCreateDeviceIdentityMock = vi.hoisted(() =>
  vi.fn(
    async (): Promise<DeviceIdentity> => ({
      deviceId: "device-1",
      privateKey: "private-key", // pragma: allowlist secret
      publicKey: "public-key", // pragma: allowlist secret
    }),
  ),
);
const signDevicePayloadMock = vi.hoisted(() =>
  vi.fn(async (_privateKeyBase64Url: string, _payload: string) => "signature"),
);

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

type HandlerMap = {
  close: MockWebSocketHandler[];
  error: MockWebSocketHandler[];
  message: MockWebSocketHandler[];
  open: MockWebSocketHandler[];
};

type MockWebSocketHandler = (ev?: { code?: number; data?: string; reason?: string }) => void;

class MockWebSocket {
  static OPEN = 1;

  readonly handlers: HandlerMap = {
    close: [],
    error: [],
    message: [],
    open: [],
  };

  readonly sent: string[] = [];
  readyState = MockWebSocket.OPEN;

  constructor(_url: string) {
    wsInstances.push(this);
  }

  addEventListener(type: keyof HandlerMap, handler: MockWebSocketHandler) {
    this.handlers[type].push(handler);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  emitOpen() {
    for (const handler of this.handlers.open) {
      handler();
    }
  }

  emitMessage(data: unknown) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    for (const handler of this.handlers.message) {
      handler({ data: payload });
    }
  }
}

vi.mock("./device-identity.ts", () => ({
  loadOrCreateDeviceIdentity: loadOrCreateDeviceIdentityMock,
  signDevicePayload: signDevicePayloadMock,
}));

const { GatewayBrowserClient } = await import("./gateway.ts");

function getLatestWebSocket(): MockWebSocket {
  const ws = wsInstances.at(-1);
  if (!ws) {
    throw new Error("missing websocket instance");
  }
  return ws;
}

describe("GatewayBrowserClient", () => {
  beforeEach(() => {
    wsInstances.length = 0;
    loadOrCreateDeviceIdentityMock.mockReset();
    signDevicePayloadMock.mockClear();
    loadOrCreateDeviceIdentityMock.mockResolvedValue({
      deviceId: "device-1",
      privateKey: "private-key", // pragma: allowlist secret
      publicKey: "public-key", // pragma: allowlist secret
    });

    vi.stubGlobal("window", globalThis as Window & typeof globalThis);
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal(
      "navigator",
      { platform: "test-platform", userAgent: "vitest", language: "en-US" } as Navigator,
    );
    localStorage.clear();
    vi.stubGlobal("WebSocket", MockWebSocket);

    storeDeviceAuthToken({
      deviceId: "device-1",
      role: "operator",
      token: "stored-device-token",
      scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("prefers explicit shared auth over cached device tokens", async () => {
    const client = new GatewayBrowserClient({
      url: "ws://127.0.0.1:18789",
      token: "shared-auth-token",
    });

    client.start();
    const ws = getLatestWebSocket();
    ws.emitOpen();
    ws.emitMessage({
      type: "event",
      event: "connect.challenge",
      payload: { nonce: "nonce-1" },
    });
    await vi.waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));

    const connectFrame = JSON.parse(ws.sent.at(-1) ?? "{}") as {
      id?: string;
      method?: string;
      params?: { auth?: { token?: string } };
    };
    expect(typeof connectFrame.id).toBe("string");
    expect(connectFrame.method).toBe("connect");
    expect(connectFrame.params?.auth?.token).toBe("shared-auth-token");
    expect(signDevicePayloadMock).toHaveBeenCalledWith("private-key", expect.any(String));
    const signedPayload = signDevicePayloadMock.mock.calls[0]?.[1];
    expect(signedPayload).toContain("|shared-auth-token|nonce-1");
    expect(signedPayload).not.toContain("stored-device-token");
  });

  it("uses cached device tokens only when no explicit shared auth is provided", async () => {
    const client = new GatewayBrowserClient({
      url: "ws://127.0.0.1:18789",
    });

    client.start();
    const ws = getLatestWebSocket();
    ws.emitOpen();
    ws.emitMessage({
      type: "event",
      event: "connect.challenge",
      payload: { nonce: "nonce-1" },
    });
    await vi.waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));

    const connectFrame = JSON.parse(ws.sent.at(-1) ?? "{}") as {
      id?: string;
      method?: string;
      params?: { auth?: { token?: string } };
    };
    expect(typeof connectFrame.id).toBe("string");
    expect(connectFrame.method).toBe("connect");
    expect(connectFrame.params?.auth?.token).toBe("stored-device-token");
    expect(signDevicePayloadMock).toHaveBeenCalledWith("private-key", expect.any(String));
    const signedPayload = signDevicePayloadMock.mock.calls[0]?.[1];
    expect(signedPayload).toContain("|stored-device-token|nonce-1");
  });

  it("sends periodic health keepalives after connect succeeds", async () => {
    vi.useFakeTimers();

    const client = new GatewayBrowserClient({
      url: "ws://127.0.0.1:18789",
      token: "shared-auth-token",
    });

    client.start();
    const ws = getLatestWebSocket();
    ws.emitOpen();
    ws.emitMessage({
      type: "event",
      event: "connect.challenge",
      payload: { nonce: "nonce-1" },
    });
    await vi.waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));

    const connectFrame = JSON.parse(ws.sent.at(-1) ?? "{}") as { id?: string };
    ws.emitMessage({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {
        type: "hello-ok",
        protocol: 3,
      },
    });

    await vi.advanceTimersByTimeAsync(25_000);

    const healthFrame = JSON.parse(ws.sent.at(-1) ?? "{}") as {
      method?: string;
      params?: { probe?: boolean };
    };
    expect(healthFrame.method).toBe("health");
    expect(healthFrame.params).toEqual({ probe: false });
  });
});
