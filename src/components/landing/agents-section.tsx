import Link from "next/link";

import { agentPersonas, agentsSectionIntro } from "@/components/landing/content";

export function AgentsSection() {
  return (
    <section id="platform" className="bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 py-[100px] lg:px-20">
        <div className="flex flex-col items-center gap-[18px] pb-[60px] text-center">
          <SectionEyebrow label={agentsSectionIntro.kicker} />
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px] lg:leading-[64px]">
            {agentsSectionIntro.title}
          </h2>
          <p className="max-w-[720px] text-[15px] leading-7 text-[#b5b5bd] lg:text-[18px] lg:leading-[27px]">
            {agentsSectionIntro.description}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentPersonas.map((agent) => (
            <article
              key={agent.name}
              className="flex flex-col gap-4 rounded-[14px] border border-[#1f1f23] bg-[#0a0a0a] p-6 transition-colors hover:border-[#2a2a30]"
            >
              <div className="flex h-11 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#2a2a30]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, rgb(26, 26, 31) 0%, rgb(10, 10, 10) 71.429%)",
                    }}
                  >
                    <span className="text-sm font-bold text-white">{agent.initials}</span>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <p className="text-[16px] font-semibold tracking-[-0.015em] text-white">
                      {agent.name}
                    </p>
                    <p className="text-[10.5px] font-medium tracking-[0.14em] text-[#6e6e78]">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <LiveBadge />
              </div>
              <p className="text-[13.5px] leading-5 text-[#b5b5bd]">{agent.description}</p>
              <div className="h-px w-full bg-[#1f1f23]" />
              <p className="text-[12px] leading-[17px] text-[#6e6e78]">
                {agent.reportsToPrefix}
                <span className="font-medium text-white">{agent.reportsTo}</span>
                {agent.reportsToSuffix}
              </p>
            </article>
          ))}
        </div>

        <div className="flex justify-center pt-[60px]">
          <Link
            href={agentsSectionIntro.cta.href}
            className="inline-flex items-center rounded-full border border-[#2a2a30] px-6 py-3.5 text-sm font-medium tracking-[-0.005em] text-white transition-colors hover:border-[#3a3a40] hover:bg-white/[0.03]"
          >
            {agentsSectionIntro.cta.label} →
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-7 bg-[#404048]" />
      <span className="text-[12px] font-medium tracking-[0.22em] text-[#6e6e78]">{label}</span>
      <span className="h-px w-7 bg-[#404048]" />
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#2a2a30] bg-[#111114] px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="text-[10.5px] font-medium text-white">Live</span>
    </div>
  );
}
