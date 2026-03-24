import { env } from "../env";
import { inferFreeModel } from "../model-pricing";
import { parseProviderFromModelRef } from "./session-keys";

export type ModelCatalogEntry = {
  id: string;
  label: string;
  provider: string;
  description?: string | null;
  contextWindow?: number | null;
  inputCostPerMillionCents?: number | null;
  outputCostPerMillionCents?: number | null;
  isFree?: boolean;
  source: "policy" | "openrouter" | "fallback";
  isPremium?: boolean;
};

export type ModelGuardrails = {
  allowAgentOverride: boolean;
  allowSessionOverride: boolean;
  requireApprovalForPremiumModels: boolean;
  premiumInputCostPerMillionCents?: number | null;
  premiumOutputCostPerMillionCents?: number | null;
};

export type DiscoveryCatalogSource = "live" | "fallback";

type OrgPolicyLike = {
  default_model?: string | null;
  approved_models?: unknown;
  blocked_models?: unknown;
  model_guardrails?: unknown;
};

const DEFAULT_GUARDRAILS: ModelGuardrails = {
  allowAgentOverride: true,
  allowSessionOverride: true,
  requireApprovalForPremiumModels: false,
  premiumInputCostPerMillionCents: null,
  premiumOutputCostPerMillionCents: null,
};

const FALLBACK_DISCOVERY_MODELS: ModelCatalogEntry[] = [
  {
    id: "openrouter/auto",
    label: "OpenRouter Auto",
    provider: "openrouter",
    description: "Route each request through OpenRouter's automatic best-fit routing.",
    source: "fallback",
  },
  {
    id: "openrouter/anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "openrouter",
    description: "Strong all-purpose premium model for production work.",
    source: "fallback",
  },
  {
    id: "openrouter/openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "openrouter",
    description: "Fast general-purpose model with broad tool compatibility.",
    source: "fallback",
  },
  {
    id: "openrouter/google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "openrouter",
    description: "Large-context premium model for multimodal and long-context work.",
    source: "fallback",
  },
  {
    id: "openrouter/meta-llama/llama-3.3-70b:free",
    label: "Llama 3.3 70B Free",
    provider: "openrouter",
    description: "Popular free-tier option for lower-cost experimentation.",
    isFree: true,
    source: "fallback",
  },
];

function createMinimalEntry(id: string, source: ModelCatalogEntry["source"]): ModelCatalogEntry {
  return {
    id,
    label: id,
    provider: parseProviderFromModelRef(id),
    isFree: inferFreeModel({ id }),
    source,
  };
}

function normalizeModelRef(modelRef: string) {
  const trimmed = modelRef.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("openrouter/") ? trimmed : `openrouter/${trimmed}`;
}

function parseNumber(raw: unknown) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toPerMillionCents(raw: unknown) {
  const perTokenUsd = parseNumber(raw);
  if (perTokenUsd === null) return null;
  return Math.round(perTokenUsd * 1_000_000 * 100);
}

function uniqueById(entries: ModelCatalogEntry[]) {
  const deduped = new Map<string, ModelCatalogEntry>();
  for (const entry of entries) {
    deduped.set(entry.id, entry);
  }
  return [...deduped.values()];
}

function normalizeEntry(raw: unknown, source: ModelCatalogEntry["source"]): ModelCatalogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id =
    typeof value.id === "string"
      ? normalizeModelRef(value.id)
      : typeof value.model === "string"
        ? normalizeModelRef(value.model)
        : "";
  if (!id) return null;

  const inputCostPerMillionCents =
    parseNumber(value.inputCostPerMillionCents) ?? toPerMillionCents(value.inputCost);
  const outputCostPerMillionCents =
    parseNumber(value.outputCostPerMillionCents) ?? toPerMillionCents(value.outputCost);
  const isFree = inferFreeModel({
    id,
    isFree: value.isFree === true ? true : undefined,
    inputCostPerMillionCents,
    outputCostPerMillionCents,
  });

  return {
    id,
    label:
      typeof value.label === "string" && value.label.trim()
        ? value.label.trim()
        : typeof value.name === "string" && value.name.trim()
          ? value.name.trim()
          : id,
    provider:
      typeof value.provider === "string" && value.provider.trim()
        ? value.provider.trim()
        : parseProviderFromModelRef(id),
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim()
        : null,
    contextWindow: parseNumber(value.contextWindow) ?? parseNumber(value.context_length),
    inputCostPerMillionCents,
    outputCostPerMillionCents,
    isFree,
    source,
  };
}

