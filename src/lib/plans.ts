import type { BillingInterval, PlanTier } from "@/types";

export const BILLING_INTERVALS = ["monthly", "annual"] as const satisfies BillingInterval[];
export const PLAN_ORDER = ["starter", "pro", "business", "enterprise"] as const satisfies PlanTier[];
export const SELF_SERVE_PLAN_ORDER = ["starter", "pro", "business"] as const satisfies PlanTier[];
export const TRIAL_LENGTH_DAYS = 14;
export const TRIAL_AGENT_LIMIT = 1;

type PlanCatalogEntry = {
  id: PlanTier;
  name: string;
  badge: string;
  description: string;
  audience: string;
  monthlyPriceCents: number | null;
  annualPriceCents: number | null;
  includedAgents: number;
  includedUsageCreditCents: number | null;
  extraAgentPriceCents: number | null;
  extraSeatPriceCents: number | null;
  storageGb: number | null;
  features: string[];
  monthlyHighlights: string[];
  annualLabel?: string;
  ctaLabel: string;
  contactSales?: boolean;
};

export const PLAN_CATALOG: Record<PlanTier, PlanCatalogEntry> = {
  starter: {
    id: "starter",
    name: "Starter",
    badge: "Starter",
    description: "For solo operators and consultants launching a few high-value agents with real governance from day one.",
    audience: "Solo professionals / freelancers",
    monthlyPriceCents: 4900,
    annualPriceCents: 44100,
    includedAgents: 3,
    includedUsageCreditCents: 1500,
    extraAgentPriceCents: 2200,
    extraSeatPriceCents: 1200,
    storageGb: 5,
    features: [
      "3 always-on agents",
      "£15 monthly usage credit",
      "Personal memory and private knowledge",
      "Channels, browser actions, and basic guardrails",
    ],
    monthlyHighlights: ["3 agents", "£15 usage credit", "5 GB storage"],
    annualLabel: "Save 25% annually",
    ctaLabel: "Start Starter trial",
  },
  pro: {
    id: "pro",
    name: "Pro",
    badge: "Popular",
    description: "For small teams deploying specialized agents with shared knowledge, stronger approvals, and clearer operator controls.",
    audience: "Small teams & SMBs",
    monthlyPriceCents: 19900,
    annualPriceCents: 179100,
    includedAgents: 10,
    includedUsageCreditCents: 10000,
    extraAgentPriceCents: 1900,
    extraSeatPriceCents: 900,
    storageGb: 25,
    features: [
      "10 always-on agents",
      "£100 monthly usage credit",
      "Shared company knowledge base",
      "Approval gates, analytics, and allowlists",
      "Built for specialized team rollout",
    ],
    monthlyHighlights: ["10 agents", "£100 usage credit", "25 GB storage"],
    annualLabel: "Save 25% annually",
    ctaLabel: "Start Pro trial",
  },
  business: {
    id: "business",
    name: "Business",
    badge: "Scale",
    description: "For companies rolling out governed AI across departments with deeper observability, orchestration, and support.",
    audience: "Mid-size companies",
    monthlyPriceCents: 99900,
    annualPriceCents: 899100,
    includedAgents: 30,
    includedUsageCreditCents: 50000,
    extraAgentPriceCents: 1600,
    extraSeatPriceCents: 700,
    storageGb: 100,
    features: [
      "30 always-on agents",
      "£500 monthly usage credit",
      "Advanced governance and observability",
      "Multi-agent orchestration and support",
      "Built for cross-functional deployment",
    ],
    monthlyHighlights: ["30 agents", "£500 usage credit", "100 GB storage"],
    annualLabel: "Save 25% annually",
    ctaLabel: "Start Business trial",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    badge: "Enterprise",
    description: "For regulated and security-sensitive deployments that need custom commercial terms.",
    audience: "Security-sensitive orgs",
    monthlyPriceCents: null,
    annualPriceCents: null,
    includedAgents: 0,
    includedUsageCreditCents: null,
    extraAgentPriceCents: null,
    extraSeatPriceCents: null,
    storageGb: null,
    features: [
      "Custom agent volume",
      "Identity, residency, and procurement support",
      "Dedicated deployment and SLA options",
      "Custom usage and support agreements",
    ],
    monthlyHighlights: ["Custom pricing", "Advanced compliance", "Dedicated support"],
    ctaLabel: "Talk to sales",
    contactSales: true,
  },
};

export function normalizePlanTier(plan: string | null | undefined): PlanTier {
  switch ((plan ?? "").toLowerCase()) {
    case "business":
    case "team":
      return "business";
    case "pro":
      return "pro";
    case "enterprise":
      return "enterprise";
    case "starter":
    case "free":
    default:
      return "starter";
  }
}

export function isSelfServePlan(plan: PlanTier) {
  return plan === "starter" || plan === "pro" || plan === "business";
}

export function getPlanConfig(plan: string | null | undefined) {
  return PLAN_CATALOG[normalizePlanTier(plan)];
}

export function getPlanDisplayName(plan: string | null | undefined) {
  return getPlanConfig(plan).name;
}

export function getPlanPriceCents(plan: string | null | undefined, interval: BillingInterval) {
  const config = getPlanConfig(plan);
  return interval === "annual" ? config.annualPriceCents : config.monthlyPriceCents;
}

export function getPlanAnnualEquivalentMonthlyCents(plan: string | null | undefined) {
  const annual = getPlanPriceCents(plan, "annual");
  return annual ? Math.round(annual / 12) : null;
}

export function getPlanAgentLimit(
  plan: string | null | undefined,
  options?: { trialStatus?: string | null; isSuperAdmin?: boolean },
) {
  if (options?.isSuperAdmin) {
    return Number.POSITIVE_INFINITY;
  }

  if (options?.trialStatus === "active") {
    return TRIAL_AGENT_LIMIT;
  }

  return getPlanConfig(plan).includedAgents;
}

export function canProvisionAnotherAgent(
  plan: string | null | undefined,
  currentAgentCount: number,
  options?: { trialStatus?: string | null; isSuperAdmin?: boolean },
) {
  return currentAgentCount < getPlanAgentLimit(plan, options);
}

export function getAgentProvisionLimitMessage(
  plan: string | null | undefined,
  options?: { trialStatus?: string | null },
) {
  const limit = getPlanAgentLimit(plan, options);
  if (options?.trialStatus === "active") {
    return `Your trial includes ${limit} agent. Upgrade to unlock the full ${getPlanDisplayName(plan)} plan limits.`;
  }
  return `Your ${getPlanDisplayName(plan)} plan allows up to ${limit} agent${limit === 1 ? "" : "s"}. Upgrade your plan to provision more.`;
}

export function getPlanIntervalLabel(interval: BillingInterval) {
  return interval === "annual" ? "Annual" : "Monthly";
}

export function getPlanSeatPriceCents(plan: string | null | undefined) {
  return getPlanConfig(plan).extraSeatPriceCents;
}

export function getResolvedTrialStatus(
  trialStatus: string | null | undefined,
  trialEndsAt?: string | null,
) {
  if (trialStatus === "converted") {
    return "converted";
  }
  if (trialStatus === "active" && trialEndsAt) {
    return new Date(trialEndsAt).getTime() > Date.now() ? "active" : "expired";
  }
  if (trialStatus === "expired") {
    return "expired";
  }
  return "none";
}

export function getTrialDaysRemaining(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return 0;
  }
  const remainingMs = new Date(trialEndsAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}
