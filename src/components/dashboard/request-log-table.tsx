"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RequestLogItem = {
  id: string;
  agentId?: string | null;
  agentName?: string | null;
  sessionKey?: string | null;
  source: string;
  eventType: string;
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  status: string;
  latencyMs?: number | null;
  totalTokens?: number | null;
  costUsd?: number | null;
  errorMessage?: string | null;
  occurredAt: string;
};

function getSourceLabel(item: RequestLogItem) {
  if (item.source === "session_usage_logs") {
    return "Model request";
  }
  if (item.source === "gateway_rpc") {
    return "Gateway RPC";
  }
  if (item.source === "gateway_http") {
    return "Gateway HTTP";
  }
  return item.source;
}

function formatLatency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "n/a";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "$0.00";
  return `$${value.toFixed(4)}`;
}

function formatTokens(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "n/a";
  return value.toLocaleString();
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

export function RequestLogTable({
  items,
  selectedSessionKey,
  onSelectSession,
  loading = false,
  hasMore = false,
  onLoadMore,
  compact = false,
}: {
  items: RequestLogItem[];
  selectedSessionKey?: string | null;
  onSelectSession?: (sessionKey: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  compact?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader className={compact ? "p-4" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{compact ? "Recent activity" : "Request stream"}</CardTitle>
            <p className={compact ? "text-xs text-zinc-500" : "text-sm text-zinc-400"}>
              {compact
                ? "Latest requests associated with this workspace."
                : "Inspect recent model requests and select a session to review its live tail."}
            </p>
          </div>
          <div className="rounded-sm border border-border-subtle bg-transparent px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            {items.length} {items.length === 1 ? "request" : "requests"}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 p-4 pt-0" : "space-y-3"}>
        {items.length === 0 ? (
          <div className="rounded-md border border-border-subtle bg-transparent px-3 py-4 text-sm text-zinc-400">
            {loading
              ? "Loading requests..."
              : "No model requests matched the current filters yet. Send a few messages, then refresh or clear the filters."}
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.sessionKey != null && item.sessionKey === selectedSessionKey;
            const clickable = Boolean(item.sessionKey && onSelectSession);
            const row = (
              <div
                className={`rounded-md border px-3 py-3 transition-colors ${
                  isSelected
                    ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                    : "border-border-subtle bg-transparent hover:border-border hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                      {new Date(item.occurredAt).toLocaleString()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                        <span className="font-medium text-white">{item.agentName ?? "Unassigned"}</span>
                        <span className="text-zinc-600">/</span>
                        <span>{item.provider ?? "unknown"}</span>
                      </div>
                      <div className="text-sm text-zinc-400">{item.model ?? "unknown"}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${getStatusClasses(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
                  {[
                    { label: "Latency", value: formatLatency(item.latencyMs) },
                    { label: "Tokens", value: formatTokens(item.totalTokens) },
                    { label: "Cost", value: formatCurrency(item.costUsd) },
                    { label: "Channel", value: item.channel ?? "n/a" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-md border border-border-subtle bg-black/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{metric.label}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-sm border border-border-subtle bg-black/10 px-2 py-1">{getSourceLabel(item)}</span>
                  <span className="rounded-sm border border-border-subtle bg-black/10 px-2 py-1">{item.eventType}</span>
                  {!compact && item.sessionKey ? (
                    <span className="truncate rounded-sm border border-border-subtle bg-black/10 px-2 py-1">
                      {item.sessionKey}
                    </span>
                  ) : null}
                </div>
                {item.errorMessage ? (
                  <p className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    {item.errorMessage}
                  </p>
                ) : null}
              </div>
            );

            if (!clickable || !item.sessionKey) {
              return <div key={item.id}>{row}</div>;
            }

            return (
              <button
                key={item.id}
                type="button"
                className="block w-full text-left"
                onClick={() => {
                  if (onSelectSession) {
                    onSelectSession(item.sessionKey!);
                  }
                }}
              >
                {row}
              </button>
            );
          })
        )}

        {hasMore && onLoadMore ? (
          <div className="pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onLoadMore} disabled={loading}>
              Load older activity
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
