import Link from "next/link";

import { articleCta } from "@/components/landing/content";
import { Button } from "@/components/ui/button";

export function ArticleCta() {
  return (
    <section className="mt-14 border-t border-white/8 pt-10">
      <div className="app-surface-subtle rounded-[1.75rem] p-8 sm:p-10">
        <div className="max-w-2xl space-y-4">
          <p className="app-kicker">{articleCta.kicker}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-[2.4rem] sm:leading-[1.02]">
            {articleCta.title}
          </h2>
          <p className="text-base leading-8 text-zinc-400 sm:text-[1.02rem]">{articleCta.description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={articleCta.primary.href}>{articleCta.primary.label}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={articleCta.secondary.href}>{articleCta.secondary.label}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
