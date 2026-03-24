"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PolicyModelEntry = {
  id: string;
  label: string;
  description?: string | null;
  contextWindow?: number | null;
  inputCostPerMillionCents?: number | null;
  outputCostPerMillionCents?: number | null;
  isFree?: boolean;
  isPremium?: boolean;
};

type DiscoveryPageState = {
  search: string;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type CatalogSource = "live" | "fallback";

const DISCOVERY_PAGE_SIZE = 12;

function serializeApprovedModels(models: PolicyModelEntry[]) {
  return models.map((model) => ({
    id: model.id,
    label: model.label,
    isFree: model.isFree,
  }));
}

async function readJsonBody<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function PolicyForm({
  mission,
  reasonForAgents,
  defaultModel,
  requireApprovalOnSpend,
  guardrails,
  approvedModels,
  blockedModels,
  modelGuardrails,
  readOnly = false,
}: {
  mission: string;
  reasonForAgents: string;
  defaultModel?: string | null;
  requireApprovalOnSpend: boolean;
  guardrails: Record<string, unknown>;
  approvedModels: PolicyModelEntry[];
  blockedModels: string[];
  modelGuardrails: {
    allowAgentOverride: boolean;
    allowSessionOverride: boolean;
    requireApprovalForPremiumModels: boolean;
    premiumInputCostPerMillionCents?: number | null;
    premiumOutputCostPerMillionCents?: number | null;
  };
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [nextMission, setNextMission] = useState(mission);
  const [nextReason, setNextReason] = useState(reasonForAgents);
  const [nextDefaultModel, setNextDefaultModel] = useState(defaultModel ?? "");
  const [nextRequireApproval, setNextRequireApproval] = useState(requireApprovalOnSpend);
  const [nextApprovedModels, setNextApprovedModels] = useState<PolicyModelEntry[]>(approvedModels);
  const [nextBlockedModels, setNextBlockedModels] = useState<string[]>(blockedModels);
  const [nextModelGuardrails, setNextModelGuardrails] = useState({
    allowAgentOverride: modelGuardrails.allowAgentOverride,
    allowSessionOverride: modelGuardrails.allowSessionOverride,
    requireApprovalForPremiumModels: modelGuardrails.requireApprovalForPremiumModels,
    premiumInputCostPerMillionCents: modelGuardrails.premiumInputCostPerMillionCents ?? "",
    premiumOutputCostPerMillionCents: modelGuardrails.premiumOutputCostPerMillionCents ?? "",
  });
  const [nextGuardrails, setNextGuardrails] = useState(
    JSON.stringify(guardrails ?? {}, null, 2),
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [discoveryModels, setDiscoveryModels] = useState<PolicyModelEntry[]>([]);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryPageState | null>(null);
  const [catalogSource, setCatalogSource] = useState<CatalogSource | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [runtimeSyncNotice, setRuntimeSyncNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedGuardrails = useMemo(() => {
    try {
      return JSON.parse(nextGuardrails || "{}") as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [nextGuardrails]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setDiscoveryPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDiscoveryCatalog() {
      setCatalogLoading(true);
      setCatalogError(null);

      try {
        const params = new URLSearchParams({
          includeDiscovery: "true",
          page: String(discoveryPage),
          pageSize: String(DISCOVERY_PAGE_SIZE),
        });
        if (search) {
          params.set("search", search);
        }

        const res = await fetch(`/api/models/catalog?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await res.json()) as {
          data?: {
            discoveryModels?: PolicyModelEntry[];
            discoveryPage?: DiscoveryPageState | null;
            catalogSource?: CatalogSource | null;
          };
          error?: { message?: string };
        };

        if (!res.ok) {
          throw new Error(body.error?.message || "Unable to load the OpenRouter catalog.");
        }

        setDiscoveryModels(body.data?.discoveryModels ?? []);
        setDiscoveryState(body.data?.discoveryPage ?? null);
        setCatalogSource(body.data?.catalogSource ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setDiscoveryModels([]);
        setDiscoveryState(null);
        setCatalogSource(null);
        setCatalogError(err instanceof Error ? err.message : "Unable to load the OpenRouter catalog.");
      } finally {
        if (!controller.signal.aborted) {
          setCatalogLoading(false);
        }
      }
    }

    void loadDiscoveryCatalog();
    return () => controller.abort();
  }, [discoveryPage, search]);

  function normalizeModelRef(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("openrouter/") ? trimmed : `openrouter/${trimmed}`;
  }

  function upsertApprovedModel(model: PolicyModelEntry) {
    setNextApprovedModels((current) => {
      const normalizedId = normalizeModelRef(model.id);
      const existing = current.find((entry) => entry.id === normalizedId);
      if (existing) {
        return current.filter((entry) => entry.id !== normalizedId);
      }

      return [
        ...current,
        {
          ...model,
          id: normalizedId,
          label: model.label || normalizedId,
        },
      ].sort((a, b) => a.label.localeCompare(b.label));
    });
  }

  function addCustomApprovedModel() {
    const normalized = normalizeModelRef(customModel);
    if (!normalized) return;
    upsertApprovedModel({ id: normalized, label: normalized });
    if (!nextDefaultModel) {
      setNextDefaultModel(normalized);
    }
    setCustomModel("");
  }

  function toggleBlockedModel(modelId: string) {
    const normalized = normalizeModelRef(modelId);
    setNextBlockedModels((current) =>
      current.includes(normalized)
        ? current.filter((entry) => entry !== normalized)
        : [...current, normalized].sort(),
    );
    if (nextDefaultModel === normalized) {
      setNextDefaultModel("");
    }
  }

  async function savePolicies() {
    if (readOnly) return;
    if (!parsedGuardrails) {
      setError("Guardrails must be valid JSON.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setRuntimeSyncNotice(null);

    try {
      const res = await fetch("/api/org-policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission: nextMission,
          reasonForAgents: nextReason,
          defaultModel: nextDefaultModel || null,
          requireApprovalOnSpend: nextRequireApproval,
          guardrails: parsedGuardrails,
          approvedModels: serializeApprovedModels(nextApprovedModels),
          blockedModels: nextBlockedModels,
          modelGuardrails: {
            allowAgentOverride: nextModelGuardrails.allowAgentOverride,
            allowSessionOverride: nextModelGuardrails.allowSessionOverride,
            requireApprovalForPremiumModels: nextModelGuardrails.requireApprovalForPremiumModels,
            premiumInputCostPerMillionCents: nextModelGuardrails.premiumInputCostPerMillionCents
              ? Number(nextModelGuardrails.premiumInputCostPerMillionCents)
              : null,
            premiumOutputCostPerMillionCents: nextModelGuardrails.premiumOutputCostPerMillionCents
              ? Number(nextModelGuardrails.premiumOutputCostPerMillionCents)
              : null,
          },
        }),
      });

      const body = (await readJsonBody<{
        error?: { message?: string };
        runtimeSync?: { attempted: boolean; applied: boolean; message?: string };
      }>(res)) ?? {};
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to save policies.");
      }

      setSuccess("Governance policies saved.");
      if (body.runtimeSync?.attempted && !body.runtimeSync.applied) {
        setRuntimeSyncNotice(body.runtimeSync.message || "Runtime sync is still pending.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save policies.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PolicySection
        title="Mission and purpose"
        description="Capture the business mission and why autonomous agents should exist in this workspace."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-2">
            <label className="app-field-label">Company mission</label>
            <Textarea
              value={nextMission}
              onChange={(event) => setNextMission(event.target.value)}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">Why agents exist here</label>
            <Textarea
              value={nextReason}
              onChange={(event) => setNextReason(event.target.value)}
              readOnly={readOnly}
            />
          </div>
        </div>
      </PolicySection>

      <PolicySection
        title="Model access"
        description="Set the default model and define the approved and blocked model catalog for the organization."
      >
        <div className="space-y-2">
          <label className="app-field-label">Default model</label>
          <select
            value={nextDefaultModel}
            onChange={(event) => setNextDefaultModel(event.target.value)}
            disabled={readOnly}
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
          >
            <option value="">Select a default model</option>
            {nextApprovedModels.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Approved model catalog</p>
              <p className="text-xs text-zinc-500">Admins control the allowlist users can pick from.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              {nextApprovedModels.length} approved
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={customModel}
              onChange={(event) => setCustomModel(event.target.value)}
              placeholder="Add custom OpenRouter model ref"
              readOnly={readOnly}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addCustomApprovedModel}
              disabled={readOnly}
            >
              Add
            </Button>
          </div>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search full OpenRouter catalog"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <p>
              {catalogLoading
                ? "Loading OpenRouter catalog..."
                : `${discoveryState?.total ?? 0} model${(discoveryState?.total ?? 0) === 1 ? "" : "s"} found`}
            </p>
            <div className="flex items-center gap-3">
              <CatalogSourceBadge source={catalogSource} loading={catalogLoading} />
              <p>
                Page {discoveryState?.page ?? discoveryPage}
                {discoveryState?.total ? ` of ${Math.max(1, Math.ceil(discoveryState.total / discoveryState.pageSize))}` : ""}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {catalogError ? <p className="text-sm text-red-400">{catalogError}</p> : null}
            {!catalogError && !catalogLoading && discoveryModels.length === 0 ? (
              <p className="text-sm text-zinc-500">No OpenRouter models matched this search.</p>
            ) : null}
            {discoveryModels.map((entry) => {
              const isApproved = nextApprovedModels.some((model) => model.id === entry.id);
              const isBlocked = nextBlockedModels.includes(entry.id);

              return (
                <div key={entry.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{entry.label}</p>
                      <p className="text-xs text-zinc-500">{entry.id}</p>
                      {entry.description ? (
                        <p className="text-xs leading-6 text-zinc-400">{entry.description}</p>
                      ) : null}
                      <p className="text-xs text-zinc-500">
                        {entry.isFree ? "Free or zero-rated" : "Paid"}
                        {entry.isPremium ? " · Premium" : ""}
                        {entry.contextWindow ? ` · ${entry.contextWindow.toLocaleString()} ctx` : ""}
                        {formatPricing(entry)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={isApproved ? "secondary" : "default"}
                        onClick={() => upsertApprovedModel(entry)}
                        disabled={readOnly}
                      >
                        {isApproved ? "Remove" : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggleBlockedModel(entry.id)}
                        disabled={readOnly}
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDiscoveryPage((current) => Math.max(1, current - 1))}
              disabled={catalogLoading || discoveryPage === 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDiscoveryPage((current) => current + 1)}
              disabled={catalogLoading || !discoveryState?.hasMore}
            >
              Next
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Approved models</p>
            <div className="flex flex-wrap gap-2">
              {nextApprovedModels.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => !readOnly && upsertApprovedModel(entry)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
          {nextBlockedModels.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Blocked models</p>
              <div className="flex flex-wrap gap-2">
                {nextBlockedModels.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => !readOnly && toggleBlockedModel(entry)}
                    className="rounded-full border border-amber-400/30 bg-amber-400/8 px-3 py-1 text-xs text-amber-300"
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </PolicySection>

      <PolicySection
        title="Approvals and overrides"
        description="Control when spend thresholds trigger approval and whether agents or live sessions may override the default model policy."
      >
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={nextRequireApproval}
            onChange={(event) => setNextRequireApproval(event.target.checked)}
            disabled={readOnly}
            className="app-checkbox"
          />
          Require approval when wallet thresholds are crossed
        </div>
        <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-sm font-medium text-white">Model guardrails</p>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={nextModelGuardrails.allowAgentOverride}
              onChange={(event) =>
                setNextModelGuardrails((current) => ({
                  ...current,
                  allowAgentOverride: event.target.checked,
                }))
              }
              disabled={readOnly}
              className="app-checkbox"
            />
            Allow agent-level model overrides
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={nextModelGuardrails.allowSessionOverride}
              onChange={(event) =>
                setNextModelGuardrails((current) => ({
                  ...current,
                  allowSessionOverride: event.target.checked,
                }))
              }
              disabled={readOnly}
              className="app-checkbox"
            />
            Allow session-level model overrides
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={nextModelGuardrails.requireApprovalForPremiumModels}
              onChange={(event) =>
                setNextModelGuardrails((current) => ({
                  ...current,
                  requireApprovalForPremiumModels: event.target.checked,
                }))
              }
              disabled={readOnly}
              className="app-checkbox"
            />
            Require approval for premium-priced models
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="app-field-label">Prompt cost cap (cents per 1M)</label>
              <Input
                type="number"
                min="0"
                value={String(nextModelGuardrails.premiumInputCostPerMillionCents)}
                onChange={(event) =>
                  setNextModelGuardrails((current) => ({
                    ...current,
                    premiumInputCostPerMillionCents: event.target.value,
                  }))
                }
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <label className="app-field-label">Completion cost cap (cents per 1M)</label>
              <Input
                type="number"
                min="0"
                value={String(nextModelGuardrails.premiumOutputCostPerMillionCents)}
                onChange={(event) =>
                  setNextModelGuardrails((current) => ({
                    ...current,
                    premiumOutputCostPerMillionCents: event.target.value,
                  }))
                }
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </PolicySection>

      <PolicySection
        title="Advanced guardrails"
        description="Use raw JSON only for policies that are not yet modeled in the form. Invalid JSON will block saving."
      >
        <div className="space-y-2">
          <label className="app-field-label">Guardrails JSON</label>
          <Textarea
            value={nextGuardrails}
            onChange={(event) => setNextGuardrails(event.target.value)}
            className="min-h-48 font-mono text-xs"
            readOnly={readOnly}
          />
        </div>
      </PolicySection>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {runtimeSyncNotice ? <p className="text-sm text-amber-300">{runtimeSyncNotice}</p> : null}
      {!readOnly ? (
        <Button onClick={savePolicies} disabled={saving}>
          {saving ? "Saving..." : "Save policies"}
        </Button>
      ) : null}
    </div>
  );
}

function PolicySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-panel space-y-4 rounded-2xl p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function formatPricing(entry: PolicyModelEntry) {
  const input = entry.inputCostPerMillionCents;
  const output = entry.outputCostPerMillionCents;
  if (input === null || input === undefined || output === null || output === undefined) {
    return "";
  }
  return ` · $${(input / 100).toFixed(2)}/1M in · $${(output / 100).toFixed(2)}/1M out`;
}

function CatalogSourceBadge({
  source,
  loading,
}: {
  source: CatalogSource | null;
  loading: boolean;
}) {
  if (loading) {
    return <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">Refreshing</span>;
  }

  if (!source) {
    return null;
  }

  const tone =
    source === "live"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : "border-amber-400/30 bg-amber-400/10 text-amber-300";

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${tone}`}>
      {source === "live" ? "Live catalog" : "Fallback catalog"}
    </span>
  );
}