function mergeEntries(base: ModelCatalogEntry, overlay?: Partial<ModelCatalogEntry> | null): ModelCatalogEntry {
  if (!overlay) return base;

  const merged: ModelCatalogEntry = {
    ...base,
    ...overlay,
    id: overlay.id ?? base.id,
    label: overlay.label ?? base.label,
    provider: overlay.provider ?? base.provider,
    description: overlay.description ?? base.description,
    contextWindow: overlay.contextWindow ?? base.contextWindow,
    inputCostPerMillionCents: overlay.inputCostPerMillionCents ?? base.inputCostPerMillionCents,
    outputCostPerMillionCents: overlay.outputCostPerMillionCents ?? base.outputCostPerMillionCents,
    source: overlay.source ?? base.source,
  };

  return {
    ...merged,
    isFree:
      inferFreeModel({
        id: merged.id,
        isFree: overlay.isFree ?? base.isFree,
        inputCostPerMillionCents: merged.inputCostPerMillionCents,
        outputCostPerMillionCents: merged.outputCostPerMillionCents,
      }) ?? false,
  };
}

function parsePolicyModels(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return uniqueById(raw.map((entry) => normalizeEntry(entry, "policy")).filter(Boolean) as ModelCatalogEntry[]);
}

function parseBlockedModels(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map(normalizeModelRef))];
}

export function getModelGuardrails(policy: OrgPolicyLike | null | undefined): ModelGuardrails {
  const raw =
    policy?.model_guardrails && typeof policy.model_guardrails === "object"
      ? (policy.model_guardrails as Record<string, unknown>)
      : {};

  return {
    allowAgentOverride:
      typeof raw.allowAgentOverride === "boolean"
        ? raw.allowAgentOverride
        : DEFAULT_GUARDRAILS.allowAgentOverride,
    allowSessionOverride:
      typeof raw.allowSessionOverride === "boolean"
        ? raw.allowSessionOverride
        : DEFAULT_GUARDRAILS.allowSessionOverride,
    requireApprovalForPremiumModels:
      typeof raw.requireApprovalForPremiumModels === "boolean"
        ? raw.requireApprovalForPremiumModels
        : DEFAULT_GUARDRAILS.requireApprovalForPremiumModels,
    premiumInputCostPerMillionCents:
      parseNumber(raw.premiumInputCostPerMillionCents) ?? DEFAULT_GUARDRAILS.premiumInputCostPerMillionCents,
    premiumOutputCostPerMillionCents:
      parseNumber(raw.premiumOutputCostPerMillionCents) ?? DEFAULT_GUARDRAILS.premiumOutputCostPerMillionCents,
  };
}

export function resolveDefaultModel(policy: OrgPolicyLike | null | undefined) {
  const configured =
    typeof policy?.default_model === "string" && policy.default_model.trim()
      ? normalizeModelRef(policy.default_model)
      : "";
  return configured || env.openClawDefaultModel;
}

function pickPreferredApprovedModel(entries: ModelCatalogEntry[]) {
  return entries.find((entry) => entry.isFree) ?? entries[0] ?? null;
}

export function markPremiumModels(entries: ModelCatalogEntry[], guardrails: ModelGuardrails) {
  return entries.map((entry) => {
    const exceedsInput =
      guardrails.premiumInputCostPerMillionCents !== null &&
      guardrails.premiumInputCostPerMillionCents !== undefined &&
      (entry.inputCostPerMillionCents ?? 0) > guardrails.premiumInputCostPerMillionCents;
    const exceedsOutput =
      guardrails.premiumOutputCostPerMillionCents !== null &&
      guardrails.premiumOutputCostPerMillionCents !== undefined &&
      (entry.outputCostPerMillionCents ?? 0) > guardrails.premiumOutputCostPerMillionCents;

    return {
      ...entry,
      isPremium: exceedsInput || exceedsOutput,
    };
  });
}

