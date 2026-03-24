import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
  writeInput: vi.fn(),
  resize: vi.fn(),
  kill: vi.fn(),
}));

vi.mock("../terminal-sessions.js", () => ({
  createGatewayTerminalSessionManager: () => ({
    startSession: mocks.startSession,
    writeInput: mocks.writeInput,
    resize: mocks.resize,
    kill: mocks.kill,
    get: vi.fn(),
  }),
}));

import { terminalHandlers } from "./terminal.js";

describe("terminalHandlers", () => {
  it("starts a session and forwards terminal events to the requesting connection", async () => {
    const broadcastToConnIds = vi.fn();
    mocks.startSession.mockImplementation(async ({ emit }) => {
      emit({ type: "data", data: "hello" });
      emit({ type: "exit", exitCode: 0, signal: null, outputTail: "hello" });
      return { sessionId: "session-1", pid: 321, shell: "/bin/bash" };
    });

    const respond = vi.fn();
    await terminalHandlers["terminal.start"]({
      params: {
        sessionId: "session-1",
        agentId: "agent-alpha",
        cwd: "/tmp/agent-alpha",
        cols: 120,
        rows: 32,
        allowedGitRepoRoots: ["/tmp/agent-alpha"],
      },
      respond: respond as never,
      context: { broadcastToConnIds } as never,
      client: { connId: "conn-1" } as never,
      req: { type: "req", id: "start-1", method: "terminal.start" },
      isWebchatConnect: () => false,
    });

    expect(mocks.startSession).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith(true, {
      sessionId: "session-1",
      pid: 321,
      cwd: "/tmp/agent-alpha",
      shell: "/bin/bash",
    });
    expect(broadcastToConnIds).toHaveBeenCalledTimes(2);
    expect(broadcastToConnIds.mock.calls[0]?.[0]).toBe("terminal.data");
    expect(broadcastToConnIds.mock.calls[0]?.[1]).toEqual({
      sessionId: "session-1",
      data: "hello",
    });
    expect(broadcastToConnIds.mock.calls[1]?.[0]).toBe("terminal.exit");
    expect(broadcastToConnIds.mock.calls[1]?.[1]).toEqual({
      sessionId: "session-1",
      exitCode: 0,
      signal: null,
      outputTail: "hello",
    });
  });

  it("rejects empty terminal input payloads", async () => {
    const respond = vi.fn();
    terminalHandlers["terminal.input"]({
      params: {
        sessionId: "session-1",
        data: "",
      },
      respond: respond as never,
      context: {} as never,
      client: null,
      req: { type: "req", id: "input-1", method: "terminal.input" },
      isWebchatConnect: () => false,
    });

    expect(mocks.writeInput).not.toHaveBeenCalled();
    expect(respond.mock.calls[0]?.[0]).toBe(false);
    expect(respond.mock.calls[0]?.[2]?.message).toContain("terminal.input requires sessionId and data");
  });
});
