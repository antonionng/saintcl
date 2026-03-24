import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgPolicy, getRequestEventsForSession, getVisibleAgentsForSession } from "@/lib/dal";
import { syncOpenClawUsageForOrg } from "@/lib/openclaw/usage-sync";

const requestQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
  agentId: z.string().uuid().optional(),
  sessionKey: z.string().min(3).max(255).optional(),
  provider: z.string().min(1).max(255).optional(),
  model: z.string().min(1).max(255).optional(),
  status: z.string().min(1).max(64).optional(),
  source: z.string().min(1).max(64).optional(),
  includeTransport: z.enum(["true", "false"]).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  refresh: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  let filters: z.infer<typeof requestQuerySchema>;
  try {
    const url = new URL(request.url);
    filters = requestQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  if (filters.refresh === "true" && !session.capabilities.canViewAllAgents) {
    return NextResponse.json({ error: { message: "Admin access required to refresh usage." } }, { status: 403 });
  }

  const policy = await getOrgPolicy(session.org.id);
  if (filters.refresh === "true") {
    await syncOpenClawUsageForOrg(session.org.id, {
      defaultModel: policy?.default_model ?? undefined,
      limit: Math.min(filters.limit ?? 25, 25),
      includeLogs: true,
      logsLimit: 60,
    }).catch(() => null);
  }

  const [events, visibleAgents] = await Promise.all([
    getRequestEventsForSession(session, {
      ...filters,
      includeTransport: filters.includeTransport === "true",
    }),
    getVisibleAgentsForSession(session),
  ]);

  const agentMap = new Map(visibleAgents.map((agent) => [agent.id, agent]));
  const items = events.map((event) => ({
    id: event.id,
    orgId: event.org_id,
    agentId: event.agent_id,
    agentName: event.agent_id ? agentMap.get(event.agent_id)?.name ?? null : null,
    sessionKey: event.session_key,
    requestId: event.request_id,
    source: event.source,
    eventType: event.event_type,
    path: event.path,
    method: event.method,
    provider: event.provider,
    model: event.model,
    channel: event.channel,
    status: event.status,
    statusCode: event.status_code,
    latencyMs: event.latency_ms,
    inputTokens: event.input_tokens,
    outputTokens: event.output_tokens,
    totalTokens: event.total_tokens,
    cacheReadTokens: event.cache_read_tokens,
    cacheWriteTokens: event.cache_write_tokens,
    costUsd: event.cost_usd,
    errorCode: event.error_code,
    errorMessage: event.error_message,
    metadata: event.metadata ?? {},
    occurredAt: event.occurred_at,
    createdAt: event.created_at,
  }));

  return NextResponse.json({
    data: {
      items,
      nextBefore: items.length === (filters.limit ?? 25) ? items.at(-1)?.occurredAt ?? null : null,
    },
  });
}
