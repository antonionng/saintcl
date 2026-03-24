import { recordUsageCharge } from "@/lib/billing/usage";
import {
  projectSessionUsageLogs,
  recordRequestEvents,
  recordSessionActivityEvents,
} from "@/lib/observability";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import {
  normalizeAgentSessionAlias,
  parseAgentSessionKey,
  parseProviderFromModelRef,
} from "@/lib/openclaw/session-keys";
import { convertUsdToBillingCents } from "@/lib/utils";

type SessionUsageCheckpoint = {
  session_key: string;
  last_total_cost_usd: number;
  agent_id?: string | null;
  model?: string | null;
  provider?: string | null;
  metadata?: Record<string, unknown> | null;
};

type UsageSyncResult = {
  syncedAt: string;
  chargedSessions: number;
  chargedCents: number;
  skippedSessions: number;
  observedRequestEvents: number;
  observedActivityEvents: number;
  lastError?: string;
};

async function syncSessionObservability(input: {
  orgId: string;
  session: {
    key: string;
    agentId?: string;
    modelProvider?: string;
    model?: string;
    channel?: string;
  };
  agent?: {
    id: string;
    user_id?: string | null;
  } | null;
  client: Awaited<ReturnType<typeof getTenantOpenClawClient>>["client"];
  logsLimit?: number;
  logs?: Array<{
    timestamp: number;
    role: "user" | "assistant" | "tool" | "toolResult";
    content: string;
    tokens?: number;
    cost?: number;
  }>;
}) {
  const { requestEvents, activityEvents } = projectSessionUsageLogs({
    orgId: input.orgId,
    session: input.session,
    agentId: input.agent?.id ?? null,
    actorUserId: input.agent?.user_id ?? null,
    logs:
      input.logs ??
      (
        await input.client.getSessionUsageLogs({
          key: input.session.key,
          limit: input.logsLimit ?? 200,
        })
      ).logs ??
      [],
  });

  await Promise.all([
    recordRequestEvents(requestEvents),
    recordSessionActivityEvents(activityEvents),
  ]);

  return {
    observedRequestEvents: requestEvents.length,
    observedActivityEvents: activityEvents.length,
  };
}

function resolveAgentForSession(
  sessionKey: string,
  sessionAgentId: string | undefined,
  agentsByOpenClawId: Map<string, { id: string; user_id?: string | null; name?: string | null; openclaw_agent_id?: string | null }>,
) {
  if (sessionAgentId) {
    const direct = agentsByOpenClawId.get(sessionAgentId);
    if (direct) {
      return direct;
    }
  }

  const parsed = parseAgentSessionKey(sessionKey);
  if (!parsed) {
    return null;
  }

  const direct = agentsByOpenClawId.get(parsed.openclawAgentId);
  if (direct) {
    return direct;
  }

  const alias = normalizeAgentSessionAlias(parsed.openclawAgentId);
  const matches = [...agentsByOpenClawId.values()].filter((agent) => {
    const openclawAgentId = agent.openclaw_agent_id;
    return typeof openclawAgentId === "string" && normalizeAgentSessionAlias(openclawAgentId) === alias;
  });

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

export async function syncOpenClawUsageForOrg(
  orgId: string,
  options: { defaultModel?: string; days?: number; limit?: number; includeLogs?: boolean; logsLimit?: number } = {},
): Promise<UsageSyncResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      syncedAt: new Date().toISOString(),
      chargedSessions: 0,
      chargedCents: 0,
      skippedSessions: 0,
      observedRequestEvents: 0,
      observedActivityEvents: 0,
      lastError: "Supabase admin client is unavailable.",
    };
  }

  try {
    const [{ client }, checkpointsResult, agentsResult] = await Promise.all([
      getTenantOpenClawClient(orgId, { orgId, defaultModel: options.defaultModel }),
      admin
        .from("session_usage_checkpoints")
        .select("session_key, last_total_cost_usd, agent_id, model, provider, metadata")
        .eq("org_id", orgId),
      admin
        .from("agents")
        .select("id, user_id, name, openclaw_agent_id")
        .eq("org_id", orgId),
    ]);

    const usage = await client.getSessionsUsage({
      days: options.days ?? 30,
      limit: options.limit ?? 200,
    });

    const checkpoints = new Map<string, SessionUsageCheckpoint>(
      (checkpointsResult.data ?? []).map((entry) => [entry.session_key as string, entry as SessionUsageCheckpoint]),
    );
    const agentsByOpenClawId = new Map(
      (agentsResult.data ?? []).map((agent) => [agent.openclaw_agent_id as string, agent]),
    );

    let chargedSessions = 0;
    let chargedCents = 0;
    let skippedSessions = 0;
    let observedRequestEvents = 0;
    let observedActivityEvents = 0;

    for (const session of usage.sessions ?? []) {
      const totalCostUsd = Number(session.usage?.totalCost ?? 0);
      const totalTokens = Number(session.usage?.totalTokens ?? 0);
      if (!session.key) {
        skippedSessions += 1;
        continue;
      }

      const previousCostUsd = Number(checkpoints.get(session.key)?.last_total_cost_usd ?? 0);
      const deltaUsd = Math.max(0, totalCostUsd - previousCostUsd);
      const deltaCents = convertUsdToBillingCents(deltaUsd);
      const agent = resolveAgentForSession(session.key, session.agentId, agentsByOpenClawId);
      const model = session.model ?? null;
      const provider = session.modelProvider ?? (model ? parseProviderFromModelRef(model) : null);

      if (deltaCents > 0) {
        await recordUsageCharge({
          orgId,
          userId: agent?.user_id ?? null,
          agentId: agent?.id ?? null,
          eventType: "usage_api",
          amountCents: deltaCents,
          quantity: Math.max(1, totalTokens),
          unit: "tokens",
          sessionKey: session.key,
          description: `Runtime usage for ${agent?.name ?? session.key}`,
          metadata: {
            provider,
            model,
            totalCostUsd,
            deltaCostUsd: deltaUsd,
            totalTokens,
            source: "openclaw.sessions.usage",
          },
        });
        chargedSessions += 1;
        chargedCents += deltaCents;
      } else {
        skippedSessions += 1;
      }

      await admin.from("session_usage_checkpoints").upsert({
        org_id: orgId,
        session_key: session.key,
        agent_id: agent?.id ?? null,
        model,
        provider,
        last_total_cost_usd: totalCostUsd,
        last_total_tokens: totalTokens,
        last_synced_at: new Date().toISOString(),
        metadata: {
          source: "openclaw.sessions.usage",
          channel: session.channel ?? null,
        },
      });

      if (options.includeLogs !== false) {
        try {
          const observed = await syncSessionObservability({
            orgId,
            session,
            agent,
            client,
            logsLimit: options.logsLimit,
          });
          observedRequestEvents += observed.observedRequestEvents;
          observedActivityEvents += observed.observedActivityEvents;
        } catch {
          // A missing session transcript should not fail billing sync.
        }
      }
    }

    const syncedAt = new Date().toISOString();
    const summary = {
      syncedAt,
      chargedSessions,
      chargedCents,
      skippedSessions,
      observedRequestEvents,
      observedActivityEvents,
    };

    await admin.from("usage_sync_states").upsert({
      org_id: orgId,
      last_synced_at: syncedAt,
      summary,
    });

    return summary;
  } catch (error) {
    const syncedAt = new Date().toISOString();
    const lastError = error instanceof Error ? error.message : "Usage sync failed.";

    await admin.from("usage_sync_states").upsert({
      org_id: orgId,
      last_synced_at: syncedAt,
      summary: { lastError },
    });

    return {
      syncedAt,
      chargedSessions: 0,
      chargedCents: 0,
      skippedSessions: 0,
      observedRequestEvents: 0,
      observedActivityEvents: 0,
      lastError,
    };
  }
}

