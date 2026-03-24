import Link from "next/link";
import {
  Bot,
  BrainCircuit,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  capabilityComparison,
  capabilityComparisonIntro,
  capabilitiesPageHero,
  capabilityBands,
  capabilityBandsIntro,
  capabilityPillars,
  capabilityPillarsIntro,
  differentiators,
  differentiatorsIntro,
  operatingModelIntro,
  operatingModelSteps,
} from "@/components/capabilities/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillarIcons = {
  "Autonomous execution": Bot,
  "Channels and communication": MessageSquareText,
  "Tools and work surfaces": Wrench,
  "Memory and session design": BrainCircuit,
  "Model and agent orchestration": GitBranch,
  "Governance and trust": ShieldCheck,
} as const;

const comparisonIcons = [MessageSquareText, Bot] as const;

export function CapabilitiesOverview() {
  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_64%)]" />

      <section className="py-18 lg:py-24">
        <div className="site-shell">
          <div className="border-t border-white/8 pt-16 lg:pt-20">
            <div className="mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center">
                <p className="app-kicker">{capabilitiesPageHero.kicker}</p>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-[5rem] lg:leading-[0.95]">
                  {capabilitiesPageHero.title}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">{capabilitiesPageHero.description}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {capabilitiesPageHero.proofPoints.map((item) => (
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
                    <Link href={capabilitiesPageHero.primary.href}>{capabilitiesPageHero.primary.label}</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href={capabilitiesPageHero.secondary.href}>{capabilitiesPageHero.secondary.label}</Link>
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5 lg:p-6">
              <p className="app-kicker">Execution quality</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Acts across tools</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Browser, files, shell, GitHub, search, calendar, and device actions stay inside one governed runtime.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5 lg:p-6">
              <p className="app-kicker">Runtime quality</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Stays live over time</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Persistent sessions, always-on activation modes, and local-first deployment keep the assistant useful
                after day one.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5 lg:p-6">
              <p className="app-kicker">Trust quality</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Governed before scale</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Approvals, allowlists, audit trails, and health checks keep the operator in control as usage expands.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{capabilityPillarsIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {capabilityPillarsIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{capabilityPillarsIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {capabilityPillars.map((item) => {
                const Icon = pillarIcons[item.title];
                return (
                  <Card key={item.title} className="rounded-[1.5rem]">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">{item.badge}</p>
                      </div>
                      <CardTitle className="text-[1.45rem]">{item.title}</CardTitle>
                      <CardDescription className="text-sm leading-7 text-zinc-300">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 border-t border-white/8 pt-5 text-sm leading-6 text-zinc-400">
                        {item.outcomes.map((outcome) => (
                          <li key={outcome} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/45" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{capabilityComparisonIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {capabilityComparisonIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{capabilityComparisonIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {capabilityComparison.map((item, index) => {
                const Icon = comparisonIcons[index];
                return (
                  <Card key={item.title} className="rounded-[1.5rem]">
                    <CardHeader className="space-y-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-[1.45rem]">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 border-t border-white/8 pt-5 text-sm leading-6 text-zinc-400">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/45" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 lg:py-24">
        <div className="site-shell border-t border-white/8 pt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div className="max-w-2xl space-y-4">
              <p className="app-kicker">{operatingModelIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {operatingModelIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{operatingModelIntro.description}</p>
            </div>

            <div className="space-y-4">
              {operatingModelSteps.map((item) => (
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
              <p className="app-kicker">{capabilityBandsIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {capabilityBandsIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{capabilityBandsIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {capabilityBands.map((item) => (
                <Card key={item.title} className="rounded-[1.45rem]">
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-[1.35rem]">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-zinc-300">{item.summary}</CardDescription>
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
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <p className="app-kicker">{differentiatorsIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {differentiatorsIntro.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-400 sm:text-base">{differentiatorsIntro.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {differentiators.map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-6 lg:p-7">
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
