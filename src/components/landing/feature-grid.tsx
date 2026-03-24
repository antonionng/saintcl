import Link from "next/link";
import { Bot, BrainCircuit, HardDrive, MessageSquareText, ShieldCheck, Wrench } from "lucide-react";

import { capabilitiesIntro, capabilityCards } from "@/components/landing/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const capabilityIcons = {
  "Autonomous execution": Bot,
  "Channels and presence": MessageSquareText,
  "Tools and automation": Wrench,
  "Memory and routing": BrainCircuit,
  "Governance and trust": ShieldCheck,
  "Local-first runtime": HardDrive,
} as const;

export function FeatureGrid() {
  return (
    <section id="capabilities" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
            <div className="max-w-4xl space-y-5">
              <p className="app-kicker">{capabilitiesIntro.kicker}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3.2rem] lg:leading-[1.04]">
                {capabilitiesIntro.title}
              </h2>
              <p className="max-w-3xl text-base leading-8 text-white sm:text-lg">{capabilitiesIntro.description}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-black p-5 lg:p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/60">Saint AGI signal</p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">{capabilitiesIntro.supportingCopy}</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Give teams the right agents, models, and channels for each task without fragmenting policy, rollout,
                or operator control.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilityCards.map((item) => {
              const Icon = capabilityIcons[item.title];
              return (
                <Card key={item.title} className="h-full rounded-[1.4rem] bg-black shadow-none">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/60">{item.badge}</p>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-white/84">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="border-t border-white/8 pt-4 text-sm leading-6 text-white/72">{item.proof}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href={capabilitiesIntro.cta.href}>{capabilitiesIntro.cta.label}</Link>
            </Button>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              See how Saint AGI combines execution, routing, governance, and real tool use into one platform your
              company can roll out with confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
