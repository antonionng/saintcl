import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section id="start" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <p className="app-kicker">Start with Saint AGI</p>
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
            Make your company AI-powered. Keep the rollout under control.
          </h2>
          <p className="text-sm leading-7 text-white/72">
            Start free with a 14-day trial, no card required. Launch with one team, then expand across the business on
            your terms.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
