import WebSocketClient from "ws";
import { NextResponse } from "next/server";

import { resolveAgentTerminalAccess } from "@/lib/openclaw/agent-terminal-access";
import { resolveAllowedGitRepoRoots } from "@/lib/openclaw/agent-terminal";
import { insertTerminalRun } from "@/lib/openclaw/runtime-store";

export const runtime = "nodejs";

type UpgradableNextResponse = typeof NextResponse & {
  upgrade: () => [
    {
      accept: () => void;
      send: (data: string) => void;
      close: () => void;
      addEventListener: (
        type: string,
        listener: (event?: MessageEvent<string>) => void,
      ) => void;
    },
    Response,
  ];
};

type BrowserTerminalMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "kill" };

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function clampTerminalNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(Math.floor(parsed), max));
}

function appendOutputTail(current: string, chunk: string) {
  const next = `${current}${chunk}`;
  return next.length <= 12000 ? next : next.slice(-12000);
}

function sendBrowserFrame(
  socket: { send: (data: string) => void },
  payload:
    | { type: "ready"; sessionId: string; cwd: string; shell?: string }
    | { type: "data"; data: string }
    | { type: "exit"; exitCode: number | null; signal?: string | number | null }
    | { type: "error"; message: string },
) {
  try {
    socket.send(JSON.stringify(payload));
  } catch {
    // ignore browser send failures
  }
}

