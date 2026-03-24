import { NextResponse } from "next/server";

import {
  getCurrentOrg,
  getObservableSessionContext,
  getRequestEventsForSession,
  getSessionActivityEventsForSession,
  getOrgPolicy,
} from "@/lib/dal";
import { syncOpenClawSessionTelemetry } from "@/lib/openclaw/usage-sync";

function summarizeRequests(
  events: Array<{
    latency_ms?: number | null;
    total_tokens?: number | null;
    cost_usd?: number | null;
    status?: string | null;
  }>,
) {
  const completed = events.filter((event) => event.status === "completed");
  const failed = events.filter((event) => event.status === "failed");
  const totalLatency = completed.reduce((sum, event) => sum + Number(event.latency_ms ?? 0), 0);

  return {
    totalRequests: events.length,
    completedRequests: completed.length,
    failedRequests: failed.length,
    totalTokens: events.reduce((sum, event) => sum + Number(event.total_tokens ?? 0), 0),
    totalCostUsd: events.reduce((sum, event) => sum + Number(event.cost_usd ?? 0), 0),
    averageLatencyMs: completed.length > 0 ? Math.round(totalLatency / completed.length) : null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const { key } = await context.params;
  const sessionKey = decodeURIComponent(key);
  const observableSession = await getObservableSessionContext(sessionKey, session);
  if (!observableSession) {
    return NextResponse.json({ error: { message: "Session not found." } }, { status: 404 });
  }

  const policy = await getOrgPolicy(session.org.id);
  const liveTelemetry = await syncOpenClawSessionTelemetry(session.org.id, sessionKey, {
    defaultModel: policy?.default_model ?? undefined,
    logsLimit: 200,
  }).catch(() => null);

  const [requestEvents, activityEvents] = await Promise.all([
    getRequestEventsForSession(session, { sessionKey, limit: 100 }),
    getSessionActivityEventsForSession(session, sessionKey, 200),
  ]);

  return NextResponse.json({
    data: {
      sessionKey,
      agent: {
        id: observableSession.agent.id,
        name: observableSession.agent.name,
      },
      provider: liveTelemetry?.provider ?? observableSession.provider ?? null,
      model: liveTelemetry?.model ?? observableSession.model ?? null,
      channel: liveTelemetry?.channel ?? null,
      stats: summarizeRequests(requestEvents),
      timeseries: liveTelemetry?.timeseries ?? null,
      requestEvents: requestEvents.map((event) => ({
        id: event.id,
        requestId: event.request_id,
        source: event.source,
        eventType: event.event_type,
        provider: event.provider,
        model: event.model,
        channel: event.channel,
        status: event.status,
        statusCode: event.status_code,
        latencyMs: event.latency_ms,
        totalTokens: event.total_tokens,
        costUsd: event.cost_usd,
        errorCode: event.error_code,
        errorMessage: event.error_message,
        occurredAt: event.occurred_at,
      })),
      activityEvents: activityEvents
        .slice()
        .reverse()
        .map((event) => ({
          id: event.id,
          source: event.source,
          eventType: event.event_type,
          level: event.level,
          role: event.role,
          provider: event.provider,
          model: event.model,
          channel: event.channel,
          message: event.message,
          metadata: event.metadata ?? {},
          occurredAt: event.occurred_at,
        })),
    },
  });
}
