import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveShellFromPath } from "../agents/shell-utils.js";
import { createPtyAdapter } from "../process/supervisor/adapters/pty.js";

type TerminalLifecycleEvent =
  | { type: "data"; data: string }
  | { type: "exit"; exitCode: number | null; signal: NodeJS.Signals | number | null; outputTail: string }
  | { type: "error"; message: string };

type GatewayTerminalSession = {
  sessionId: string;
  agentId: string;
  connId: string;
  cwd: string;
  startedAt: number;
  outputTail: string;
  policyScriptPath: string;
  adapter: Awaited<ReturnType<typeof createPtyAdapter>>;
  emit: (event: TerminalLifecycleEvent) => void;
};

const OUTPUT_TAIL_LIMIT = 12000;

function quoteShellSingle(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function appendOutputTail(current: string, chunk: string) {
  const next = `${current}${chunk}`;
  return next.length <= OUTPUT_TAIL_LIMIT ? next : next.slice(-OUTPUT_TAIL_LIMIT);
}

function buildPolicyScript(input: {
  cwd: string;
  allowedGitRepoRoots: string[];
}) {
  const allowedRoots = input.allowedGitRepoRoots.map((entry) => path.resolve(entry));
  const allowedRootsBody = allowedRoots.join("\n");

  return `export SAINTCLAW_TERMINAL_WORKSPACE=${quoteShellSingle(path.resolve(input.cwd))}
_saintclaw_pwd() {
  pwd -P 2>/dev/null || pwd
}
_saintclaw_within_workspace() {
  case "$1" in
    "$SAINTCLAW_TERMINAL_WORKSPACE"|"$SAINTCLAW_TERMINAL_WORKSPACE"/*) return 0 ;;
    *) return 1 ;;
  esac
}
_saintclaw_guard_pwd() {
  local current
  current="$(_saintclaw_pwd)"
  if ! _saintclaw_within_workspace "$current"; then
    builtin cd "$SAINTCLAW_TERMINAL_WORKSPACE" >/dev/null 2>&1 || return 1
  fi
}
cd() {
  local previous current
  previous="$(_saintclaw_pwd)"
  if [ "$#" -eq 0 ]; then
    builtin cd "$SAINTCLAW_TERMINAL_WORKSPACE" || return $?
  else
    builtin cd "$@" || return $?
  fi
  current="$(_saintclaw_pwd)"
  if _saintclaw_within_workspace "$current"; then
    return 0
  fi
  printf 'Blocked: paths must stay inside %s\n' "$SAINTCLAW_TERMINAL_WORKSPACE" >&2
  builtin cd "$previous" >/dev/null 2>&1 || return 1
  return 1
}
git() {
  local arg repo_root allowed_root
  for arg in "$@"; do
    case "$arg" in
      -C|--git-dir|--work-tree)
        printf 'Blocked: git path overrides are disabled in this terminal.\n' >&2
        return 1
        ;;
      clone|init|submodule|worktree)
        printf 'Blocked: git %s is disabled in this terminal.\n' "$arg" >&2
        return 1
        ;;
    esac
  done

  repo_root="$(command git rev-parse --show-toplevel 2>/dev/null)" || {
    printf 'Blocked: git commands are only allowed inside an allowlisted repo.\n' >&2
    return 1
  }
  repo_root="$(cd "$repo_root" && _saintclaw_pwd)"

  while IFS= read -r allowed_root; do
    [ -n "$allowed_root" ] || continue
    case "$repo_root" in
      "$allowed_root"|"$allowed_root"/*)
        command git "$@"
        return $?
        ;;
    esac
  done <<'EOF'
${allowedRootsBody}
EOF

  printf 'Blocked: this repository is not in the allowlist.\n' >&2
  return 1
}
_saintclaw_guard_pwd
export PS1='[SaintClaw] \\w \\$ '
`;
}

async function writeTerminalPolicyScript(params: {
  sessionId: string;
  cwd: string;
  allowedGitRepoRoots: string[];
}) {
  const stateRoot = process.env.OPENCLAW_STATE_DIR?.trim() || path.join(os.tmpdir(), "openclaw-state");
  const terminalRoot = path.join(stateRoot, "saintclaw-terminal");
  await fs.mkdir(terminalRoot, { recursive: true });

  const scriptPath = path.join(terminalRoot, `${params.sessionId}-${randomUUID()}.bashrc`);
  await fs.writeFile(
    scriptPath,
    buildPolicyScript({
      cwd: params.cwd,
      allowedGitRepoRoots: params.allowedGitRepoRoots,
    }),
    "utf8",
  );
  return scriptPath;
}

function resolveInteractiveShell() {
  return resolveShellFromPath("bash") ?? process.env.SHELL?.trim() ?? "bash";
}

export function createGatewayTerminalSessionManager() {
  const sessions = new Map<string, GatewayTerminalSession>();

  const cleanupSession = async (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (!session) {
      return;
    }
    sessions.delete(sessionId);
    try {
      session.adapter.dispose();
    } catch {
      // ignore cleanup failures
    }
    await fs.rm(session.policyScriptPath, { force: true }).catch(() => undefined);
  };

  return {
    async startSession(input: {
      sessionId: string;
      agentId: string;
      connId: string;
      cwd: string;
      cols?: number;
      rows?: number;
      allowedGitRepoRoots: string[];
      emit: (event: TerminalLifecycleEvent) => void;
    }) {
      if (sessions.has(input.sessionId)) {
        throw new Error(`terminal session "${input.sessionId}" already exists`);
      }

      const policyScriptPath = await writeTerminalPolicyScript({
        sessionId: input.sessionId,
        cwd: input.cwd,
        allowedGitRepoRoots: input.allowedGitRepoRoots,
      });
      const shell = resolveInteractiveShell();
      const adapter = await createPtyAdapter({
        shell,
        args: ["--noprofile", "--rcfile", policyScriptPath, "-i"],
        cwd: input.cwd,
        cols: input.cols,
        rows: input.rows,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          SAINTCLAW_TERMINAL_AGENT_ID: input.agentId,
          SAINTCLAW_TERMINAL_SESSION_ID: input.sessionId,
        },
      });

      const session: GatewayTerminalSession = {
        sessionId: input.sessionId,
        agentId: input.agentId,
        connId: input.connId,
        cwd: input.cwd,
        startedAt: Date.now(),
        outputTail: "",
        policyScriptPath,
        adapter,
        emit: input.emit,
      };

      adapter.onStdout((chunk) => {
        session.outputTail = appendOutputTail(session.outputTail, chunk);
        session.emit({ type: "data", data: chunk });
      });

      void adapter.wait()
        .then(async (result) => {
          session.emit({
            type: "exit",
            exitCode: result.code,
            signal: result.signal,
            outputTail: session.outputTail,
          });
          await cleanupSession(session.sessionId);
        })
        .catch(async (error) => {
          session.emit({
            type: "error",
            message: error instanceof Error ? error.message : "Terminal session failed.",
          });
          await cleanupSession(session.sessionId);
        });

      sessions.set(session.sessionId, session);
      return {
        sessionId: session.sessionId,
        pid: adapter.pid ?? null,
        shell,
      };
    },

    writeInput(sessionId: string, data: string) {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error("Terminal session not found.");
      }
      session.adapter.stdin?.write(data);
    },

    resize(sessionId: string, cols: number, rows: number) {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error("Terminal session not found.");
      }
      session.adapter.resize?.(cols, rows);
    },

    kill(sessionId: string) {
      const session = sessions.get(sessionId);
      if (!session) {
        return;
      }
      session.adapter.kill("SIGKILL");
    },

    get(sessionId: string) {
      return sessions.get(sessionId);
    },
  };
}
