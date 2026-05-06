import { BillingGateError } from "@/lib/billing/errors";
import { getOrgPolicy, getOrgWallet, getUserBudgetOverride, getUserSpendCents } from "@/lib/dal";
import { requiresWalletBalance } from "@/lib/model-pricing";
import {
  buildModelCatalogSnapshot,
  type ModelCatalogEntry,
  findAllowedModel,
  restrictSnapshotToTrialFreeModels,
} from "@/lib/openclaw/model-catalog";
import { syncOpenClawUsageForOrg } from "@/lib/openclaw/usage-sync";
import { isTrialModelRestrictionActive } from "@/lib/plans";

type ModelSelectionContext = "agent" | "session";
type TrialGateOptions = {
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  isSuperAdmin?: boolean;
};

function resolveSnapshotForTrial<T extends Awaited<ReturnType<typeof buildModelCatalogSnapshot>>>(
  snapshot: T,
  options?: TrialGateOptions,
) {
  return isTrialModelRestrictionActive(options) ? restrictSnapshotToTrialFreeModels(snapshot) : snapshot;
}

export async function getOrgModelCatalogState(orgId: string, options?: TrialGateOptions) {
  const policy = await getOrgPolicy(orgId);
  const snapshot = resolveSnapshotForTrial(await buildModelCatalogSnapshot(policy), options);
  return { policy, snapshot };
}

/**
 * Returns the runtime allowlist for OpenClaw (locked entries removed). Use this
 * everywhere the snapshot is forwarded to the runtime gateway so locked paid
 * models surfaced to the UI never leak into the actual routing allowlist.
 */
export function getRuntimeAllowedModels(snapshot: { approvedModels: ModelCatalogEntry[] }) {
  return snapshot.approvedModels.filter((entry) => !entry.lockedReason);
}

export async function assertModelSelectionAllowed(params: {
  orgId: string;
  userId?: string | null;
  isSuperAdmin?: boolean;
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  model: string;
  context: ModelSelectionContext;
}) {
  await syncOpenClawUsageForOrg(params.orgId);
  const [{ policy, snapshot }, wallet] = await Promise.all([
    getOrgModelCatalogState(params.orgId, {
      trialStatus: params.trialStatus,
      trialEndsAt: params.trialEndsAt,
      isSuperAdmin: params.isSuperAdmin,
    }),
    getOrgWallet(params.orgId),
  ]);

  const matched = findAllowedModel(params.model, snapshot.approvedModels);

  if (matched && matched.lockedReason === "trial_paid_model") {
    throw new BillingGateError({
      code: "TRIAL_PAID_MODEL_BLOCKED",
      message: "Paid models unlock when you upgrade. Pick the trial model or upgrade to use this one.",
      cta: "upgrade",
    });
  }

  const selectedModel = matched && !matched.lockedReason ? matched : null;
  if (!selectedModel) {
    if (isTrialModelRestrictionActive(params)) {
      throw new BillingGateError({
        code: "TRIAL_PAID_MODEL_BLOCKED",
        message: "Paid models unlock when you upgrade. Pick the trial model or upgrade to use this one.",
        cta: "upgrade",
      });
    }
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
    throw new BillingGateError({
      code: "WALLET_INSUFFICIENT",
      message: "Wallet is empty. Top up to use this model.",
      cta: "topup",
    });
  }

  if (
    requiresWallet &&
    policy?.require_approval_on_spend &&
    (wallet?.balance_cents ?? 0) <= (wallet?.low_balance_threshold_cents ?? 0)
  ) {
    throw new BillingGateError({
      code: "WALLET_BELOW_APPROVAL_THRESHOLD",
      message: "Model changes are locked until the wallet is topped up above the approval threshold.",
      cta: "topup",
    });
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
      throw new BillingGateError({
        code: "USER_HARD_LIMIT_REACHED",
        message: "You have reached your hard spend limit for this organization.",
        cta: null,
        status: 403,
      });
    }
  }

  if (selectedModel.isPremium && snapshot.guardrails.requireApprovalForPremiumModels) {
    throw new BillingGateError({
      code: "PREMIUM_REQUIRES_APPROVAL",
      message: "This premium model requires additional approval in your organization.",
      cta: "approval",
      status: 403,
    });
  }

  return { policy, snapshot, selectedModel, wallet };
}

export async function resolveModelSelection(params: {
  orgId: string;
  userId?: string | null;
  isSuperAdmin?: boolean;
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  requestedModel?: string | null;
  context: ModelSelectionContext;
}) {
  const { policy, snapshot } = await getOrgModelCatalogState(params.orgId, {
    trialStatus: params.trialStatus,
    trialEndsAt: params.trialEndsAt,
    isSuperAdmin: params.isSuperAdmin,
  });

  const trialActive = isTrialModelRestrictionActive(params);
  const requested = params.requestedModel?.trim() || "";
  const requestedMatch = requested ? findAllowedModel(requested, snapshot.approvedModels) : null;

  // Trial users provisioning a new agent never block: silently coerce any
  // disallowed or locked model selection to the trial-allowed default. The UI
  // pre-selects the right model anyway; this is defence-in-depth so a stale
  // form post never throws a red error in their face.
  const shouldCoerceForTrial =
    trialActive &&
    params.context === "agent" &&
    (!requested || !requestedMatch || requestedMatch.lockedReason === "trial_paid_model");

  if (shouldCoerceForTrial) {
    const trialDefault =
      findAllowedModel(snapshot.defaultModel, snapshot.approvedModels) ??
      snapshot.approvedModels.find((entry) => !entry.lockedReason);
    if (!trialDefault) {
      throw new Error("No approved model is configured for this organization.");
    }
    return {
      policy,
      snapshot,
      model: trialDefault.id,
      selectedModel: trialDefault,
    };
  }

  const candidate = requested || snapshot.defaultModel;
  const selectedModel =
    findAllowedModel(candidate, snapshot.approvedModels) ??
    findAllowedModel(snapshot.defaultModel, snapshot.approvedModels);

  if (!selectedModel) {
    throw new Error("No approved model is configured for this organization.");
  }

  if (requested) {
    await assertModelSelectionAllowed({
      orgId: params.orgId,
      userId: params.userId,
      isSuperAdmin: params.isSuperAdmin,
      trialStatus: params.trialStatus,
      trialEndsAt: params.trialEndsAt,
      model: requested,
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