export async function syncOpenClawSessionTelemetry(
  orgId: string,
  sessionKey: string,
  options: { defaultModel?: string; logsLimit?: number } = {},
) {
  const admin = createAdminClient();
  if (!admin) {
    return {
      logs: [],
      timeseries: null,
      observedRequestEvents: 0,
      observedActivityEvents: 0,
      model: null,
      provider: null,
      channel: null,
      agentId: null,
    };
  }

  const [{ client }, checkpointResult] = await Promise.all([
    getTenantOpenClawClient(orgId, { orgId, defaultModel: options.defaultModel }),
    admin
      .from("session_usage_checkpoints")
      .select("agent_id, model, provider, metadata")
      .eq("org_id", orgId)
      .eq("session_key", sessionKey)
      .maybeSingle(),
  ]);

  const checkpoint = checkpointResult.data as SessionUsageCheckpoint | null;
  let agent:
    | {
        id: string;
        user_id?: string | null;
        openclaw_agent_id?: string | null;
      }
    | null = null;

  if (checkpoint?.agent_id) {
    const result = await admin
      .from("agents")
      .select("id, user_id, openclaw_agent_id")
      .eq("org_id", orgId)
      .eq("id", checkpoint.agent_id)
      .maybeSingle();
    agent = result.data ?? null;
  } else {
    const parsed = parseAgentSessionKey(sessionKey);
    if (parsed) {
      const result = await admin
        .from("agents")
        .select("id, user_id, openclaw_agent_id")
        .eq("org_id", orgId)
        .eq("openclaw_agent_id", parsed.openclawAgentId)
        .maybeSingle();
      agent = result.data ?? null;
    }
  }

  const session = {
    key: sessionKey,
    agentId: agent?.openclaw_agent_id ?? undefined,
    modelProvider: checkpoint?.provider ?? undefined,
    model: checkpoint?.model ?? undefined,
    channel:
      checkpoint?.metadata && typeof checkpoint.metadata.channel === "string"
        ? checkpoint.metadata.channel
        : undefined,
  };

  let observedRequestEvents = 0;
  let observedActivityEvents = 0;
  let logs: Array<{
    timestamp: number;
    role: "user" | "assistant" | "tool" | "toolResult";
    content: string;
    tokens?: number;
    cost?: number;
  }> = [];
  let timeseries: Awaited<ReturnType<typeof client.getSessionUsageTimeSeries>> | null = null;

  try {
    const [logsResponse, timeseriesResponse] = await Promise.all([
      client.getSessionUsageLogs({
        key: sessionKey,
        limit: options.logsLimit ?? 200,
      }),
      client.getSessionUsageTimeSeries({ key: sessionKey }).catch(() => null),
    ]);

    logs = logsResponse.logs ?? [];
    timeseries = timeseriesResponse;

    const observed = await syncSessionObservability({
      orgId,
      session,
      agent,
      client,
      logsLimit: options.logsLimit,
      logs,
    });
    observedRequestEvents = observed.observedRequestEvents;
    observedActivityEvents = observed.observedActivityEvents;
  } catch {
    // Some sessions may not yet have transcript-backed usage data.
  }

  return {
    logs,
    timeseries,
    observedRequestEvents,
    observedActivityEvents,
    model: session.model ?? null,
    provider: session.modelProvider ?? null,
    channel: session.channel ?? null,
    agentId: agent?.id ?? checkpoint?.agent_id ?? null,
  };
}
