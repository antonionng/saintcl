import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const useCases = [
  ["Sales", "Pipeline, prep, and outbound"],
  ["Operations", "Requests, reviews, and routing"],
  ["Research", "Monitoring, briefs, and synthesis"],
  ["Leadership", "Planning, reporting, and execution"],
];

export function UseCaseGrid() {
  return (
    <section id="teams" className="py-14 lg:py-16">
      <div className="site-shell space-y-7">
        <div className="space-y-3">
          <p className="text-xs tracking-[0.18em] text-zinc-500">Designed around real teams</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.02]">
            Agents that work where your company already works.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
            <CardHeader className="space-y-2">
              <p className="text-xs tracking-[0.18em] text-zinc-500">Where agents show up</p>
              <CardTitle className="max-w-lg text-[1.7rem] leading-tight tracking-[-0.04em]">
                Teams get agents shaped around the work they already own.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {useCases.map(([title, description]) => (
                <div key={title} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <p className="text-lg font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-white/[0.025]">
            <CardHeader className="space-y-2">
              <p className="text-xs tracking-[0.18em] text-zinc-500">Why it works</p>
              <CardTitle className="text-[1.45rem] leading-tight tracking-[-0.04em]">
                Not another OpenAI, Gemini, or Claude tab.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-zinc-400">
              <p>Agents stay grounded in company knowledge.</p>
              <p>Guardrails keep actions safe and auditable.</p>
              <p>Employees get help where work already happens.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
