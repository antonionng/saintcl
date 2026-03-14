import { readRuntimeState } from "@/lib/openclaw/runtime-manager";
import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

export async function getRuntimeHealth(runtime: OpenClawRuntimeDescriptor) {
  const state = await readRuntimeState(runtime.orgId);

  return {
    orgId: runtime.orgId,
    status: state?.status ?? runtime.status,
    gatewayPort: state?.gatewayPort ?? runtime.gatewayPort,
    pid: state?.pid ?? runtime.pid,
    lastHeartbeatAt: state?.lastHeartbeatAt ?? runtime.lastHeartbeatAt,
  };
}
