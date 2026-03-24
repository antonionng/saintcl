import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintclaw-placeholder-logo.png";

import { UserDropdownMenu } from "@/components/account/user-dropdown-menu";
import { CapabilitiesOverview } from "@/components/capabilities/capabilities-overview";
import { CtaBanner } from "@/components/landing/cta-banner";
import { headerLinks } from "@/components/landing/content";
import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getCurrentUserProfile, getCurrentUserWorkspaces } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Capabilities | Saint AGI",
  description:
    "Explore Saint AGI capabilities across autonomous execution, local-first runtime, multi-channel communication, tool automation, memory, and governance.",
};

export default async function CapabilitiesPage() {
  const session = await getCurrentOrg();
  const profile = session ? await getCurrentUserProfile() : null;
  const workspaces = session ? await getCurrentUserWorkspaces() : [];

  return (
    <main className="min-h-screen text-white">
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

      <CapabilitiesOverview />
      <CtaBanner />
      <SiteFooter />
    </main>
  );
}
