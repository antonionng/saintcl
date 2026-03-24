"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { Loader2, TerminalSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TerminalRunEntry = {
  id: string;
  command: string;
  exit_code: number;
  stdout_excerpt: string;
  stderr_excerpt: string;
  created_at: string;
};

type TerminalSettingsResponse = {
  enabled: boolean;
  repoPaths: string[];
  workspacePath: string;
  runs: TerminalRunEntry[];
};

type BrowserTerminalMessage =
  | { type: "ready"; sessionId: string; cwd: string; shell?: string }
  | { type: "data"; data: string }
  | { type: "exit"; exitCode: number | null; signal?: string | number | null }
  | { type: "error"; message: string };

function buildWebSocketUrl(socketPath: string) {
  const url = new URL(socketPath, window.location.origin);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function describeExit(exitCode: number | null, signal?: string | number | null) {
  if (typeof signal === "string" || typeof signal === "number") {
    return `Session ended (${signal}).`;
  }
  if (typeof exitCode === "number") {
    return `Session ended with exit code ${exitCode}.`;
  }
  return "Session ended.";
}

export function AgentTerminalPanel({ agentId }: { agentId: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dataDisposableRef = useRef<{ dispose: () => void } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [open, setOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected" | "exited">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [repoPathInput, setRepoPathInput] = useState("");
  const [workspacePath, setWorkspacePath] = useState("");
  const [runs, setRuns] = useState<TerminalRunEntry[]>([]);

  const repoPaths = useMemo(
    () => repoPathInput.split("\n").map((value) => value.trim()).filter(Boolean),
    [repoPathInput],
  );

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/terminal`, { cache: "no-store" });
      const body = (await res.json()) as {
        data?: TerminalSettingsResponse;
        error?: { message?: string };
      };
      if (!res.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to load terminal settings.");
      }

      setEnabled(body.data.enabled);
      setRepoPathInput(body.data.repoPaths.join("\n"));
      setWorkspacePath(body.data.workspacePath);
      setRuns(body.data.runs);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load terminal settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, [agentId]);

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      dataDisposableRef.current?.dispose();
      socketRef.current?.close();
      terminalRef.current?.dispose();
    };
  }, []);

  function ensureTerminalMounted() {
    if (!containerRef.current || terminalRef.current) {
      return;
    }

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: "#05060a",
        foreground: "#f4f4f5",
        cursor: "#ffffff",
        selectionBackground: "rgba(255,255,255,0.18)",
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    dataDisposableRef.current = terminal.onData((data) => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        return;
      }
      socketRef.current.send(JSON.stringify({ type: "input", data }));
    });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (!fitAddonRef.current || socketRef.current?.readyState !== WebSocket.OPEN) {
          return;
        }
        fitAddonRef.current.fit();
        socketRef.current.send(JSON.stringify({
          type: "resize",
          cols: terminal.cols,
          rows: terminal.rows,
        }));
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
  }

  function teardownSocket() {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/terminal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          repoPaths,
        }),
      });
      const body = (await res.json()) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to save terminal settings.");
      }
      setSuccess("Terminal settings saved.");
      await loadSettings();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save terminal settings.");
    } finally {
      setSaving(false);
    }
  }

  async function connectTerminal() {
    ensureTerminalMounted();
    if (!terminalRef.current || !fitAddonRef.current) {
      return;
    }

    setOpen(true);
    setLaunching(true);
    setConnectionState("connecting");
    setError(null);
    terminalRef.current.clear();
    terminalRef.current.writeln("Connecting to the agent terminal...");

    teardownSocket();

    try {
      const res = await fetch(`/api/agents/${agentId}/terminal`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        data?: { socketPath: string };
        error?: { message?: string };
      };
      if (!res.ok || !body.data?.socketPath) {
        throw new Error(body.error?.message || "Unable to start terminal session.");
      }

      const socket = new WebSocket(buildWebSocketUrl(body.data.socketPath));
      socketRef.current = socket;

      socket.addEventListener("message", (event) => {
        let payload: BrowserTerminalMessage;
        try {
          payload = JSON.parse(String(event.data)) as BrowserTerminalMessage;
        } catch {
          setError("Received an invalid terminal event.");
          return;
        }
        if (!terminalRef.current) {
          return;
        }

        if (payload.type === "ready") {
          setConnectionState("connected");
          setLaunching(false);
          setWorkspacePath(payload.cwd);
          fitAddonRef.current?.fit();
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "resize",
              cols: terminalRef.current.cols,
              rows: terminalRef.current.rows,
            }));
          }
          terminalRef.current.focus();
          return;
        }

        if (payload.type === "data") {
          terminalRef.current.write(payload.data);
          return;
        }

        if (payload.type === "exit") {
          setConnectionState("exited");
          setLaunching(false);
          terminalRef.current.writeln(`\r\n${describeExit(payload.exitCode, payload.signal)}`);
          void loadSettings();
          return;
        }

        setConnectionState("exited");
        setLaunching(false);
        setError(payload.message);
        terminalRef.current.writeln(`\r\n${payload.message}`);
      });

      socket.addEventListener("close", () => {
        setConnectionState((current) => (current === "connected" ? "exited" : current));
        setLaunching(false);
        socketRef.current = null;
        void loadSettings();
      });
    } catch (nextError) {
      setConnectionState("disconnected");
      setLaunching(false);
      setError(nextError instanceof Error ? nextError.message : "Unable to start terminal session.");
      terminalRef.current.writeln("\r\nUnable to start terminal session.");
    }
  }

  function disconnectTerminal() {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "kill" }));
    }
    teardownSocket();
    setConnectionState("exited");
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Terminal</h2>
            <Badge variant={enabled ? "success" : "default"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
            {connectionState === "connected" ? (
              <Badge variant="success">Live</Badge>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-zinc-400">
            Admin-only shell access scoped to this agent workspace. Full VM isolation is deferred.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setOpen((current) => !current)}>
            {open ? "Hide terminal" : "Show terminal"}
          </Button>
          <Button
            variant={connectionState === "connected" ? "outline" : "default"}
            onClick={connectionState === "connected" ? disconnectTerminal : connectTerminal}
            disabled={!enabled || launching || loading}
          >
            {launching ? <Loader2 className="size-4 animate-spin" /> : <TerminalSquare className="size-4" />}
            <span>{connectionState === "connected" ? "Disconnect" : "Open terminal"}</span>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm text-white">
            <input
              type="checkbox"
              className="app-checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              disabled={loading || saving}
            />
            <span>Enable terminal access for this agent</span>
          </label>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Workspace path</label>
            <Input value={workspacePath} readOnly />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Git repo allowlist</label>
            <Textarea
              value={repoPathInput}
              onChange={(event) => setRepoPathInput(event.target.value)}
              rows={6}
              readOnly={loading || saving}
              placeholder={".\nrepos/app\nrepos/docs"}
            />
            <p className="text-xs leading-6 text-zinc-500">
              One relative path per line, resolved from the agent workspace. Use `.` to allow the workspace root repo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveSettings} disabled={loading || saving}>
              {saving ? "Saving..." : "Save terminal policy"}
            </Button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        </div>

        <div className="space-y-4">
          {open ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-[#05060a]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                <span>Terminal drawer</span>
                <span>{connectionState}</span>
              </div>
              <div ref={containerRef} className="saintclaw-terminal min-h-[420px] px-3 py-3" />
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Recent terminal sessions</p>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading session history...</p>
            ) : runs.length === 0 ? (
              <p className="text-sm text-zinc-500">No interactive terminal sessions have been recorded yet.</p>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{run.command}</p>
                    <Badge variant={run.exit_code === 0 ? "success" : "warning"}>
                      exit {run.exit_code}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{new Date(run.created_at).toLocaleString()}</p>
                  {run.stdout_excerpt ? (
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/30 p-3 text-xs text-zinc-300">
                      {run.stdout_excerpt}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
