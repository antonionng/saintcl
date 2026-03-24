import { randomBytes } from "node:crypto";
import { existsSync, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

import { bootstrapTenantRuntime } from "@/lib/openclaw/bootstrap";
import { env } from "@/lib/env";
import { recordSessionActivityEvent } from "@/lib/observability";
import { buildRuntimeDescriptor } from "@/lib/openclaw/paths";
import { upsertRuntimeMetadata } from "@/lib/openclaw/runtime-store";
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
  const runtime = buildRuntimeDescriptor(orgId, {
    gatewayToken: makeGatewayToken(),
  });

  await bootstrapTenantRuntime(runtime, {
    orgId,
    defaultModel: options.defaultModel ?? env.openClawDefaultModel,
    approvedModels: options.approvedModels,
  });

  const currentState = await readRuntimeState(orgId);
  if (!currentState) {
    const nextRuntime = buildRuntimeDescriptor(orgId, {
      status: "stopped",
      gatewayToken: runtime.gatewayToken,
    });
    await persistRuntime(nextRuntime, { status: "stopped" });
    await recordRuntimeLifecycleEvent(nextRuntime, "runtime.initialized", "Prepared runtime metadata.");
    return nextRuntime;
  }

  const nextRuntime = buildRuntimeDescriptor(orgId, {
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
      status: currentState.status,
      pid: currentState.pid,
      gatewayToken: currentState.gatewayToken,
      lastHeartbeatAt: currentState.lastHeartbeatAt,
    });
    await recordRuntimeLifecycleEvent(activeRuntime, "runtime.reused", "Reused an existing online runtime.");
    return activeRuntime;
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
