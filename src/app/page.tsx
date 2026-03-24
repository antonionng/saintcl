import Image from "next/image";
import Link from "next/link";
import placeholderLogo from "../../public/saintclaw-placeholder-logo.png";

import { UserDropdownMenu } from "@/components/account/user-dropdown-menu";
import { CtaBanner } from "@/components/landing/cta-banner";
import { headerLinks } from "@/components/landing/content";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroSection } from "@/components/landing/hero";
import { ModelsSection } from "@/components/landing/models-section";
import { NewsSection } from "@/components/landing/news-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { UseCaseGrid } from "@/components/landing/use-case-grid";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getCurrentUserProfile, getCurrentUserWorkspaces } from "@/lib/dal";

export default async function HomePage() {
  const session = await getCurrentOrg();
  const profile = session ? await getCurrentUserProfile() : null;
  const workspaces = session ? await getCurrentUserWorkspaces() : [];

  return (
    <main className="landing-page min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 bg-black">
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
      <div className="relative isolate">
        <HeroSection />
        <FeatureGrid />
        <ModelsSection />
        <PricingSection />
        <UseCaseGrid />
        <NewsSection />
        <CtaBanner />
      </div>
      <SiteFooter />
    </main>
  );
}
