"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const topupOptions = [
  { label: "£25", amountCents: 2500 },
  { label: "£100", amountCents: 10000 },
  { label: "£250", amountCents: 25000 },
];

export function BillingActions({
  returnPath = "/billing",
  canIssueManualCredit = false,
}: {
  returnPath?: string;
  canIssueManualCredit?: boolean;
}) {
  const [manualAmount, setManualAmount] = useState("50");
  const [creditAmount, setCreditAmount] = useState("25");
  const [creditDescription, setCreditDescription] = useState("Admin wallet credit");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openCheckout(amountCents: number) {
    setLoading(`topup-${amountCents}`);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "topup", amountCents, returnPath }),
      });
      const body = (await res.json()) as { url?: string; error?: { message?: string } };
      if (!res.ok || !body.url) {
        throw new Error(body.error?.message || "Unable to start checkout.");
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing request failed.");
      setLoading(null);
    }
  }

  async function issueManualCredit() {
    setLoading("manual-credit");
    setError(null);
    try {
      const res = await fetch("/api/billing/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.max(100, Math.round(Number(creditAmount || "0") * 100)),
          description: creditDescription,
        }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to issue credit.");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manual credit failed.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="app-kicker">Add balance</p>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {topupOptions.map((option) => (
            <Button
              key={option.amountCents}
              variant="secondary"
              size="sm"
              onClick={() => openCheckout(option.amountCents)}
              disabled={loading !== null}
            >
              {loading === `topup-${option.amountCents}` ? "Redirecting..." : option.label}
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            type="number"
            min="5"
            step="1"
            value={manualAmount}
            onChange={(event) => setManualAmount(event.target.value)}
            placeholder="Custom top-up"
          />
          <Button
            variant="secondary"
            onClick={() => openCheckout(Math.max(500, Math.round(Number(manualAmount || "0") * 100)))}
            disabled={loading !== null}
            className="w-full sm:w-auto"
          >
            Custom
          </Button>
        </div>
      </div>

      {canIssueManualCredit ? (
        <div className="space-y-3 border-t border-border-subtle pt-5">
          <p className="app-kicker">Manual platform credit</p>
          <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
            <Input
              type="number"
              min="1"
              step="1"
              value={creditAmount}
              onChange={(event) => setCreditAmount(event.target.value)}
              placeholder="Amount in GBP"
            />
            <Input
              value={creditDescription}
              onChange={(event) => setCreditDescription(event.target.value)}
              placeholder="Credit description"
            />
          </div>
          <Button variant="secondary" onClick={issueManualCredit} disabled={loading !== null} className="w-full sm:w-auto">
            {loading === "manual-credit" ? "Applying..." : "Apply manual credit"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

