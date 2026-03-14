import { ArrowUpRight, Database, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const capabilities = [
  {
    icon: Workflow,
    title: "Execute workflows",
    description: "Agents trigger actions end-to-end. Update records, send follow-ups, move deals forward.",
  },
  {
    icon: Database,
    title: "Pull from live data",
    description: "Query your systems in real time. No copy-paste, no stale context.",
  },
  {
    icon: Sparkles,
    title: "Make decisions",
    description: "Route requests, draft responses, and escalate when needed. No human bottleneck.",
  },
  {
    icon: ShieldCheck,
    title: "Stay governed",
    description: "Every action is logged, bounded by guardrails, and approved by your rules.",
  },
];

export function FeatureGrid() {
  return (
    <section id="capabilities" className="py-14 lg:py-16">
      <div className="site-shell space-y-7">
        <div className="space-y-3">
          <p className="text-xs tracking-[0.18em] text-zinc-500">Not chatbots</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.02]">
            Agents that do the work. Not just talk about it.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="h-full rounded-[1.8rem] bg-white/[0.022]">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <capability.icon className="size-5 text-white" />
                  <ArrowUpRight className="size-4 text-zinc-500" />
                </div>
                <CardTitle className="text-xl tracking-[-0.03em]">{capability.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-zinc-400">{capability.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
