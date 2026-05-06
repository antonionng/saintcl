import Image from "next/image";
import Link from "next/link";

import { UserDropdownMenu } from "@/components/account/user-dropdown-menu";
import { AgentsSection } from "@/components/landing/agents-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { headerLinks } from "@/components/landing/content";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { TrustSection } from "@/components/landing/trust-section";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getCurrentUserProfile, getCurrentUserWorkspaces } from "@/lib/dal";

export default async function HomePage() {
  const session = await getCurrentOrg();
  const profile = session ? await getCurrentUserProfile() : null;
  const workspaces = session ? await getCurrentUserWorkspaces() : [];

  return (
    <main className="landing-page min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-[#1f1f23] bg-black/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-14">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/saint-agi-mark.svg"
              alt="Saint AGI"
              width={397}
              height={238}
              className="h-[18px] w-auto object-contain opacity-95"
              unoptimized
              priority
            />
            <span className="text-[15px] font-semibold tracking-[-0.015em] text-white">
              Saint AGI
            </span>
          </Link>
          <nav className="hidden items-center justify-center gap-[30px] text-[14px] font-medium tracking-[-0.005em] text-[#b5b5bd] lg:flex">
            {headerLinks.map((item) => (
              <Link
                key={item.href}
                className="transition-colors hover:text-white"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3 lg:justify-self-end">
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
                <Link
                  href="/login"
                  className="text-[14px] font-medium text-[#b5b5bd] transition-colors hover:text-white"
                >
                  Log in
                </Link>
                <Button asChild size="sm">
                  <Link href="/#contact">Request access</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="relative isolate">
        <HeroSection />
        <AgentsSection />
        <HowItWorksSection />
        <TrustSection />
        <PricingSection />
        <CtaBanner />
      </div>
      <SiteFooter />
    </main>
  );
}
