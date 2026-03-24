import { createGatewayTerminalSessionManager } from "../terminal-sessions.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

const terminalSessions = createGatewayTerminalSessionManager();

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function asStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

export const terminalHandlers: GatewayRequestHandlers = {
  "terminal.start": async ({ params, respond, context, client }) => {
    const sessionId = asString(params.sessionId);
    const agentId = asString(params.agentId);
    const cwd = asString(params.cwd);
    const connId = typeof client?.connId === "string" ? client.connId : "";
    const cols = asPositiveInt(params.cols, 120);
    const rows = asPositiveInt(params.rows, 30);
    const allowedGitRepoRoots = asStringList(params.allowedGitRepoRoots);

    if (!sessionId || !agentId || !cwd || !connId) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "terminal.start requires sessionId, agentId, cwd, and a live connection"),
      );
      return;
    }

    try {
      const started = await terminalSessions.startSession({
        sessionId,
        agentId,
        connId,
        cwd,
        cols,
        rows,
        allowedGitRepoRoots,
        emit: (event) => {
          const targets = new Set([connId]);
          if (event.type === "data") {
            context.broadcastToConnIds("terminal.data", {
              sessionId,
              data: event.data,
            }, targets);
            return;
          }
          if (event.type === "exit") {
            context.broadcastToConnIds("terminal.exit", {
              sessionId,
              exitCode: event.exitCode,
              signal: event.signal,
              outputTail: event.outputTail,
            }, targets);
            return;
          }
          context.broadcastToConnIds("terminal.error", {
            sessionId,
            message: event.message,
          }, targets);
        },
      });

      respond(true, {
        sessionId,
        pid: started.pid,
        cwd,
        shell: started.shell,
      });
    } catch (error) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.UNAVAILABLE,
          error instanceof Error ? error.message : "Unable to start terminal session.",
        ),
      );
    }
  },

  "terminal.input": ({ params, respond }) => {
    const sessionId = asString(params.sessionId);
    const data = typeof params.data === "string" ? params.data : "";

    if (!sessionId || !data) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "terminal.input requires sessionId and data"),
      );
      return;
    }

    try {
      terminalSessions.writeInput(sessionId, data);
      respond(true, { ok: true, sessionId });
    } catch (error) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          error instanceof Error ? error.message : "Unable to write to terminal session.",
        ),
      );
    }
  },

  "terminal.resize": ({ params, respond }) => {
    const sessionId = asString(params.sessionId);
    const cols = asPositiveInt(params.cols, 120);
    const rows = asPositiveInt(params.rows, 30);

    if (!sessionId) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "terminal.resize requires sessionId"),
      );
      return;
    }

    try {
      terminalSessions.resize(sessionId, cols, rows);
      respond(true, { ok: true, sessionId, cols, rows });
    } catch (error) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          error instanceof Error ? error.message : "Unable to resize terminal session.",
        ),
      );
    }
  },

  "terminal.kill": ({ params, respond }) => {
    const sessionId = asString(params.sessionId);
    if (!sessionId) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "terminal.kill requires sessionId"),
      );
      return;
    }

    terminalSessions.kill(sessionId);
    respond(true, { ok: true, sessionId });
  },
};
