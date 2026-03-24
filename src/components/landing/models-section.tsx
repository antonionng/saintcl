import Link from "next/link";

import { modelCoverageCards, modelsIntro, modelsSectionCta, modelsSectionProofPoints } from "@/components/landing/content";
import { Button } from "@/components/ui/button";

export function ModelsSection() {
  return (
    <section id="models" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-4">
              <p className="app-kicker">{modelsIntro.kicker}</p>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {modelsIntro.title}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
                {modelsIntro.description}
              </p>
            </div>

            <div className="flex items-center lg:justify-end">
              <Button asChild size="lg">
                <Link href={modelsSectionCta.href}>{modelsSectionCta.label}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-0 border-y border-white/8 lg:grid-cols-4">
            {modelCoverageCards.map((item) => (
              <div key={item.title} className="space-y-3 border-b border-white/8 px-0 py-6 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/60">{item.badge}</p>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="text-sm leading-7 text-white/72">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
            <p className="text-sm leading-7 text-white/72">
              One consistent company standard. Teams can use more power where it matters, keep fast lanes for everyday work,
              and stay governed as usage expands.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {modelsSectionProofPoints.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/72">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
