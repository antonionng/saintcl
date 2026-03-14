import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextBalance } from "@/lib/billing/math";

type WalletMutationInput = {
  orgId: string;
  amountCents: number;
  userId?: string | null;
  agentId?: string | null;
  sourceType: string;
  description: string;
  metadata?: Record<string, unknown>;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
};

export async function ensureWallet(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  await admin.from("org_wallets").upsert({ org_id: orgId });
  const { data } = await admin.from("org_wallets").select("*").eq("org_id", orgId).single();
  return data;
}

export async function reserveStripeEvent(eventId: string, orgId: string | null, type: string) {
  const admin = createAdminClient();
  if (!admin) return { accepted: false, duplicate: false };

  const result = await admin
    .from("stripe_events")
    .insert({ id: eventId, org_id: orgId, type })
    .select("id")
    .maybeSingle();

  if (result.error && result.error.code === "23505") {
    return { accepted: false, duplicate: true };
  }

  if (result.error) {
    throw result.error;
  }

  return { accepted: true, duplicate: false };
}

async function appendLedger(direction: "credit" | "debit", input: WalletMutationInput) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const wallet = await ensureWallet(input.orgId);
  if (!wallet) {
    throw new Error("Wallet is unavailable.");
  }

  const nextBalance = calculateNextBalance(wallet.balance_cents, input.amountCents, direction);

  if (direction === "debit" && nextBalance < 0) {
    throw new Error("Insufficient wallet balance.");
  }

  const { error: walletError } = await admin
    .from("org_wallets")
    .update({ balance_cents: nextBalance })
    .eq("org_id", input.orgId);

  if (walletError) {
    throw walletError;
  }

  const { data, error } = await admin
    .from("wallet_ledger")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      agent_id: input.agentId,
      source_type: input.sourceType,
      direction,
      amount_cents: input.amountCents,
      balance_after_cents: nextBalance,
      description: input.description,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function creditWallet(input: WalletMutationInput) {
  return appendLedger("credit", input);
}

export async function debitWallet(input: WalletMutationInput) {
  return appendLedger("debit", input);
}

