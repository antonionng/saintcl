import { debitWallet, ensureWallet } from "@/lib/billing/wallet";
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

  const { data: usageEvent, error } = await admin
    .from("usage_events")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      agent_id: input.agentId,
      event_type: input.eventType,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? "operation",
      amount_cents: input.amountCents,
      session_key: input.sessionKey ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const ledgerEntry = await debitWallet({
    orgId: input.orgId,
    userId: input.userId,
    agentId: input.agentId,
    amountCents: input.amountCents,
    sourceType: input.eventType,
    description: input.description,
    metadata: input.metadata ?? {},
  });

  return {
    usageEvent,
    ledgerEntry,
    lowBalance: (wallet.balance_cents - input.amountCents) <= wallet.low_balance_threshold_cents,
  };
}

