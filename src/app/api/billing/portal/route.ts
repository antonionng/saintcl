import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { getStripeClient } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  if (!session.org.stripe_customer_id) {
    return NextResponse.json(
      { error: { message: "No Stripe customer is linked to this workspace yet." } },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: { message: "Stripe billing portal is unavailable in this environment." } },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const returnPath =
    typeof payload.returnPath === "string" && payload.returnPath.startsWith("/")
      ? payload.returnPath
      : "/settings?tab=billing";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: session.org.stripe_customer_id,
    return_url: `${getBaseUrl()}${returnPath}`,
  });

  return NextResponse.json({ url: portalSession.url });
}
