import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import {
  creditWallet,
  markStripeEventFailed,
  markStripeEventProcessed,
  reserveStripeEvent,
} from "@/lib/billing/wallet";
import { getPlanConfig } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";

function toIsoTimestamp(unixSeconds?: number | null) {
  if (!unixSeconds) {
    return null;
  }
  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeStripeInterval(value?: string | null) {
  if (value === "year" || value === "annual") {
    return "annual";
  }
  if (value === "month" || value === "monthly") {
    return "monthly";
  }
  return null;
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriodEnd = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };
  return subscriptionWithPeriodEnd.current_period_end ?? null;
}

async function updateOrgSubscriptionState(input: {
  orgId: string;
  planId?: string | null;
  interval?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  priceId?: string | null;
  currentPeriodEnd?: string | null;
  clearTrial?: boolean;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const nextState: Record<string, string | null> = {
    stripe_customer_id: input.customerId ?? null,
    stripe_subscription_id: input.subscriptionId ?? null,
    stripe_subscription_status: input.subscriptionStatus ?? null,
    stripe_price_id: input.priceId ?? null,
    stripe_current_period_end: input.currentPeriodEnd ?? null,
  };

  if (input.planId) {
    nextState.plan = input.planId;
  }

  if (input.interval === "monthly" || input.interval === "annual") {
    nextState.billing_interval = input.interval;
  }

  if (input.clearTrial) {
    nextState.trial_status = "converted";
    nextState.trial_plan = null;
    nextState.trial_ends_at = null;
  }

  await admin.from("orgs").update(nextState).eq("id", input.orgId);
}

async function findOrgIdForSubscription(subscription: Stripe.Subscription) {
  const metadataOrgId = subscription.metadata?.orgId;
  if (metadataOrgId) {
    return metadataOrgId;
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data } = await admin
    .from("orgs")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.id ?? null;
}

async function creditIncludedUsage(input: {
  orgId: string;
  userId?: string | null;
  planId: string;
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const includedUsageCreditCents = getPlanConfig(input.planId).includedUsageCreditCents ?? 0;
  if (includedUsageCreditCents <= 0) {
    return null;
  }

  return creditWallet({
    orgId: input.orgId,
    userId: input.userId ?? null,
    amountCents: includedUsageCreditCents,
    sourceType: "plan_usage_credit",
    description: `${getPlanConfig(input.planId).name} included usage credit`,
    metadata: {
      planId: input.planId,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    },
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!stripe) {
    return NextResponse.json({ received: true, mode: "mock" });
  }

  if (!signature) {
    return NextResponse.json({ error: { message: "Missing Stripe signature." } }, { status: 400 });
  }

  if (!env.stripeWebhookSecret) {
    return NextResponse.json({ error: { message: "Stripe webhook secret is not configured." } }, { status: 503 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Invalid Stripe signature." } },
      { status: 400 },
    );
  }
  const metadata = (event.data.object as Stripe.Checkout.Session).metadata ?? {};
  const orgId = metadata.orgId ?? null;

  const reserved = await reserveStripeEvent(event.id, orgId, event.type);
  if (reserved.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind;

      if (kind === "topup" && orgId) {
        const amountCents = Number(session.metadata?.amountCents || session.amount_total || 0);
        if (amountCents > 0) {
          await creditWallet({
            orgId,
            userId: session.metadata?.userId ?? null,
            sourceType: "stripe_topup",
            amountCents,
            description: "Stripe wallet top-up",
            metadata: { stripeSessionId: session.id },
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          });
        }
      }

      if (kind === "plan" && orgId && session.metadata?.planId) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;

        await updateOrgSubscriptionState({
          orgId,
          planId: session.metadata.planId,
          interval: normalizeStripeInterval(session.metadata.interval ?? subscription?.items.data[0]?.price.recurring?.interval) ?? "monthly",
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId,
          subscriptionStatus: subscription?.status ?? "active",
          priceId: subscription?.items.data[0]?.price.id ?? null,
          currentPeriodEnd: toIsoTimestamp(subscription ? getSubscriptionCurrentPeriodEnd(subscription) : null),
          clearTrial: true,
        });

        await creditIncludedUsage({
          orgId,
          userId: session.metadata?.userId ?? null,
          planId: session.metadata.planId,
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: subscriptionId,
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionOrgId = await findOrgIdForSubscription(subscription);

      if (subscriptionOrgId) {
        await updateOrgSubscriptionState({
          orgId: subscriptionOrgId,
          planId: subscription.metadata?.planId ?? null,
          interval: normalizeStripeInterval(subscription.metadata?.interval ?? subscription.items.data[0]?.price.recurring?.interval),
          customerId: typeof subscription.customer === "string" ? subscription.customer : null,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          priceId: subscription.items.data[0]?.price.id ?? null,
          currentPeriodEnd: toIsoTimestamp(getSubscriptionCurrentPeriodEnd(subscription)),
          clearTrial: subscription.status !== "canceled",
        });
      }
    }

    await markStripeEventProcessed(event.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook processing failed.";
    await markStripeEventFailed(event.id, message).catch(() => null);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }

  return NextResponse.json({ received: true, type: event.type });
}