async function recordTerminalRun(input: {
  orgId: string;
  agentId: string;
  exitCode: number | null;
  outputTail: string;
}) {
  await insertTerminalRun({
    orgId: input.orgId,
    agentId: input.agentId,
    command: "interactive-terminal-session",
    exitCode: input.exitCode ?? 1,
    stdoutExcerpt: input.outputTail.slice(-1000),
    stderrExcerpt: "",
  }).catch(() => null);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const access = await resolveAgentTerminalAccess(id);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() || randomId();
    const cols = clampTerminalNumber(url.searchParams.get("cols"), 120, 40, 240);
    const rows = clampTerminalNumber(url.searchParams.get("rows"), 30, 12, 120);
    const allowedGitRepoRoots = resolveAllowedGitRepoRoots(access.workspacePath, access.repoPaths);
    const [browserSocket, response] = (NextResponse as UpgradableNextResponse).upgrade();

    browserSocket.accept();

    let upstreamConnected = false;
    let started = false;
    let outputTail = "";
    let terminalRunRecorded = false;
    let startRequestId = "";
    let connectRequestId = "";

    const upstream = new WebSocketClient(access.target.wsUrl);

    const closeUpstream = () => {
      try {
        upstream.close();
      } catch {
        // ignore close failures
      }
    };

    browserSocket.addEventListener("message", (event?: MessageEvent<string>) => {
      if (!event || typeof event.data !== "string") {
        return;
      }

      let message: BrowserTerminalMessage;
      try {
        message = JSON.parse(event.data) as BrowserTerminalMessage;
      } catch {
        sendBrowserFrame(browserSocket, { type: "error", message: "Invalid terminal message." });
        return;
      }

      if (!upstreamConnected) {
        return;
      }

      if (message.type === "input" && typeof message.data === "string" && message.data.length > 0) {
        upstream.send(JSON.stringify({
          type: "req",
          id: randomId(),
          method: "terminal.input",
          params: {
            sessionId,
            data: message.data,
          },
        }));
        return;
      }

      if (message.type === "resize") {
        upstream.send(JSON.stringify({
          type: "req",
          id: randomId(),
          method: "terminal.resize",
          params: {
            sessionId,
              cols: clampTerminalNumber(message.cols, 120, 40, 240),
              rows: clampTerminalNumber(message.rows, 30, 12, 120),
          },
        }));
        return;
      }

      if (message.type === "kill") {
        upstream.send(JSON.stringify({
          type: "req",
          id: randomId(),
          method: "terminal.kill",
          params: { sessionId },
        }));
      }
    });

    browserSocket.addEventListener("close", () => {
      if (upstreamConnected && started) {
        try {
          upstream.send(JSON.stringify({
            type: "req",
            id: randomId(),
            method: "terminal.kill",
            params: { sessionId },
          }));
        } catch {
          // ignore kill failures
        }
        setTimeout(closeUpstream, 200);
        return;
      }

      closeUpstream();
    });

    upstream.on("open", () => {
      connectRequestId = randomId();
      upstream.send(JSON.stringify({
        type: "req",
        id: connectRequestId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "gateway-client",
            version: "0.1.0",
            platform: "web",
            mode: "backend",
            displayName: "saintclaw-terminal-proxy",
          },
          role: "operator",
          scopes: ["operator.admin", "operator.read", "operator.write"],
          auth: access.target.token ? { token: access.target.token } : undefined,
        },
      }));
    });

    upstream.on("message", (rawMessage) => {
      const frame = JSON.parse(rawMessage.toString()) as {
        type: "res" | "event";
        id?: string;
        ok?: boolean;
        payload?: Record<string, unknown>;
        error?: { message?: string };
        event?: string;
      };

      if (frame.type === "event") {
        if (frame.event === "terminal.data") {
          const data = typeof frame.payload?.data === "string" ? frame.payload.data : "";
          if (!data) {
            return;
          }
          outputTail = appendOutputTail(outputTail, data);
          sendBrowserFrame(browserSocket, { type: "data", data });
          return;
        }

        if (frame.event === "terminal.exit") {
          const exitCode = typeof frame.payload?.exitCode === "number" ? frame.payload.exitCode : null;
          const signal =
            typeof frame.payload?.signal === "string" || typeof frame.payload?.signal === "number"
              ? frame.payload.signal
              : null;
          const eventOutputTail =
            typeof frame.payload?.outputTail === "string" ? frame.payload.outputTail : outputTail;
          outputTail = appendOutputTail(outputTail, eventOutputTail);
          sendBrowserFrame(browserSocket, { type: "exit", exitCode, signal });
          if (!terminalRunRecorded) {
            terminalRunRecorded = true;
            void recordTerminalRun({
              orgId: access.session.org.id,
              agentId: access.agent.id,
              exitCode,
              outputTail,
            });
          }
          return;
        }

        if (frame.event === "terminal.error") {
          const message = typeof frame.payload?.message === "string"
            ? frame.payload.message
            : "Terminal session failed.";
          sendBrowserFrame(browserSocket, { type: "error", message });
        }
        return;
      }

      if (frame.id === connectRequestId) {
        if (!frame.ok) {
          sendBrowserFrame(browserSocket, {
            type: "error",
            message: frame.error?.message || "Gateway connect failed.",
          });
          browserSocket.close();
          closeUpstream();
          return;
        }

        upstreamConnected = true;
        startRequestId = randomId();
        upstream.send(JSON.stringify({
          type: "req",
          id: startRequestId,
          method: "terminal.start",
          params: {
            sessionId,
            agentId: access.agent.openclaw_agent_id,
            cwd: access.workspacePath,
            cols,
            rows,
            allowedGitRepoRoots,
          },
        }));
        return;
      }

      if (frame.id === startRequestId) {
        if (!frame.ok) {
          sendBrowserFrame(browserSocket, {
            type: "error",
            message: frame.error?.message || "Unable to start terminal session.",
          });
          browserSocket.close();
          closeUpstream();
          return;
        }

        started = true;
        sendBrowserFrame(browserSocket, {
          type: "ready",
          sessionId,
          cwd: access.workspacePath,
          shell: typeof frame.payload?.shell === "string" ? frame.payload.shell : undefined,
        });
        return;
      }

      if (frame.ok === false && frame.error?.message) {
        sendBrowserFrame(browserSocket, {
          type: "error",
          message: frame.error.message,
        });
      }
    });

    upstream.on("error", (error) => {
      sendBrowserFrame(browserSocket, {
        type: "error",
        message: error.message || "Gateway connection failed.",
      });
      browserSocket.close();
    });

    upstream.on("close", () => {
      if (!terminalRunRecorded && outputTail.trim()) {
        terminalRunRecorded = true;
        void recordTerminalRun({
          orgId: access.session.org.id,
          agentId: access.agent.id,
          exitCode: null,
          outputTail,
        });
      }
      try {
        browserSocket.close();
      } catch {
        // ignore close failures
      }
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open terminal session.";
    const status =
      message === "Not authenticated"
        ? 401
        : message === "Admin access required."
          ? 403
          : message === "Agent not found."
            ? 404
            : message === "Terminal access is not enabled for this agent."
              ? 403
              : 503;
    return NextResponse.json({ error: { message } }, { status });
  }
}
