import { getOrgPolicy, getOrgWallet, getUserBudgetOverride, getUserSpendCents } from "@/lib/dal";
import { requiresWalletBalance } from "@/lib/model-pricing";
import {
  buildModelCatalogSnapshot,
  type ModelCatalogEntry,
  findAllowedModel,
} from "@/lib/openclaw/model-catalog";
import { syncOpenClawUsageForOrg } from "@/lib/openclaw/usage-sync";

type ModelSelectionContext = "agent" | "session";

export async function getOrgModelCatalogState(orgId: string) {
  const policy = await getOrgPolicy(orgId);
  const snapshot = await buildModelCatalogSnapshot(policy);
  return { policy, snapshot };
}

export async function assertModelSelectionAllowed(params: {
  orgId: string;
  userId?: string | null;
  isSuperAdmin?: boolean;
  model: string;
  context: ModelSelectionContext;
}) {
  await syncOpenClawUsageForOrg(params.orgId);
  const [{ policy, snapshot }, wallet] = await Promise.all([
    getOrgModelCatalogState(params.orgId),
    getOrgWallet(params.orgId),
  ]);

  const selectedModel = findAllowedModel(params.model, snapshot.approvedModels);
  if (!selectedModel) {
    throw new Error("This model is not approved for your organization.");
  }

  if (params.context === "agent" && snapshot.guardrails.allowAgentOverride === false) {
    throw new Error("Agent-level model overrides are disabled by organization policy.");
  }

  if (params.context === "session" && snapshot.guardrails.allowSessionOverride === false) {
    throw new Error("Session-level model overrides are disabled by organization policy.");
  }

  const requiresWallet = requiresWalletBalance(selectedModel, {
    isSuperAdmin: params.isSuperAdmin,
  });

  if (requiresWallet && (!wallet || wallet.balance_cents <= 0)) {
    throw new Error("Insufficient wallet balance. Please top up before changing models.");
  }

  if (
    requiresWallet &&
    policy?.require_approval_on_spend &&
    (wallet?.balance_cents ?? 0) <= (wallet?.low_balance_threshold_cents ?? 0)
  ) {
    throw new Error("Model changes are locked while the wallet is below the approval threshold.");
  }

  if (params.userId && requiresWallet) {
    const [budgetOverride, spentCents] = await Promise.all([
      getUserBudgetOverride(params.orgId, params.userId),
      getUserSpendCents(params.orgId, params.userId),
    ]);

    if (
      budgetOverride?.hard_limit_cents !== null &&
      budgetOverride?.hard_limit_cents !== undefined &&
      spentCents >= budgetOverride.hard_limit_cents
    ) {
      throw new Error("You have reached your hard spend limit for this organization.");
    }
  }

  if (selectedModel.isPremium && snapshot.guardrails.requireApprovalForPremiumModels) {
    throw new Error("This premium model requires additional approval in your organization.");
  }

  return { policy, snapshot, selectedModel, wallet };
}

export async function resolveModelSelection(params: {
  orgId: string;
  userId?: string | null;
  isSuperAdmin?: boolean;
  requestedModel?: string | null;
  context: ModelSelectionContext;
}) {
  const { policy, snapshot } = await getOrgModelCatalogState(params.orgId);
  const candidate = params.requestedModel?.trim() || snapshot.defaultModel;
  const selectedModel =
    findAllowedModel(candidate, snapshot.approvedModels) ??
    findAllowedModel(snapshot.defaultModel, snapshot.approvedModels);

  if (!selectedModel) {
    throw new Error("No approved model is configured for this organization.");
  }

  if (params.requestedModel?.trim()) {
    await assertModelSelectionAllowed({
      orgId: params.orgId,
      userId: params.userId,
      isSuperAdmin: params.isSuperAdmin,
      model: params.requestedModel,
      context: params.context,
    });
  }

  return {
    policy,
    snapshot,
    model: selectedModel.id,
    selectedModel,
  };
}

export function describeModelPrice(entry: ModelCatalogEntry) {
  const input = entry.inputCostPerMillionCents ?? null;
  const output = entry.outputCostPerMillionCents ?? null;
  if (input === null && output === null) return "Pricing metadata unavailable";
  if (entry.isFree) return "Free or zero-rated on OpenRouter";
  return `Prompt ${formatCentsPerMillion(input)} · Completion ${formatCentsPerMillion(output)}`;
}

function formatCentsPerMillion(value: number | null) {
  if (value === null) return "n/a";
  return `$${(value / 100).toFixed(2)}/1M`;
}
