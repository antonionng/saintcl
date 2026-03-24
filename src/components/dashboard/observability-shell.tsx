"use client";

import { useEffect, useMemo, useState } from "react";

import { RequestLogTable, type RequestLogItem } from "@/components/dashboard/request-log-table";
import { SessionLogTail } from "@/components/dashboard/session-log-tail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RequestResponse = {
  data?: {
    items: RequestLogItem[];
    nextBefore?: string | null;
  };
  error?: {
    message?: string;
  };
};

export function ObservabilityShell({
  visibleAgents,
}: {
  visibleAgents: Array<{ id: string; name: string }>;
}) {
  const defaultFilters = {
    agentId: "",
    model: "",
    provider: "",
    status: "",
    includeTransport: false,
  };
  const [items, setItems] = useState<RequestLogItem[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultFilters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "25");
    if (filters.agentId) params.set("agentId", filters.agentId);
    if (filters.model) params.set("model", filters.model);
    if (filters.provider) params.set("provider", filters.provider);
    if (filters.status) params.set("status", filters.status);
    if (filters.includeTransport) params.set("includeTransport", "true");
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/observability/requests?${queryString}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as RequestResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "Unable to load request activity.");
        }
        const data = payload.data;
        if (!cancelled) {
          setItems(data.items);
          setNextBefore(data.nextBefore ?? null);
          setSelectedSessionKey((current) => {
            if (current && data.items.some((item) => item.sessionKey === current)) {
              return current;
            }
            return data.items.find((item) => item.sessionKey)?.sessionKey ?? null;
          });
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load request activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const hasActiveFilters = useMemo(
    () =>
      filters.agentId.length > 0 ||
      filters.model.length > 0 ||
      filters.provider.length > 0 ||
      filters.status.length > 0 ||
      filters.includeTransport,
    [filters],
  );

  const loadMore = async () => {
    if (!nextBefore) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/observability/requests?${queryString}&before=${encodeURIComponent(nextBefore)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as RequestResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Unable to load more request activity.");
      }

      setItems((current) => [...current, ...payload.data!.items]);
      setNextBefore(payload.data.nextBefore ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load more request activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.02] p-5 lg:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Filters</p>
              <h2 className="text-base font-semibold text-white">Refine what you are inspecting</h2>
              <p className="text-sm leading-6 text-zinc-400">
                Narrow the request stream by agent, model, provider, and runtime transport activity.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="self-start"
              onClick={() => setFilters(defaultFilters)}
              disabled={!hasActiveFilters}
            >
              Reset filters
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm text-zinc-400">
              <span>Agent</span>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition-colors focus:border-white/20"
                value={filters.agentId}
                onChange={(event) => setFilters((current) => ({ ...current, agentId: event.target.value }))}
              >
                <option value="">All visible agents</option>
                {visibleAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-zinc-400">
              <span>Model</span>
              <Input
                value={filters.model}
                onChange={(event) => setFilters((current) => ({ ...current, model: event.target.value }))}
                placeholder="openrouter/..."
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-400">
              <span>Provider</span>
              <Input
                value={filters.provider}
                onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
                placeholder="openrouter"
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-400">
              <span>Status</span>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition-colors focus:border-white/20"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">Any status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="app-checkbox mt-0.5 shrink-0"
              checked={filters.includeTransport}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  includeTransport: event.target.checked,
                }))
              }
            />
            <span className="space-y-1">
              <span className="block font-medium text-white">Include gateway transport traces</span>
              <span className="block text-zinc-500">
                Add lower-level gateway HTTP and RPC events alongside model request activity.
              </span>
            </span>
          </label>

          {error ? <p className="text-sm text-amber-200">{error}</p> : null}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
        <RequestLogTable
          items={items}
          selectedSessionKey={selectedSessionKey}
          onSelectSession={setSelectedSessionKey}
          loading={loading}
          hasMore={Boolean(nextBefore)}
          onLoadMore={loadMore}
        />
        <SessionLogTail sessionKey={selectedSessionKey} />
      </div>
    </div>
  );
}
