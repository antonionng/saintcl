import Link from "next/link";

import { PricingPlans } from "@/components/pricing/pricing-plans";
import { pricingIntro } from "@/components/landing/content";

export function PricingSection() {
  return (
    <section id="pricing" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{pricingIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {pricingIntro.title}
              </h2>
              <p className="text-sm leading-7 text-white/72 sm:text-base">{pricingIntro.description}</p>
            </div>
            <Link href="/pricing" className="text-sm text-white/72 transition-colors hover:text-white">
              View dedicated pricing page
            </Link>
          </div>
          <PricingPlans mode="marketing" />
        </div>
      </div>
    </section>
  );
}
