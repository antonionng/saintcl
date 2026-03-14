import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { getStripeClient } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";

const billingCheckoutSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("topup"),
    amountCents: z.number().int().min(500).max(500000),
  }),
  z.object({
    kind: z.literal("plan"),
    planId: z.enum(["free", "pro", "team"]),
  }),
]);

const planPricing = {
  free: { name: "SaintClaw Free", amount: 0 },
  pro: { name: "SaintClaw Pro", amount: 2900 },
  team: { name: "SaintClaw Team", amount: 9900 },
} as const;

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

  const successUrl = `${getBaseUrl()}/billing?checkout=success&kind=${payload.kind}`;
  const cancelUrl = `${getBaseUrl()}/billing?checkout=cancelled&kind=${payload.kind}`;

  if (payload.kind === "plan" && payload.planId === "free") {
    return NextResponse.json({ url: `${getBaseUrl()}/billing?plan=free` });
  }

  const checkoutSession =
    payload.kind === "topup"
      ? await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: "SaintClaw Wallet Top-up" },
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
        })
      : await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: payload.planId === "free"
            ? []
            : [
                {
                  price_data: {
                    currency: "usd",
                    product_data: { name: planPricing[payload.planId].name },
                    recurring: { interval: "month" },
                    unit_amount: planPricing[payload.planId].amount,
                  },
                  quantity: 1,
                },
              ],
          metadata: {
            kind: "plan",
            planId: payload.planId,
            orgId: session.org.id,
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

  return NextResponse.json({ url: checkoutSession.url });
}
