import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintagi-placeholder-logo.png";
import { finalCtaContent } from "@/components/landing/content";

export function CtaBanner() {
  return (
    <section id="start" className="border-t border-[#1f1f23] bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 py-[120px] lg:px-20">
        <div className="flex h-[45px] w-[75px] items-center justify-center">
          <Image
            src={placeholderLogo}
            alt="Saint AGI"
            className="h-auto w-[75px] object-contain opacity-95"
          />
        </div>
        <div className="h-9" />
        <h2 className="max-w-[980px] text-center text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[56px] lg:leading-[60px]">
          {finalCtaContent.headline}
        </h2>
        <div className="h-[18px]" />
        <p className="max-w-[660px] text-center text-[15px] leading-7 text-[#b5b5bd] lg:text-[18px] lg:leading-[27px]">
          {finalCtaContent.subhead}
        </p>
        <div className="h-9" />
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={finalCtaContent.primary.href}
            className="inline-flex items-center rounded-[10px] bg-white px-6 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white/90"
          >
            {finalCtaContent.primary.label}
          </Link>
          <a
            href={finalCtaContent.secondary.href}
            className="inline-flex items-center rounded-[10px] border border-[#2a2a30] bg-[rgba(20,20,26,0.4)] px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:border-[#3a3a40] hover:bg-[rgba(30,30,36,0.6)]"
          >
            {finalCtaContent.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}
