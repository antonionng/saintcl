"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BillingInterval } from "@/types";
import {
  BILLING_INTERVALS,
  PLAN_CATALOG,
  PLAN_ORDER,
  getPlanConfig,
  getPlanAnnualEquivalentMonthlyCents,
  getPlanDisplayName,
  getPlanIntervalLabel,
  getPlanPriceCents,
  getResolvedTrialStatus,
  getTrialDaysRemaining,
  normalizePlanTier,
} from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PricingPlansProps = {
  mode: "marketing" | "settings";
  currentPlan?: string | null;
  currentInterval?: BillingInterval | null;
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  stripeSubscriptionStatus?: string | null;
  returnPath?: string;
};

function formatCurrencyCents(amountCents: number, options?: { showDecimals?: boolean }) {
  return formatCurrency(amountCents / 100, {
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
    maximumFractionDigits: options?.showDecimals ? 2 : 0,
  });
}

async function startCheckout(planId: string, interval: BillingInterval, returnPath: string) {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "plan",
      planId,
      interval,
      returnPath,
    }),
  });

  const body = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !body.url) {
    throw new Error(body.error?.message || "Unable to start plan checkout.");
  }

  window.location.href = body.url;
}

async function openBillingPortal(returnPath: string) {
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnPath }),
  });

  const body = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !body.url) {
    throw new Error(body.error?.message || "Unable to open Stripe billing portal.");
  }

  window.location.href = body.url;
}

