import { appendFile, readFile } from "node:fs/promises";

import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

export async function appendRuntimeAuditEvent(
  runtime: OpenClawRuntimeDescriptor,
  action: string,
  details: Record<string, unknown>,
) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    details,
  });

  await appendFile(runtime.paths.gatewayLogPath, `${line}\n`, "utf8");
}

export async function readRuntimeLogTail(
  runtime: OpenClawRuntimeDescriptor,
  lines = 40,
) {
  try {
    const content = await readFile(runtime.paths.gatewayLogPath, "utf8");
    return content.trim().split("\n").slice(-lines);
  } catch {
    return [];
  }
}
