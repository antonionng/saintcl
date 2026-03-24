import Link from "next/link";

import { companyProfile, footerLinkGroups } from "@/components/landing/content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8">
      <div className="site-shell py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-md space-y-4">
            <p className="app-kicker">{companyProfile.legalName}</p>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-[2rem]">
                {companyProfile.tagline}
              </h2>
              <p className="text-sm leading-7 text-white/72">
                Saint AGI is operated by {companyProfile.legalName} in {companyProfile.country}. For product,
                privacy, or legal requests, contact{" "}
                <a className="text-white transition-colors hover:text-white/80" href={`mailto:${companyProfile.contactEmail}`}>
                  {companyProfile.contactEmail}
                </a>
                .
              </p>
            </div>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-sm font-medium text-white">{group.title}</p>
              <div className="space-y-2.5 text-sm text-white/72">
                {group.links.map((link) =>
                  link.href.startsWith("mailto:") ? (
                    <a key={link.href} href={link.href} className="block transition-colors hover:text-white">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href} className="block transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/8 pt-6 text-xs text-white/60 sm:flex sm:items-center sm:justify-between">
          <p>
            © {year} {companyProfile.legalName}. All rights reserved.
          </p>
          <p className="mt-2 sm:mt-0">Governed AI adoption for teams in {companyProfile.country} and beyond.</p>
        </div>
      </div>
    </footer>
  );
}
