import { NextResponse } from "next/server";

import {
  getCurrentOrg,
  getObservableSessionContext,
  getRequestEventsForSession,
  getSessionActivityEventsForSession,
  getOrgPolicy,
} from "@/lib/dal";
import { syncOpenClawSessionTelemetry } from "@/lib/openclaw/usage-sync";

const encoder = new TextEncoder();

function summarizeRequests(
  events: Array<{
    latency_ms?: number | null;
    total_tokens?: number | null;
    cost_usd?: number | null;
    status?: string | null;
  }>,
) {
  const completed = events.filter((event) => event.status === "completed");
  const totalLatency = completed.reduce((sum, event) => sum + Number(event.latency_ms ?? 0), 0);

  return {
    totalRequests: events.length,
    completedRequests: completed.length,
    failedRequests: events.filter((event) => event.status === "failed").length,
    totalTokens: events.reduce((sum, event) => sum + Number(event.total_tokens ?? 0), 0),
    totalCostUsd: events.reduce((sum, event) => sum + Number(event.cost_usd ?? 0), 0),
    averageLatencyMs: completed.length > 0 ? Math.round(totalLatency / completed.length) : null,
  };
}

export async function GET(
  request: Request,
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

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let interval: ReturnType<typeof setInterval> | null = null;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
        controller.close();
      };

      const emitSnapshot = async () => {
        try {
          const liveTelemetry = await syncOpenClawSessionTelemetry(session.org.id, sessionKey, {
            defaultModel: policy?.default_model ?? undefined,
            logsLimit: 200,
          }).catch(() => null);
          const [requestEvents, activityEvents] = await Promise.all([
            getRequestEventsForSession(session, { sessionKey, limit: 100 }),
            getSessionActivityEventsForSession(session, sessionKey, 200),
          ]);

          const payload = {
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
              status: event.status,
              totalTokens: event.total_tokens,
              costUsd: event.cost_usd,
              latencyMs: event.latency_ms,
              occurredAt: event.occurred_at,
              model: event.model,
              provider: event.provider,
              errorMessage: event.error_message,
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
                message: event.message,
                occurredAt: event.occurred_at,
                metadata: event.metadata ?? {},
              })),
          };

          controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`event: keepalive\ndata: {}\n\n`));
        }
      };

      void emitSnapshot();
      interval = setInterval(() => {
        void emitSnapshot();
      }, 3000);
      timeout = setTimeout(cleanup, 25000);
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
