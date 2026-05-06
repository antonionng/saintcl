"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TRIAL_FREE_MODEL_LABEL,
  TRIAL_LENGTH_DAYS,
  getResolvedTrialStatus,
  getTrialDaysRemaining,
} from "@/lib/plans";

const DISMISS_KEY = "saintagi:global-trial-banner-dismissed";
const DISMISS_EVENT = "saintagi:global-trial-banner-dismissed";

function getDismissedSnapshot() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "true";
}

function subscribeDismissed(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener(DISMISS_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISMISS_EVENT, callback);
  };
}

type GlobalTrialBannerProps = {
  trialStatus?: string | null;
  trialEndsAt?: string | null;
  isSuperAdmin?: boolean;
  className?: string;
};

export function GlobalTrialBanner({
  trialStatus,
  trialEndsAt,
  isSuperAdmin,
  className,
}: GlobalTrialBannerProps) {
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissedSnapshot, () => false);

  const resolvedStatus = getResolvedTrialStatus(trialStatus, trialEndsAt);
  const trialActive = resolvedStatus === "active" && !isSuperAdmin;
  if (!trialActive) {
    return null;
  }
  if (dismissed) {
    return null;
  }

  const daysRemaining = getTrialDaysRemaining(trialEndsAt);
  const dayCount = Math.max(1, Math.min(TRIAL_LENGTH_DAYS, TRIAL_LENGTH_DAYS - daysRemaining + 1));

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "true");
      window.dispatchEvent(new Event(DISMISS_EVENT));
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-md border border-border bg-white/[0.03] p-4 xl:flex-row xl:items-center xl:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border-subtle text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[length:var(--text-sm)] font-medium text-white">
            Day {dayCount} of {TRIAL_LENGTH_DAYS} - your agents are running on {TRIAL_FREE_MODEL_LABEL}
          </p>
          <p className="text-[length:var(--text-xs)] leading-5 text-white/55">
            Upgrade to Starter for £49/mo and unlock Claude Sonnet 4.5 and GPT-5: sharper reasoning, longer context, and tool-using agents that actually ship work. Includes £15 of paid LLM credit each month, or top up your wallet to pay-as-you-go.
          </p>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:justify-end xl:self-center">
        <Button asChild size="sm" className="flex-1 sm:flex-none">
          <Link href="/pricing">Upgrade for £49/mo</Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
          <Link href="/settings?tab=billing">Top up wallet</Link>
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss trial banner for this session"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-white/55 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
