import { connectorMaturityCards, launchSteps, productSystemIntro, productSystemPillars } from "@/components/landing/content";

export function ProductSystemSection() {
  return (
    <section id="platform" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
            <div className="max-w-4xl space-y-5">
              <p className="app-kicker">{productSystemIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3.2rem] lg:leading-[1.04]">
                {productSystemIntro.title}
              </h2>
              <p className="max-w-3xl text-base leading-8 text-white sm:text-lg">{productSystemIntro.description}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5 lg:p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/60">10-minute launch path</p>
              <div className="mt-5 space-y-4">
                {launchSteps.map((step) => (
                  <div key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black text-sm font-medium text-white">
                      {step.label}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/72">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {productSystemPillars.map((pillar) => (
              <div key={pillar.title} className="rounded-[1.4rem] border border-white/8 bg-black p-5 lg:p-6">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/84">{pillar.description}</p>
                <p className="mt-5 border-t border-white/8 pt-4 text-sm leading-6 text-white/72">{pillar.proof}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-black p-5 lg:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div>
                <p className="app-kicker">Connector maturity</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Start where teams work today. Expand with enterprise controls.
                </h3>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {connectorMaturityCards.map((card) => (
                  <div key={card.title} className="rounded-[1.1rem] border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/60">{card.title}</p>
                    <h4 className="mt-3 text-sm font-semibold leading-6 text-white">{card.channels}</h4>
                    <p className="mt-2 text-sm leading-6 text-white/72">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
