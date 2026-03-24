import Link from "next/link";

import { companyProfile } from "@/components/landing/content";
import { SiteFooter } from "@/components/landing/site-footer";

import type { LegalDocument } from "./content";

type LegalPageProps = {
  document: LegalDocument;
};

export function LegalPage({ document }: LegalPageProps) {
  return (
    <main className="min-h-screen text-white">
      <div className="site-shell py-10 lg:py-14">
        <div className="max-w-4xl space-y-10">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-white">
              Back to home
            </Link>

            <div className="border-t border-white/8 pt-10">
              <p className="app-kicker">{companyProfile.legalName}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[0.96]">
                {document.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">{document.description}</p>
              <p className="mt-4 text-sm text-zinc-500">Last updated {document.lastUpdated}</p>
            </div>
          </div>

          <div className="space-y-10">
            {document.sections.map((section) => (
              <section key={section.title} className="space-y-4 border-t border-white/8 pt-8">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{section.title}</h2>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="max-w-3xl text-base leading-8 text-zinc-400 sm:text-[1.02rem]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="max-w-3xl space-y-3 pl-5 text-base leading-8 text-zinc-400 sm:text-[1.02rem]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
