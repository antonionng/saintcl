import { Check } from "lucide-react";

import { AccessDenied } from "@/components/dashboard/access-denied";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrg, getOrgWallet, getUsageSummary, getWalletLedger } from "@/lib/dal";
import { formatCurrency } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "One always-on agent for solo operators validating ROI.",
    features: ["1 agent", "Telegram or Slack", "Basic logs"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For teams running dedicated agents per function.",
    features: ["5 agents", "Usage-based runs", "Knowledge uploads"],
  },
  {
    id: "team",
    name: "Team",
    price: "$99",
    description: "Multi-user governance, RAG, and shared operating memory.",
    features: ["25 agents", "RAG enabled", "Approval workflows"],
  },
];

export default async function BillingPage() {
  const session = await getCurrentOrg();
  const currentPlan = session?.org.plan ?? "free";

  if (!session?.capabilities.canManageBilling) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Billing"
          title="Wallet and billing"
          description="Organization billing controls are restricted to admins."
        />
        <AccessDenied description="Ask an admin to manage wallet top-ups, plans, and spending controls." />
      </div>
    );
  }

  const [wallet, ledger, usage] = await Promise.all([
    getOrgWallet(session.org.id),
    getWalletLedger(session.org.id, 12),
    getUsageSummary(session.org.id),
  ]);

  const balance = (wallet?.balance_cents ?? 0) / 100;
  const weeklyBurn = usage.last7dSpendCents / 100;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="Usage-aware pricing"
        description="Upgrade organizations, enforce seat limits, and hand off subscription management to Stripe Checkout and the customer portal."
        action={<Button variant="secondary">Open portal</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wallet balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-semibold text-white">{formatCurrency(balance)}</div>
            <p className="text-sm text-zinc-500">
              Low-balance threshold: {formatCurrency((wallet?.low_balance_threshold_cents ?? 0) / 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projected burn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-semibold text-white">{formatCurrency(weeklyBurn)}</div>
            <p className="text-sm text-zinc-500">Last 7 days of recorded AI/API spend.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet actions</CardTitle>
          </CardHeader>
          <CardContent>
            <BillingActions />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Card
              key={plan.id}
              className={
                isCurrent ? "border-white/25 bg-white/[0.08]" : undefined
              }
            >
              <CardHeader>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {isCurrent ? "Current plan" : plan.id}
                </p>
                <CardTitle className="text-3xl">{plan.name}</CardTitle>
                <p className="text-3xl font-semibold text-white">
                  {plan.price}
                  <span className="text-sm text-zinc-500"> / month</span>
                </p>
                <p className="text-sm leading-7 text-zinc-400">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-zinc-300"
                  >
                    <Check className="size-4 text-emerald-400" />
                    {feature}
                  </div>
                ))}
                <Button className="mt-4 w-full" variant={isCurrent ? "secondary" : "default"}>
                  {isCurrent ? "Current" : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledger.length === 0 ? (
            <p className="text-sm text-zinc-500">No wallet entries yet.</p>
          ) : (
            ledger.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{entry.description}</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {entry.source_type} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={entry.direction === "credit" ? "text-emerald-400" : "text-amber-300"}>
                      {entry.direction === "credit" ? "+" : "-"}
                      {formatCurrency(entry.amount_cents / 100)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Balance {formatCurrency((entry.balance_after_cents ?? 0) / 100)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
