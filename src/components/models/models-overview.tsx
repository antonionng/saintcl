import Link from "next/link";
import { ArrowRight, GitBranch, ShieldCheck, Zap } from "lucide-react";

import {
  modelBands,
  modelBandsIntro,
  modelsClosingCta,
  modelsPageHero,
  modelsPositioningCards,
  modelsUseCases,
  modelsUseCasesIntro,
  operatingPrinciples,
  operatingPrinciplesIntro,
} from "@/components/models/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const positioningIcons = [GitBranch, Zap, ShieldCheck] as const;

export function ModelsOverview() {
  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_64%)]" />

      <section className="py-18 lg:py-24">
        <div className="site-shell">
          <div className="border-t border-white/8 pt-16 lg:pt-20">
            <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center">
              <p className="app-kicker">{modelsPageHero.kicker}</p>
              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-[5rem] lg:leading-[0.95]">
                {modelsPageHero.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">{modelsPageHero.description}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {modelsPageHero.proofPoints.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={modelsPageHero.primary.href}>{modelsPageHero.primary.label}</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={modelsPageHero.secondary.href}>{modelsPageHero.secondary.label}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="grid gap-4 lg:grid-cols-3">
            {modelsPositioningCards.map((item, index) => {
              const Icon = positioningIcons[index];
              return (
                <Card key={item.title} className="rounded-[1.5rem]">
                  <CardHeader className="space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-[1.45rem]">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-zinc-300">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{modelBandsIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {modelBandsIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{modelBandsIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {modelBands.map((item) => (
                <Card key={item.title} className="rounded-[1.5rem]">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-[1.45rem]">{item.title}</CardTitle>
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">{item.badge}</p>
                    </div>
                    <CardDescription className="text-sm leading-7 text-zinc-300">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 border-t border-white/8 pt-5 text-sm leading-6 text-zinc-400">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/45" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="max-w-2xl space-y-4">
              <p className="app-kicker">{operatingPrinciplesIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {operatingPrinciplesIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{operatingPrinciplesIntro.description}</p>
            </div>

            <div className="space-y-4">
              {operatingPrinciples.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-medium text-white">
                    {item.step}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                    <p className="text-sm leading-7 text-zinc-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{modelsUseCasesIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {modelsUseCasesIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{modelsUseCasesIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {modelsUseCases.map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-6 lg:p-7">
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">{item.team}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-7 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl space-y-4">
                <p className="app-kicker">Why this matters</p>
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                  {modelsClosingCta.title}
                </h2>
                <p className="text-sm leading-7 text-zinc-300 sm:text-base">{modelsClosingCta.description}</p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button asChild size="lg">
                  <Link href={modelsClosingCta.primary.href}>{modelsClosingCta.primary.label}</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={modelsClosingCta.secondary.href}>
                    {modelsClosingCta.secondary.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
