import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CtaBanner() {
  return (
    <section id="start" className="py-14 lg:py-16">
      <div className="site-shell">
        <Card className="rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
          <CardContent className="flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-xl space-y-3">
              <p className="text-xs tracking-[0.18em] text-zinc-500">Get started</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.02]">
                Bring real agents to the teams that need them.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Get access</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">See the platform</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