export function PricingPlans(props: PricingPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>(props.currentInterval ?? "monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMarketingMode = props.mode === "marketing";

  const resolvedTrialStatus = getResolvedTrialStatus(props.trialStatus, props.trialEndsAt);
  const currentPlan = normalizePlanTier(props.currentPlan);
  const returnPath = props.returnPath ?? "/pricing";
  const trialDaysRemaining = getTrialDaysRemaining(props.trialEndsAt);
  const currentPlanName = getPlanDisplayName(currentPlan);
  const currentIntervalLabel = getPlanIntervalLabel(props.currentInterval ?? "monthly").toLowerCase();

  const plans = useMemo(() => PLAN_ORDER.map((id) => PLAN_CATALOG[id]), []);

  async function handleSettingsAction(planId: string) {
    setError(null);
    setLoadingKey(planId);

    try {
      const isCurrentPlan = planId === currentPlan;
      const hasStripeSubscription = Boolean(props.stripeSubscriptionStatus && props.stripeSubscriptionStatus !== "canceled");

      if (isCurrentPlan && hasStripeSubscription) {
        await openBillingPortal(returnPath);
      } else {
        await startCheckout(planId, interval, returnPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue to billing.");
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="app-kicker">Pricing</p>
          <p className="text-sm text-zinc-400">
            {props.mode === "settings"
              ? `You are on ${currentPlanName} billed ${currentIntervalLabel}.`
              : "Choose your plan, start with a trial, and add more agents only when rollout expands."}
          </p>
          {resolvedTrialStatus === "active" ? (
            <p className="text-sm text-emerald-300">
              Trial active. {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} remaining.
            </p>
          ) : null}
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {BILLING_INTERVALS.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setInterval(entry)}
              className={
                entry === interval
                  ? "rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
                  : "rounded-full px-4 py-2 text-sm text-zinc-400"
              }
            >
              {getPlanIntervalLabel(entry)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = normalizePlanTier(currentPlan) === plan.id;
          const monthlyPrice = getPlanPriceCents(plan.id, "monthly");
          const displayPrice = getPlanPriceCents(plan.id, interval);
          const annualEquivalent = getPlanAnnualEquivalentMonthlyCents(plan.id);
          const marketingHref = `/signup?plan=${plan.id}&interval=${interval}`;
          const hasSubscription = Boolean(props.stripeSubscriptionStatus && props.stripeSubscriptionStatus !== "canceled");
          const actionLabel =
            props.mode === "settings"
              ? isCurrent && hasSubscription
                ? "Manage subscription"
                : isCurrent
                  ? "Current plan"
                  : `Choose ${plan.name}`
              : plan.contactSales
                ? "Talk to sales"
                : plan.ctaLabel;

          return (
            <div
              key={plan.id}
              className={
                isCurrent
                  ? "rounded-[1.6rem] border border-white/16 bg-white/[0.05] p-6"
                  : "rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-6"
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="app-kicker">{isCurrent && props.mode === "settings" ? "Current plan" : plan.badge}</p>
                  {plan.annualLabel && interval === "annual" ? (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                      {plan.annualLabel}
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{plan.name}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{plan.description}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-3xl font-semibold text-white">
                  {displayPrice === null ? "Custom" : formatCurrencyCents(displayPrice)}
                  {displayPrice !== null ? (
                    <span className="text-sm font-normal text-zinc-500">
                      {interval === "annual" ? " / year" : " / month"}
                    </span>
                  ) : null}
                </p>
                {interval === "annual" && annualEquivalent ? (
                  <p className="text-sm text-zinc-500">
                    {formatCurrencyCents(annualEquivalent, { showDecimals: true })}/mo billed annually
                  </p>
                ) : null}
                {displayPrice !== null && monthlyPrice !== null && interval === "annual" ? (
                  <p className="text-xs text-zinc-500">
                    Monthly price would be {formatCurrencyCents(monthlyPrice)} paid month to month.
                  </p>
                ) : null}
                {plan.includedUsageCreditCents ? (
                  <p className="text-xs text-zinc-400">
                    Includes {formatCurrencyCents(plan.includedUsageCreditCents)} monthly usage credit.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">Custom usage and deployment terms.</p>
                )}
              </div>

              <div className="mt-5 space-y-2 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <p key={feature}>{feature}</p>
                ))}
              </div>

              {plan.extraAgentPriceCents ? (
                <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
                  Add more agents for {formatCurrencyCents(plan.extraAgentPriceCents)} per agent / month.
                </div>
              ) : null}

              <div className="mt-6">
                {props.mode === "marketing" ? (
                  plan.contactSales ? (
                    <Button asChild className="w-full" variant="secondary">
                      <Link href="mailto:founder@saintclaw.ai?subject=Saint%20AGI%20Enterprise">{actionLabel}</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={marketingHref}>{actionLabel}</Link>
                    </Button>
                  )
                ) : (
                  plan.contactSales ? (
                    <Button asChild className="w-full" variant="secondary">
                      <Link href="mailto:founder@saintclaw.ai?subject=Saint%20AGI%20Enterprise">Contact sales</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCurrent ? "secondary" : "default"}
                      onClick={() => handleSettingsAction(plan.id)}
                      disabled={loadingKey !== null}
                    >
                      {loadingKey === plan.id ? "Redirecting..." : actionLabel}
                    </Button>
                  )
                )}
              </div>

              {props.mode === "marketing" ? (
                <p className="mt-4 text-xs text-zinc-500">{plan.audience}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {isMarketingMode ? (
        <>
          <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-400">
            <p className="text-white">Trial terms</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <p>14 days, no card required.</p>
              <p>1 agent included during trial.</p>
              <p>Free OpenRouter models only during trial.</p>
              <p>Channels, personal memory, and dashboard included.</p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-400">
            <p className="text-white">Add-ons and overages</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <p>Starter extra agents: {formatCurrencyCents(getPlanConfig("starter").extraAgentPriceCents ?? 0)} / agent / month.</p>
              <p>Pro extra agents: {formatCurrencyCents(getPlanConfig("pro").extraAgentPriceCents ?? 0)} / agent / month.</p>
              <p>Business extra agents: {formatCurrencyCents(getPlanConfig("business").extraAgentPriceCents ?? 0)} / agent / month.</p>
              <p>Paid-model usage beyond included credit is billed separately as adoption grows.</p>
            </div>
          </div>
        </>
      ) : null}

      {props.mode === "settings" ? (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-400">
          <p className="text-white">Usage and add-ons</p>
          <p>
            Model usage beyond included credit continues through your wallet and Stripe-backed top-ups. Extra agents are
            priced per tier, and additional storage can be added as usage grows.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <p>Starter extra agents: {formatCurrencyCents(getPlanConfig("starter").extraAgentPriceCents ?? 0)} / agent.</p>
            <p>Pro extra agents: {formatCurrencyCents(getPlanConfig("pro").extraAgentPriceCents ?? 0)} / agent.</p>
            <p>Business extra agents: {formatCurrencyCents(getPlanConfig("business").extraAgentPriceCents ?? 0)} / agent.</p>
            <p>Additional storage and isolation options can be layered on for larger rollouts.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-5 text-sm leading-7 text-zinc-400">
          <p className="text-white">Add-ons and overages</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <p>Starter extra agents: {formatCurrencyCents(getPlanConfig("starter").extraAgentPriceCents ?? 0)} / agent / month.</p>
            <p>Pro extra agents: {formatCurrencyCents(getPlanConfig("pro").extraAgentPriceCents ?? 0)} / agent / month.</p>
            <p>Business extra agents: {formatCurrencyCents(getPlanConfig("business").extraAgentPriceCents ?? 0)} / agent / month.</p>
            <p>Paid-model usage beyond included credit is billed separately as adoption grows.</p>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
