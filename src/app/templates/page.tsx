import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import placeholderLogo from "../../../public/saintclaw-placeholder-logo.png";

import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { AGENT_TEMPLATES } from "@/lib/agent-templates";

export const metadata = {
  title: "Agent templates · SaintClaw",
  description: "Pre-built AI agent templates for support, sales, ops, engineering, and more. Sign up to deploy in seconds.",
};

export default function PublicTemplatesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-black">
        <div className="site-shell flex items-center justify-between py-4">
          <Link href="/" className="inline-flex h-10 items-center">
            <Image src={placeholderLogo} alt="SaintClaw" height={32} width={32} className="h-8 w-auto" />
            <span className="ml-3 text-base font-semibold tracking-[-0.02em] text-white">SaintClaw</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="site-shell py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="app-kicker mb-3">Templates</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Pick an agent. Ship in minutes.
          </h1>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Pre-built templates for the most common roles. Each one comes with a persona, suggested apps,
            and a knowledge layout you can customize.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_TEMPLATES.filter((t) => t.id !== "custom").map((template) => {
            const Icon = template.icon;
            return (
              <Link
                key={template.id}
                href={`/signup?template=${template.id}`}
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
                  Use this template
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border-subtle bg-surface-1 p-8">
          <div>
            <p className="text-lg font-medium text-white">Don&apos;t see your role?</p>
            <p className="mt-1 text-sm text-zinc-400">
              Start from a blank template and define your own persona.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/signup">Get started free</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
