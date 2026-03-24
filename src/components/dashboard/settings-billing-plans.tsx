"use client";

import type { BillingInterval } from "@/types";
import { PricingPlans } from "@/components/pricing/pricing-plans";

export function SettingsBillingPlans({
  currentPlan,
  currentInterval,
  trialStatus,
  trialEndsAt,
  stripeSubscriptionStatus,
}: {
  currentPlan: string;
  currentInterval?: BillingInterval | null;
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  stripeSubscriptionStatus?: string | null;
}) {
  return (
    <PricingPlans
      mode="settings"
      currentPlan={currentPlan}
      currentInterval={currentInterval}
      trialStatus={trialStatus}
      trialEndsAt={trialEndsAt}
      stripeSubscriptionStatus={stripeSubscriptionStatus}
      returnPath="/settings?tab=billing"
    />
  );
}
