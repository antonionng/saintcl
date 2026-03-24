"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionSnapshot = {
  sessionKey: string;
  agent: {
    id: string;
    name: string;
  };
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  stats: {
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalCostUsd: number;
    averageLatencyMs?: number | null;
  };
  timeseries?: {
    points?: Array<{
      timestamp: number;
      tokens: number;
      cost: number;
    }>;
  } | null;
  requestEvents: Array<{
    id: string;
    status: string;
    totalTokens?: number | null;
    costUsd?: number | null;
    latencyMs?: number | null;
    occurredAt: string;
    model?: string | null;
    provider?: string | null;
    errorMessage?: string | null;
  }>;
  activityEvents: Array<{
    id: string;
    source: string;
    eventType: string;
    level: string;
    role?: string | null;
    message: string;
    occurredAt: string;
    metadata?: Record<string, unknown>;
  }>;
};

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "$0.00";
  return `$${value.toFixed(4)}`;
}

function formatLatency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "n/a";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (normalized === "failed") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }
  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

export function SessionLogTail({
  sessionKey,
  title = "Session tail",
  compact = false,
}: {
  sessionKey?: string | null;
  title?: string;
  compact?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionKey) {
      setSnapshot(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/observability/sessions/${encodeURIComponent(sessionKey)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as { data?: SessionSnapshot; error?: { message?: string } };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "Unable to load session telemetry.");
        }
        if (!cancelled) {
          setSnapshot(payload.data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load session telemetry.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchSnapshot();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey) {
      return;
    }

    const stream = new EventSource(`/api/observability/sessions/${encodeURIComponent(sessionKey)}/stream`);
    stream.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as Omit<SessionSnapshot, "sessionKey">;
        setSnapshot((current) => ({
          ...(current ?? {
            sessionKey,
            agent: payload.agent,
            stats: payload.stats,
            requestEvents: [],
            activityEvents: [],
          }),
          ...payload,
          sessionKey,
        }));
      } catch {
        // Ignore malformed SSE payloads.
      }
    });
    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
    };
  }, [sessionKey]);

  const points = useMemo(() => {
    return snapshot?.timeseries?.points?.slice(-12) ?? [];
  }, [snapshot]);

  const maxPointTokens = Math.max(...points.map((point) => point.tokens), 1);

  return (
    <Card className="h-full">
      <CardHeader className={compact ? "p-5" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-zinc-400">
              {compact
                ? "Live session summary and the latest request metrics."
                : "Review the selected session, including usage totals, recent request outcomes, and activity events."}
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            {sessionKey ? "Live stream" : "Awaiting selection"}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-4 p-5 pt-0" : "space-y-4"}>
        {!sessionKey ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
            Select a session to inspect live activity.
          </div>
        ) : null}

        {loading && !snapshot ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
            Loading live session telemetry...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        {snapshot ? (
          <>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Session</p>
                  <h3 className="text-lg font-medium text-white">{snapshot.agent.name}</h3>
                  <p className="text-xs text-zinc-500">{snapshot.sessionKey}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-sm text-zinc-300">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Model</p>
                  <p className="mt-1">{snapshot.provider ?? "unknown"} / {snapshot.model ?? "unknown"}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Requests", value: snapshot.stats.totalRequests.toLocaleString() },
                  { label: "Tokens", value: snapshot.stats.totalTokens.toLocaleString() },
                  { label: "Cost", value: formatCurrency(snapshot.stats.totalCostUsd) },
                  { label: "Avg latency", value: formatLatency(snapshot.stats.averageLatencyMs) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{stat.label}</p>
                    <p className="mt-2 text-lg font-medium text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {points.length > 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent usage cadence</p>
                  <p className="text-xs text-zinc-500">Last {points.length} intervals</p>
                </div>
                <div className="mt-4 flex items-end gap-2 rounded-2xl border border-white/8 bg-black/20 p-3">
                  {points.map((point) => (
                    <div key={point.timestamp} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-full bg-emerald-400/70"
                        style={{ height: `${Math.max(10, Math.round((point.tokens / maxPointTokens) * 72))}px` }}
                      />
                      <span className="text-[11px] text-zinc-500">
                        {new Date(point.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent request metrics</p>
                <p className="text-xs text-zinc-500">
                  Showing {Math.min(snapshot.requestEvents.length, compact ? 6 : 10)} most recent
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {snapshot.requestEvents.slice(0, compact ? 6 : 10).map((event) => (
                  <div key={event.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                          {new Date(event.occurredAt).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-zinc-300">
                          {event.provider ?? snapshot.provider ?? "unknown"} / {event.model ?? snapshot.model ?? "unknown"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${getStatusClasses(event.status)}`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Tokens</p>
                        <p className="mt-1 text-sm font-medium text-zinc-200">
                          {event.totalTokens?.toLocaleString() ?? "n/a"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Cost</p>
                        <p className="mt-1 text-sm font-medium text-zinc-200">{formatCurrency(event.costUsd)}</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Latency</p>
                        <p className="mt-1 text-sm font-medium text-zinc-200">{formatLatency(event.latencyMs)}</p>
                      </div>
                    </div>
                    {event.errorMessage ? (
                      <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-200">
                        {event.errorMessage}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Activity feed</p>
                <p className="text-xs text-zinc-500">
                  Showing {Math.min(snapshot.activityEvents.length, compact ? 10 : 20)} latest events
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {snapshot.activityEvents.slice(-(compact ? 10 : 20)).map((event) => (
                  <div key={event.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                      <span>{event.role ?? event.eventType}</span>
                      <span>{new Date(event.occurredAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{event.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
