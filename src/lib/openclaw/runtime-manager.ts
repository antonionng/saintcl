import { randomBytes } from "node:crypto";
import { existsSync, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

import { bootstrapTenantRuntime } from "@/lib/openclaw/bootstrap";
import { env } from "@/lib/env";
import { buildRuntimeDescriptor } from "@/lib/openclaw/paths";
import type {
  BootstrapTenantOptions,
  OpenClawRuntimeDescriptor,
  OpenClawRuntimeState,
} from "@/lib/openclaw/runtime-types";

function makeGatewayToken() {
  return randomBytes(24).toString("hex");
}

async function writeRuntimeState(runtime: OpenClawRuntimeDescriptor, state: Partial<OpenClawRuntimeState>) {
  const nextState: OpenClawRuntimeState = {
    id: runtime.id,
    orgId: runtime.orgId,
    gatewayPort: runtime.gatewayPort,
    gatewayUrl: runtime.gatewayUrl,
    gatewayToken: runtime.gatewayToken,
    vendorPath: runtime.vendorPath,
    status: state.status ?? runtime.status,
    pid: state.pid ?? runtime.pid,
    startedAt: state.startedAt,
    lastHeartbeatAt: state.lastHeartbeatAt ?? runtime.lastHeartbeatAt,
  };

  await mkdir(runtime.paths.root, { recursive: true });
  await writeFile(runtime.paths.metadataPath, JSON.stringify(nextState, null, 2), "utf8");
}

export async function readRuntimeState(orgId: string) {
  const runtime = buildRuntimeDescriptor(orgId);
  if (!existsSync(runtime.paths.metadataPath)) {
    return null;
  }

  const raw = await readFile(runtime.paths.metadataPath, "utf8");
  return JSON.parse(raw) as OpenClawRuntimeState;
}

export async function ensureTenantRuntime(
  orgId: string,
  options: BootstrapTenantOptions = { orgId },
) {
  const runtime = buildRuntimeDescriptor(orgId, {
    gatewayToken: makeGatewayToken(),
  });

  await bootstrapTenantRuntime(runtime, {
    orgId,
    defaultModel: options.defaultModel ?? env.openClawDefaultModel,
  });

  const currentState = await readRuntimeState(orgId);
  if (!currentState) {
    await writeRuntimeState(runtime, { status: "stopped" });
    return runtime;
  }

  return buildRuntimeDescriptor(orgId, {
    status: currentState.status,
    pid: currentState.pid,
    gatewayToken: currentState.gatewayToken,
    lastHeartbeatAt: currentState.lastHeartbeatAt,
  });
}

export async function startTenantRuntime(orgId: string) {
  const runtime = await ensureTenantRuntime(orgId, { orgId });
  const currentState = await readRuntimeState(orgId);

  if (currentState?.pid && currentState.status === "online") {
    return buildRuntimeDescriptor(orgId, {
      status: currentState.status,
      pid: currentState.pid,
      gatewayToken: currentState.gatewayToken,
      lastHeartbeatAt: currentState.lastHeartbeatAt,
    });
  }

  await mkdir(runtime.paths.logsDir, { recursive: true });
  const logStream = createWriteStream(runtime.paths.gatewayLogPath, { flags: "a" });

  const child = spawn(
    process.execPath,
    ["openclaw.mjs", "gateway", "run", "--port", String(runtime.gatewayPort), "--bind", "127.0.0.1"],
    {
      cwd: runtime.vendorPath,
      env: {
        ...process.env,
        OPENCLAW_STATE_DIR: runtime.paths.stateRoot,
        OPENCLAW_CONFIG_PATH: runtime.paths.configPath,
      },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  child.unref();

  const nextRuntime = buildRuntimeDescriptor(orgId, {
    status: "online",
    pid: child.pid,
    gatewayToken: runtime.gatewayToken,
    lastHeartbeatAt: new Date().toISOString(),
  });

  await writeRuntimeState(nextRuntime, {
    status: "online",
    pid: child.pid,
    startedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
  });

  return nextRuntime;
}

export async function stopTenantRuntime(orgId: string) {
  const currentState = await readRuntimeState(orgId);
  if (currentState?.pid) {
    try {
      process.kill(currentState.pid);
    } catch {
      // Ignore stale pid state.
    }
  }

  const runtime = buildRuntimeDescriptor(orgId, {
    status: "stopped",
    gatewayToken: currentState?.gatewayToken,
  });
  await writeRuntimeState(runtime, { status: "stopped" });
  return runtime;
}

export async function restartTenantRuntime(orgId: string) {
  await stopTenantRuntime(orgId);
  return startTenantRuntime(orgId);
}
