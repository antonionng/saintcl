import { createAdminClient } from "@/lib/supabase/admin";

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

type StripeEventStatus = "processing" | "processed" | "failed";

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
    .insert({ id: eventId, org_id: orgId, type, status: "processing", error_message: null, processed_at: null })
    .select("id, status")
    .maybeSingle();

  if (result.error && result.error.code === "23505") {
    const { data, error } = await admin
      .from("stripe_events")
      .select("status, created_at")
      .eq("id", eventId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const status = data?.status as StripeEventStatus | undefined;
    const createdAt = typeof data?.created_at === "string" ? new Date(data.created_at).getTime() : Date.now();
    const processingIsStale = status === "processing" && Date.now() - createdAt > 15 * 60 * 1000;
    if (status === "failed" || processingIsStale) {
      const retry = await admin
        .from("stripe_events")
        .update({
          org_id: orgId,
          type,
          status: "processing",
          error_message: null,
          processed_at: null,
        })
        .eq("id", eventId)
        .in("status", ["failed", "processing"])
        .select("id")
        .maybeSingle();

      if (retry.error) {
        throw retry.error;
      }

      return { accepted: Boolean(retry.data), duplicate: !retry.data };
    }

    return { accepted: false, duplicate: true };
  }

  if (result.error) {
    throw result.error;
  }

  return { accepted: true, duplicate: false };
}

export async function markStripeEventProcessed(eventId: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin
    .from("stripe_events")
    .update({ status: "processed", processed_at: new Date().toISOString(), error_message: null })
    .eq("id", eventId);

  if (error) {
    throw error;
  }
}

export async function markStripeEventFailed(eventId: string, errorMessage: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin
    .from("stripe_events")
    .update({ status: "failed", error_message: errorMessage.slice(0, 1000) })
    .eq("id", eventId);

  if (error) {
    throw error;
  }
}

async function appendLedger(direction: "credit" | "debit", input: WalletMutationInput) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { data, error } = await admin.schema("app_private").rpc("mutate_wallet", {
    p_org_id: input.orgId,
    p_amount_cents: input.amountCents,
    p_direction: direction,
    p_source_type: input.sourceType,
    p_description: input.description,
    p_user_id: input.userId ?? null,
    p_agent_id: input.agentId ?? null,
    p_metadata: input.metadata ?? {},
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    p_stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
  });

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

