import Link from "next/link";

import { CtaBanner } from "@/components/landing/cta-banner";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroSection } from "@/components/landing/hero";
import { UseCaseGrid } from "@/components/landing/use-case-grid";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-black/60 backdrop-blur-2xl">
        <div className="site-shell flex items-center justify-between py-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Logo />
          <nav className="hidden items-center justify-center gap-8 text-sm text-zinc-400 lg:flex">
            <Link className="transition-colors hover:text-white" href="#capabilities">
              Capabilities
            </Link>
            <Link className="transition-colors hover:text-white" href="#teams">
              Teams
            </Link>
            <Link className="transition-colors hover:text-white" href="#start">
              Get started
            </Link>
          </nav>
          <div className="flex items-center gap-2.5 sm:gap-3 lg:justify-self-end">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get access</Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_56%)]" />
        <HeroSection />
        <FeatureGrid />
        <UseCaseGrid />
        <CtaBanner />
      </div>
    </main>
  );
}
