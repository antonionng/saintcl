import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden pb-24 pt-22 lg:min-h-[88vh] lg:pb-36 lg:pt-28">
      <div className="site-shell">
        <div className="border-t border-white/8 pt-16 lg:pt-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center space-y-7 text-center lg:space-y-8">
            <p className="app-kicker">Saint AGI</p>
            <div className="space-y-4">
              <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.08em] text-white sm:text-6xl lg:text-[6.4rem] lg:leading-[0.9]">
                AI agents for every employee.
              </h1>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white sm:text-lg">
              Give employees governed agents across Slack, email, Teams, and CRM. They reason, plan, act, route,
              and follow through with your company&apos;s rules enforced.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Start with one team, prove value fast, and scale adoption across the company with centralized control.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Button asChild size="lg">
                <Link href="/signup">Start free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
