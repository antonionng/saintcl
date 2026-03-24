import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintclaw-placeholder-logo.png";

import { UserDropdownMenu } from "@/components/account/user-dropdown-menu";
import { headerLinks } from "@/components/landing/content";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getCurrentUserProfile, getCurrentUserWorkspaces } from "@/lib/dal";

export default async function PricingPage() {
  const session = await getCurrentOrg();
  const profile = session ? await getCurrentUserProfile() : null;
  const workspaces = session ? await getCurrentUserWorkspaces() : [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(5,6,8,0.96)_38%,rgba(8,9,11,0.18)_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[18rem] w-[42rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),rgba(255,255,255,0.04)_34%,transparent_72%)]" />

        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md">
          <div className="site-shell flex items-center justify-between py-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <Link href="/" className="inline-flex h-10 items-center">
              <Image
                src={placeholderLogo}
                alt="Saint AGI"
                className="h-10 w-auto object-contain opacity-95"
                priority
              />
            </Link>
            <nav className="hidden items-center justify-center gap-8 text-sm text-zinc-400 lg:flex">
              {headerLinks.map((item) => (
                <Link key={item.href} className="transition-colors hover:text-white" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2.5 sm:gap-3 lg:justify-self-end">
              {session ? (
                <UserDropdownMenu
                  email={profile?.email ?? session.email}
                  displayName={profile?.displayName}
                  avatarUrl={profile?.avatarUrl}
                  workspaces={workspaces}
                  currentOrgId={session.org.id}
                  align="right"
                />
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Start</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="site-shell relative z-10 py-16 lg:py-22">
          <div className="mx-auto max-w-4xl space-y-4 text-center">
            <p className="app-kicker">Pricing</p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-[4.2rem]">
              Pricing that scales from one team to company-wide AI adoption.
            </h1>
            <p className="mx-auto max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
              Start with a governed trial, launch with one team, and expand across the business as adoption grows. Clear
              plans, included usage credit, and straightforward scale-up costs.
            </p>
          </div>

          <div className="mt-12">
            <PricingPlans mode="marketing" />
          </div>
        </div>
      </div>

      <footer className="site-shell border-t border-white/8 py-8 text-sm text-zinc-500">
        Saint AGI. The platform for company-wide AI adoption.
      </footer>
    </main>
  );
}
