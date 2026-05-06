import Link from "next/link";

import { PLAN_CATALOG, PLAN_ORDER } from "@/lib/plans";

const audienceLabels: Record<string, string> = {
  starter: "SOLO PROFESSIONALS",
  pro: "SMALL TEAMS & SMBS",
  business: "MID-SIZE COMPANIES",
  enterprise: "SECURITY-SENSITIVE ORGS",
};

const sectionLabels: Record<string, string> = {
  starter: "STARTER",
  pro: "POPULAR",
  business: "SCALE",
  enterprise: "ENTERPRISE",
};

function formatPrice(cents: number | null): string {
  if (cents == null) return "Custom";
  return `£${(cents / 100).toFixed(0)}`;
}

function formatUsageCredit(cents: number | null): string {
  if (cents == null) return "Custom usage and deployment terms.";
  return `Includes £${(cents / 100).toFixed(0)} monthly usage credit.`;
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pb-[100px] lg:px-20">
        <div className="flex flex-col items-center gap-[18px] pb-[60px] pt-[100px] text-center">
          <SectionEyebrow label="PRICING" />
          <h2 className="max-w-[1100px] text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px] lg:leading-[64px]">
            Agent pricing that scales with your team.
          </h2>
          <p className="max-w-[720px] text-[15px] leading-7 text-[#b5b5bd] lg:text-[18px] lg:leading-[27px]">
            Starter add-ons are £22/month, Pro add-ons are £19/month, and Business add-ons are
            £16/month.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((tier) => {
            const plan = PLAN_CATALOG[tier];
            const isPopular = tier === "pro";
            const isEnterprise = tier === "enterprise";

            return (
              <article
                key={tier}
                className={`flex flex-col rounded-2xl border bg-[#0a0a0a] px-6 py-7 ${
                  isPopular ? "border-[#b5b5bd]" : "border-[#1f1f23]"
                }`}
              >
                <p
                  className={`text-[10.5px] font-medium tracking-[0.16em] ${
                    isPopular ? "text-white" : "text-[#6e6e78]"
                  }`}
                >
                  {sectionLabels[tier]}
                </p>
                <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white">
                  {plan.name}
                </p>
                <p className="mt-3 text-[13px] leading-[19px] tracking-[-0.005em] text-[#b5b5bd]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  {isEnterprise ? (
                    <p className="text-[28px] font-bold tracking-[-0.02em] text-white">Custom</p>
                  ) : (
                    <>
                      <p className="text-[36px] font-bold leading-none tracking-[-0.03em] text-white">
                        {formatPrice(plan.monthlyPriceCents)}
                      </p>
                      <p className="text-[13px] text-[#6e6e78]">/ month</p>
                    </>
                  )}
                </div>
                <p className="mt-1 text-[11.5px] text-[#6e6e78]">
                  {formatUsageCredit(plan.includedUsageCreditCents)}
                </p>

                <ul className="mt-6 flex flex-col gap-2.5 border-y border-[#1f1f23] py-[18px]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#6e6e78]" />
                      <span className="text-[12.5px] leading-[18px] tracking-[-0.005em] text-[#b5b5bd]">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.extraAgentPriceCents != null ? (
                  <p className="mt-4 text-[11.5px] leading-4 text-[#6e6e78]">
                    Add more agents for £{(plan.extraAgentPriceCents / 100).toFixed(0)} per agent /
                    month.
                  </p>
                ) : (
                  <span className="mt-4 block h-4" />
                )}

                <PlanCta tier={tier} popular={isPopular} label={plan.ctaLabel} />

                <p className="mt-3 text-center text-[11px] font-medium tracking-[0.1em] text-[#6e6e78]">
                  {audienceLabels[tier]}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlanCta({
  tier,
  popular,
  label,
}: {
  tier: string;
  popular: boolean;
  label: string;
}) {
  const href =
    tier === "enterprise"
      ? "/#contact"
      : "/#contact";

  const className = popular
    ? "mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-white text-[13px] font-semibold !text-black transition-colors hover:bg-white/90"
    : "mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-[#2a2a30] bg-[#14141a] text-[13px] font-semibold text-white transition-colors hover:border-[#3a3a40] hover:bg-[#1a1a22]";

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-7 bg-[#404048]" />
      <span className="text-[12px] font-medium tracking-[0.22em] text-[#6e6e78]">{label}</span>
      <span className="h-px w-7 bg-[#404048]" />
    </div>
  );
}