export async function fetchOpenRouterDiscoveryCatalogWithSource(limit: number | null = 40): Promise<{
  entries: ModelCatalogEntry[];
  source: DiscoveryCatalogSource;
}> {
  if (!env.openRouterApiKey?.trim()) {
    return {
      entries: limit === null ? FALLBACK_DISCOVERY_MODELS : FALLBACK_DISCOVERY_MODELS.slice(0, limit),
      source: "fallback",
    };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`OpenRouter catalog failed (${response.status})`);
    }

    const body = (await response.json()) as {
      data?: Array<Record<string, unknown>>;
    };
    const catalog = uniqueById(
      (body.data ?? [])
        .map((entry) =>
          normalizeEntry(
            {
              ...entry,
              id:
                typeof entry.id === "string" && entry.id.startsWith("openrouter/")
                  ? entry.id
                  : typeof entry.id === "string"
                    ? `openrouter/${entry.id}`
                    : undefined,
              label: entry.name,
              inputCost: (entry.pricing as Record<string, unknown> | undefined)?.prompt,
              outputCost: (entry.pricing as Record<string, unknown> | undefined)?.completion,
              contextWindow: entry.context_length,
              isFree:
                (typeof entry.id === "string" && entry.id.endsWith(":free")) ||
                (((entry.pricing as Record<string, unknown> | undefined)?.prompt === "0" ||
                  (entry.pricing as Record<string, unknown> | undefined)?.prompt === 0) &&
                  ((entry.pricing as Record<string, unknown> | undefined)?.completion === "0" ||
                    (entry.pricing as Record<string, unknown> | undefined)?.completion === 0)),
            },
            "openrouter",
          ),
        )
        .filter(Boolean) as ModelCatalogEntry[],
    );

    if (catalog.length === 0) {
      return {
        entries: FALLBACK_DISCOVERY_MODELS,
        source: "fallback",
      };
    }

    const sortedCatalog = catalog.sort((a, b) => {
      if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
      const aCost = (a.inputCostPerMillionCents ?? 0) + (a.outputCostPerMillionCents ?? 0);
      const bCost = (b.inputCostPerMillionCents ?? 0) + (b.outputCostPerMillionCents ?? 0);
      if (aCost !== bCost) return aCost - bCost;
      return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
    });

    return {
      entries: limit === null ? sortedCatalog : sortedCatalog.slice(0, limit),
      source: "live",
    };
  } catch {
    return {
      entries: limit === null ? FALLBACK_DISCOVERY_MODELS : FALLBACK_DISCOVERY_MODELS.slice(0, limit),
      source: "fallback",
    };
  }
}

export async function fetchOpenRouterDiscoveryCatalog(limit: number | null = 40): Promise<ModelCatalogEntry[]> {
  const result = await fetchOpenRouterDiscoveryCatalogWithSource(limit);
  return result.entries;
}

export function buildModelCatalogSnapshotFromDiscovery(
  policy: OrgPolicyLike | null | undefined,
  discoveryModels: ModelCatalogEntry[],
  fallbackDefault = env.openClawDefaultModel,
) {
  const configuredDefault =
    typeof policy?.default_model === "string" && policy.default_model.trim()
      ? normalizeModelRef(policy.default_model)
      : "";
  const blockedModels = parseBlockedModels(policy?.blocked_models);
  const guardrails = getModelGuardrails(policy);
  const discoveryById = new Map(discoveryModels.map((entry) => [entry.id, entry]));
  const policyModels = parsePolicyModels(policy?.approved_models);

  const approvedSeeds =
    policyModels.length > 0
      ? policyModels
      : [normalizeEntry({ id: configuredDefault || fallbackDefault }, "policy")!];
  const approvedModels = uniqueById(
    approvedSeeds
      .map((entry) => mergeEntries(discoveryById.get(entry.id) ?? entry, entry))
      .filter((entry) => !blockedModels.includes(entry.id)),
  );
  const preferredApproved = pickPreferredApprovedModel(approvedModels);
  const defaultModel = configuredDefault || preferredApproved?.id || fallbackDefault;

  const ensuredApproved =
    approvedModels.some((entry) => entry.id === defaultModel) || blockedModels.includes(defaultModel)
      ? approvedModels
      : uniqueById([
          mergeEntries(discoveryById.get(defaultModel) ?? createMinimalEntry(defaultModel, "policy"), {
            id: defaultModel,
            label: discoveryById.get(defaultModel)?.label ?? defaultModel,
            provider: parseProviderFromModelRef(defaultModel),
            source: "policy",
          }),
          ...approvedModels,
        ]);

  return {
    defaultModel,
    blockedModels,
    guardrails,
    discoveryModels: markPremiumModels(discoveryModels.filter((entry) => !blockedModels.includes(entry.id)), guardrails),
    approvedModels: markPremiumModels(ensuredApproved, guardrails),
  };
}

export async function buildModelCatalogSnapshot(policy: OrgPolicyLike | null | undefined) {
  const discoveryModels = await fetchOpenRouterDiscoveryCatalog(null);
  return buildModelCatalogSnapshotFromDiscovery(policy, discoveryModels);
}

export function buildOpenClawModelAllowlist(models: ModelCatalogEntry[]) {
  return Object.fromEntries(
    models.map((entry) => [
      entry.id,
      {
        alias: entry.label !== entry.id ? entry.label : undefined,
      },
    ]),
  );
}

export function findAllowedModel(model: string, approvedModels: ModelCatalogEntry[]) {
  const normalized = normalizeModelRef(model);
  return approvedModels.find((entry) => entry.id === normalized) ?? null;
}
