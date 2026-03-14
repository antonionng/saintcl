import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { creditWallet, reserveStripeEvent } from "@/lib/billing/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !signature || !env.stripeWebhookSecret) {
    return NextResponse.json({ received: true, mode: "mock" });
  }

  const body = await request.text();
  const event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  const metadata = (event.data.object as Stripe.Checkout.Session).metadata ?? {};
  const orgId = metadata.orgId ?? null;

  const reserved = await reserveStripeEvent(event.id, orgId, event.type);
  if (reserved.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

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
      const admin = createAdminClient();
      await admin
        ?.from("orgs")
        .update({ plan: session.metadata.planId })
        .eq("id", orgId);
    }
  }

  return NextResponse.json({ received: true, type: event.type });
}
