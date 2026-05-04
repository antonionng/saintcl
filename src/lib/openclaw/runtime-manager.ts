import { randomBytes } from "node:crypto";
import { existsSync, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

import { bootstrapTenantRuntime } from "@/lib/openclaw/bootstrap";
import { env } from "@/lib/env";
import { recordSessionActivityEvent } from "@/lib/observability";
import { buildRuntimeDescriptor } from "@/lib/openclaw/paths";
import { listAllocatedRuntimePorts, upsertRuntimeMetadata } from "@/lib/openclaw/runtime-store";
import type {
  BootstrapTenantOptions,
  OpenClawRuntimeDescriptor,
  OpenClawRuntimeState,
} from "@/lib/openclaw/runtime-types";

function makeGatewayToken() {
  return randomBytes(24).toString("hex");
}

function isProcessAlive(pid: number | undefined) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === "EPERM";
  }
}

async function resolveAvailableGatewayPort(orgId: string) {
  const preferredPort = buildRuntimeDescriptor(orgId).gatewayPort;
  const allocatedPorts = new Set(await listAllocatedRuntimePorts(orgId));
  if (!allocatedPorts.has(preferredPort)) {
    return preferredPort;
  }

  const preferredOffset = preferredPort - env.openClawBasePort;
  for (let offset = 1; offset < 1000; offset += 1) {
    const candidatePort = env.openClawBasePort + ((preferredOffset + offset) % 1000);
    if (!allocatedPorts.has(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error("No available runtime gateway ports remain in the configured range.");
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

async function persistRuntime(runtime: OpenClawRuntimeDescriptor, state?: Partial<OpenClawRuntimeState>) {
  if (state) {
    await writeRuntimeState(runtime, state);
  }
  await upsertRuntimeMetadata(runtime);
}

async function recordRuntimeLifecycleEvent(
  runtime: OpenClawRuntimeDescriptor,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  await recordSessionActivityEvent({
    orgId: runtime.orgId,
    source: "runtime_lifecycle",
    eventType,
    message,
    occurredAt: new Date().toISOString(),
    metadata: {
      gatewayPort: runtime.gatewayPort,
      pid: runtime.pid ?? null,
      status: runtime.status,
      ...metadata,
    },
  });
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
  const currentState = await readRuntimeState(orgId);
  const runtime = buildRuntimeDescriptor(orgId, {
    gatewayPort: currentState?.gatewayPort ?? await resolveAvailableGatewayPort(orgId),
    gatewayToken: currentState?.gatewayToken ?? makeGatewayToken(),
    status: currentState?.status,
    pid: currentState?.pid,
    lastHeartbeatAt: currentState?.lastHeartbeatAt,
  });

  await bootstrapTenantRuntime(runtime, {
    orgId,
    defaultModel: options.defaultModel ?? env.openClawDefaultModel,
    approvedModels: options.approvedModels,
  });

  if (!currentState) {
    const nextRuntime = buildRuntimeDescriptor(orgId, {
      gatewayPort: runtime.gatewayPort,
      status: "stopped",
      gatewayToken: runtime.gatewayToken,
    });
    await persistRuntime(nextRuntime, { status: "stopped" });
    await recordRuntimeLifecycleEvent(nextRuntime, "runtime.initialized", "Prepared runtime metadata.");
    return nextRuntime;
  }

  const nextRuntime = buildRuntimeDescriptor(orgId, {
    gatewayPort: runtime.gatewayPort,
    status: currentState.status,
    pid: currentState.pid,
    gatewayToken: currentState.gatewayToken,
    lastHeartbeatAt: currentState.lastHeartbeatAt,
  });
  await persistRuntime(nextRuntime);
  return nextRuntime;
}

export async function startTenantRuntime(
  orgId: string,
  options: BootstrapTenantOptions = { orgId },
) {
  const runtime = await ensureTenantRuntime(orgId, options);
  const currentState = await readRuntimeState(orgId);

  if (currentState?.pid && currentState.status === "online") {
    const activeRuntime = buildRuntimeDescriptor(orgId, {
      gatewayPort: currentState.gatewayPort,
      status: currentState.status,
      pid: currentState.pid,
      gatewayToken: currentState.gatewayToken,
      lastHeartbeatAt: currentState.lastHeartbeatAt,
    });
    if (isProcessAlive(currentState.pid)) {
      await recordRuntimeLifecycleEvent(activeRuntime, "runtime.reused", "Reused an existing online runtime.");
      return activeRuntime;
    }

    const staleRuntime = buildRuntimeDescriptor(orgId, {
      gatewayPort: currentState.gatewayPort,
      status: "stopped",
      gatewayToken: currentState.gatewayToken,
      lastHeartbeatAt: currentState.lastHeartbeatAt,
    });
    await persistRuntime(staleRuntime, { status: "stopped" });
    await recordRuntimeLifecycleEvent(staleRuntime, "runtime.stale_pid", "Cleared stale runtime pid before restart.", {
      stalePid: currentState.pid,
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

  await persistRuntime(nextRuntime, {
    status: "online",
    pid: child.pid,
    startedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
  });
  await recordRuntimeLifecycleEvent(nextRuntime, "runtime.started", "Started the tenant runtime process.");

  return nextRuntime;
}

export async function stopTenantRuntime(orgId: string) {
  const currentState = await readRuntimeState(orgId);
  if (currentState?.pid) {
    if (isProcessAlive(currentState.pid)) {
      process.kill(currentState.pid);
    }
  }

  const runtime = buildRuntimeDescriptor(orgId, {
    gatewayPort: currentState?.gatewayPort,
    status: "stopped",
    gatewayToken: currentState?.gatewayToken,
  });
  await persistRuntime(runtime, { status: "stopped" });
  await recordRuntimeLifecycleEvent(runtime, "runtime.stopped", "Stopped the tenant runtime process.");
  return runtime;
}

export async function restartTenantRuntime(orgId: string) {
  await stopTenantRuntime(orgId);
  const runtime = await startTenantRuntime(orgId, { orgId });
  await recordRuntimeLifecycleEvent(runtime, "runtime.restarted", "Restarted the tenant runtime process.");
  return runtime;
}
