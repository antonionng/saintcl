import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { AGENT_TEMPLATES } from "@/lib/agent-templates";

export const metadata = {
  title: "Agent Recipes for Business Workflows",
  description:
    "Recipe-backed company agents for meetings, support, sales, operations, IT, engineering, and more.",
  alternates: {
    canonical: "/templates",
  },
};

export default function PublicTemplatesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-black">
        <div className="site-shell flex items-center justify-between py-4">
          <Link href="/" className="inline-flex h-10 items-center">
            <Image
              src="/saint-agi-mark.svg"
              alt="Saint AGI"
              width={397}
              height={238}
              className="h-8 w-auto object-contain"
              unoptimized
            />
            <span className="ml-3 text-base font-semibold tracking-[-0.02em] text-white">Saint AGI</span>
          </Link>
          <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/#contact">Join waitlist</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="site-shell py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="app-kicker mb-3">Agent recipes</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Pick the business outcome. Provision the agent in minutes.
          </h1>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Pre-built recipes for the most common company workflows. Each one comes with a persona, suggested channels
            and tools, and a knowledge layout you can customize.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_TEMPLATES.filter((t) => t.id !== "custom").map((template) => {
            const Icon = template.icon;
            return (
              <Link
                key={template.id}
                href="/#contact"
                className="group flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-6 transition-colors hover:border-border hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-surface-3 text-white">
                    <Icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">{template.name}</p>
                  <p className="mt-2 text-sm leading-snug text-zinc-400">{template.tagline}</p>
                </div>
                <p className="mt-auto text-xs uppercase tracking-[0.08em] text-zinc-500">
                  Use this recipe
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface-1 p-5 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-medium text-white">Don&apos;t see your role?</p>
            <p className="mt-1 text-sm text-zinc-400">
              Start from a custom agent and define your own business outcome, persona, and rollout scope.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/#contact">Join waitlist</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
