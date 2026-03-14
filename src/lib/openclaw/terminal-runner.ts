import { spawn } from "node:child_process";

import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

export interface TerminalRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export async function runApprovedTerminalCommand(
  runtime: OpenClawRuntimeDescriptor,
  input: {
    command: string;
    cwd: string;
    timeoutMs?: number;
  },
) {
  return new Promise<TerminalRunResult>((resolve, reject) => {
    const child = spawn("bash", ["-lc", input.command], {
      cwd: input.cwd,
      env: {
        ...process.env,
        OPENCLAW_STATE_DIR: runtime.paths.stateRoot,
        OPENCLAW_CONFIG_PATH: runtime.paths.configPath,
        SAINTCLAW_TERMINAL_POLICY: "admin-only",
      },
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, input.timeoutMs ?? 30_000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({ exitCode, stdout, stderr });
    });
  });
}
