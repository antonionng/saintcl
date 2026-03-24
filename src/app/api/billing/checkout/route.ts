import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { env } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/utils";

const billingCheckoutSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("topup"),
    amountCents: z.number().int().min(500).max(500000),
    returnPath: z.string().max(200).optional(),
  }),
  z.object({
    kind: z.literal("plan"),
    planId: z.enum(["starter", "pro", "business", "enterprise"]),
    interval: z.enum(["monthly", "annual"]).default("monthly"),
    returnPath: z.string().max(200).optional(),
  }),
]);

const stripePlanPriceIds = {
  starter: {
    monthly: env.stripeStarterMonthlyPriceId,
    annual: env.stripeStarterAnnualPriceId,
  },
  pro: {
    monthly: env.stripeProMonthlyPriceId,
    annual: env.stripeProAnnualPriceId,
  },
  business: {
    monthly: env.stripeBusinessMonthlyPriceId,
    annual: env.stripeBusinessAnnualPriceId,
  },
} as const;

async function ensureStripeCustomerId(input: {
  orgId: string;
  orgName: string;
  orgStripeCustomerId?: string | null;
  userId: string;
  email?: string | null;
}) {
  if (input.orgStripeCustomerId) {
    return input.orgStripeCustomerId;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const customer = await stripe.customers.create({
    name: input.orgName,
    email: input.email ?? undefined,
    metadata: {
      orgId: input.orgId,
      userId: input.userId,
    },
  });

  const admin = createAdminClient();
  await admin?.from("orgs").update({ stripe_customer_id: customer.id }).eq("id", input.orgId);

  return customer.id;
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const payload = billingCheckoutSchema.parse(await request.json().catch(() => ({ kind: "topup", amountCents: 5000 })));
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ url: `${getBaseUrl()}/billing?demoCheckout=true&kind=${payload.kind}` });
  }

  const returnPath = payload.returnPath?.startsWith("/") ? payload.returnPath : "/billing";
  const successSeparator = returnPath.includes("?") ? "&" : "?";
  const successUrl = `${getBaseUrl()}${returnPath}${successSeparator}checkout=success&kind=${payload.kind}`;
  const cancelUrl = `${getBaseUrl()}${returnPath}${successSeparator}checkout=cancelled&kind=${payload.kind}`;

  if (payload.kind === "plan" && payload.planId === "enterprise") {
    return NextResponse.json({ url: "mailto:founder@saintclaw.ai?subject=Saint%20AGI%20Enterprise" });
  }

  if (payload.kind === "plan") {
    const planId = payload.planId as keyof typeof stripePlanPriceIds;
    const customerId = await ensureStripeCustomerId({
      orgId: session.org.id,
      orgName: session.org.name,
      orgStripeCustomerId: session.org.stripe_customer_id,
      userId: session.userId,
      email: session.email,
    });

    const priceId = stripePlanPriceIds[planId][payload.interval];
    if (!priceId) {
      return NextResponse.json(
        { error: { message: `Stripe price ID is missing for ${payload.planId} ${payload.interval}.` } },
        { status: 503 },
      );
    }

    const planSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      client_reference_id: session.org.id,
      metadata: {
        kind: "plan",
        planId: payload.planId,
        interval: payload.interval,
        orgId: session.org.id,
        userId: session.userId,
      },
      subscription_data: {
        metadata: {
          orgId: session.org.id,
          planId: payload.planId,
          interval: payload.interval,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: planSession.url });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: "Saint AGI Wallet Top-up" },
          unit_amount: payload.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "topup",
      orgId: session.org.id,
      userId: session.userId,
      amountCents: String(payload.amountCents),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
