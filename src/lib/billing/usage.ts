import { ensureWallet } from "@/lib/billing/wallet";
import { createAdminClient } from "@/lib/supabase/admin";

export const usagePricing = {
  agentProvision: 250,
  channelConnect: 50,
  apiOperation: 10,
} as const;

type UsageChargeInput = {
  orgId: string;
  userId?: string | null;
  agentId?: string | null;
  eventType: string;
  amountCents: number;
  description: string;
  quantity?: number;
  unit?: string;
  sessionKey?: string | null;
  metadata?: Record<string, unknown>;
  checkpoint?: {
    totalCostUsd: number;
    totalTokens: number;
    model?: string | null;
    provider?: string | null;
    metadata?: Record<string, unknown>;
  };
};

export async function assertCanSpend(orgId: string, amountCents: number) {
  const wallet = await ensureWallet(orgId);
  if (!wallet) {
    throw new Error("Wallet is unavailable.");
  }
  if (wallet.balance_cents < amountCents) {
    throw new Error("Insufficient wallet balance. Please top up to continue.");
  }
  return wallet;
}

export async function recordUsageCharge(input: UsageChargeInput) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const wallet = await assertCanSpend(input.orgId, input.amountCents);

  const { data, error } = await admin.schema("app_private").rpc("record_usage_charge", {
    p_org_id: input.orgId,
    p_event_type: input.eventType,
    p_amount_cents: input.amountCents,
    p_description: input.description,
    p_user_id: input.userId ?? null,
    p_agent_id: input.agentId ?? null,
    p_quantity: input.quantity ?? 1,
    p_unit: input.unit ?? "operation",
    p_session_key: input.sessionKey ?? null,
    p_metadata: input.metadata ?? {},
    p_checkpoint_total_cost_usd: input.checkpoint?.totalCostUsd ?? null,
    p_checkpoint_total_tokens: input.checkpoint?.totalTokens ?? null,
    p_checkpoint_model: input.checkpoint?.model ?? null,
    p_checkpoint_provider: input.checkpoint?.provider ?? null,
    p_checkpoint_metadata: input.checkpoint?.metadata ?? {},
  });

  if (error) {
    throw error;
  }

  const result = data as {
    usageEvent: unknown;
    ledgerEntry: unknown;
    lowBalance?: boolean;
  } | null;

  return {
    usageEvent: result?.usageEvent ?? null,
    ledgerEntry: result?.ledgerEntry ?? null,
    lowBalance:
      typeof result?.lowBalance === "boolean"
        ? result.lowBalance
        : (wallet.balance_cents - input.amountCents) <= wallet.low_balance_threshold_cents,
  };
}

