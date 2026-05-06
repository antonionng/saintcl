import { recordSessionActivityEvent } from "@/lib/observability";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";

type EventLoopHealth = {
  degraded?: boolean;
  reasons?: string[];
  intervalMs?: number;
  delayP99Ms?: number;
  delayMaxMs?: number;
  utilization?: number;
  cpuCoreRatio?: number;
};

type GatewayHealthShape = {
  eventLoop?: EventLoopHealth;
  channels?: Record<string, unknown>;
  ok?: boolean;
};

/**
 * Pulls a single gateway health snapshot and records a session activity event
 * tagged with event-loop pressure metrics. This gives SaintAGI an in-product
 * signal whenever the hosted gateway is CPU bound, queueing requests, or
 * otherwise degraded. Designed to be cheap enough to call once per page load.
 *
 * Returns the parsed pressure sample so callers can also surface it inline
 * (for example, to show a "runtime is busy" notice in the workspace shell).
 */
export async function recordRuntimePressureSample(orgId: string): Promise<EventLoopHealth | null> {
  try {
    const { client } = await getTenantOpenClawClient(orgId, { orgId });
    const health = (await client.health()) as GatewayHealthShape | null;
    const eventLoop = health?.eventLoop;
    if (!eventLoop) {
      return null;
    }

    const degraded = eventLoop.degraded === true;
    await recordSessionActivityEvent({
      orgId,
      source: "openclaw.runtime.health",
      eventType: "runtime.pressure.sample",
      level: degraded ? "warn" : "info",
      message: degraded
        ? `Gateway pressure (${(eventLoop.reasons ?? []).join(",") || "degraded"})`
        : "Gateway healthy",
      metadata: {
        degraded,
        reasons: eventLoop.reasons ?? [],
        intervalMs: eventLoop.intervalMs ?? null,
        delayP99Ms: eventLoop.delayP99Ms ?? null,
        delayMaxMs: eventLoop.delayMaxMs ?? null,
        utilization: eventLoop.utilization ?? null,
        cpuCoreRatio: eventLoop.cpuCoreRatio ?? null,
      },
    }).catch(() => null);

    return eventLoop;
  } catch {
    // Pressure sampling is best-effort observability; never fail the caller.
    return null;
  }
}
