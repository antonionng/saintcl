import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}
