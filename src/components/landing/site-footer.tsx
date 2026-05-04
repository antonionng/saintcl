import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintagi-placeholder-logo.png";
import { companyProfile, footerLinkGroups } from "@/components/landing/content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1f1f23] bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-9 pt-16 lg:px-20">
        <div className="grid gap-10 pb-12 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex max-w-md flex-col gap-[18px]">
            <div className="flex items-center gap-3">
              <Image
                src={placeholderLogo}
                alt="Saint AGI"
                className="h-[18px] w-auto object-contain opacity-95"
              />
              <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">
                {companyProfile.brandName}
              </p>
            </div>
            <p className="max-w-[360px] text-[13px] leading-[19px] text-[#6e6e78]">
              Governed AI agents for modern teams. Operated by {companyProfile.legalName} in{" "}
              {companyProfile.country}.
            </p>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title} className="flex flex-col">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#6e6e78]">
                {group.title}
              </p>
              <div className="mt-3.5 flex flex-col">
                {group.links.map((link) =>
                  link.href.startsWith("mailto:") ? (
                    <a
                      key={link.href}
                      href={link.href}
                      className="py-1 text-[13px] text-[#b5b5bd] transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="py-1 text-[13px] text-[#b5b5bd] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#1f1f23] pt-7 text-[11.5px] text-[#6e6e78] sm:flex-row sm:items-center">
          <p>
            © {year} {companyProfile.legalName}.
          </p>
          <p className="font-medium tracking-[0.16em]">SAINTAGI.COM</p>
        </div>
      </div>
    </footer>
  );
}
