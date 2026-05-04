import {
  approvalsQueue,
  auditStreamRows,
  trustPillars,
  trustSectionIntro,
} from "@/components/landing/content";

export function TrustSection() {
  return (
    <section className="border-t border-[#1f1f23] bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 py-[100px] lg:px-20">
        <div className="flex flex-col items-center gap-[18px] pb-[60px] text-center">
          <SectionEyebrow label={trustSectionIntro.kicker} />
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[72px] lg:leading-[72px]">
            {trustSectionIntro.titleTop}
          </h2>
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-[#6e6e78] sm:text-5xl lg:text-[72px] lg:leading-[72px]">
            {trustSectionIntro.titleBottom}
          </h2>
          <p className="max-w-[720px] text-[15px] leading-7 text-[#b5b5bd] lg:text-[18px] lg:leading-[27px]">
            {trustSectionIntro.description}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <AuditStream />
            <ApprovalsQueue />
          </div>
          <div className="flex flex-col gap-3.5">
            {trustPillars.map((pillar) => (
              <PillarCard key={pillar.label} pillar={pillar} />
            ))}
          </div>
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

function AuditStream() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#1f1f23] bg-[#0a0a0a] px-7 py-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">Audit stream</p>
          <p className="text-[13px] text-[#6e6e78]">
            Every action. Every approval. Every block. Logged for 7 years.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium tracking-[0.16em] text-[#6e6e78]">LIVE</span>
        </div>
      </div>
      <div className="flex flex-col">
        {auditStreamRows.map((row, idx) => (
          <div
            key={`${row.time}-${row.actor}`}
            className={`flex items-center justify-between py-2.5 ${
              idx < auditStreamRows.length - 1 ? "border-b border-[#1f1f23]" : ""
            }`}
          >
            <p className="font-mono text-[12.5px] text-[#6e6e78]">
              <span>{row.time}</span>
              <span className="ml-3 text-white">{row.actor}</span>
              <span> → </span>
              <span className="text-[#b5b5bd]">{row.action}</span>
              <span> · {row.detail}</span>
            </p>
            <AuditStatus status={row.status} variant={row.statusVariant} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditStatus({ status, variant }: { status: string; variant: string }) {
  if (variant === "approved") {
    return (
      <span className="text-[10px] font-bold tracking-[0.14em] text-white">{status}</span>
    );
  }
  if (variant === "blocked") {
    return (
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-black">
        {status}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium tracking-[0.14em] text-[#6e6e78]">{status}</span>
  );
}

function ApprovalsQueue() {
  return (
    <div className="flex flex-col rounded-2xl border border-[#1f1f23] bg-[#0a0a0a] px-7 py-6">
      <div className="flex items-center justify-between pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">
            Approvals queue
          </p>
          <p className="text-[13px] text-[#6e6e78]">Sensitive actions held at the policy line.</p>
        </div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-[#6e6e78]">
          {approvalsQueue.length} PENDING
        </p>
      </div>
      {approvalsQueue.map((item, idx) => (
        <div
          key={item.title}
          className={`flex items-center justify-between py-3.5 ${
            idx < approvalsQueue.length - 1 ? "border-b border-[#1f1f23]" : ""
          }`}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[13.5px] font-medium tracking-[-0.005em] text-white">
              {item.title}
            </p>
            <p className="text-[11.5px] text-[#6e6e78]">{item.meta}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-white px-3.5 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              Approve
            </button>
            <button
              type="button"
              className="rounded-md border border-[#2a2a30] px-3.5 py-1.5 text-[12px] font-medium text-[#b5b5bd] transition-colors hover:border-[#3a3a40] hover:text-white"
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PillarCard({
  pillar,
}: {
  pillar: { label: string; icon: string; title: string; description: string };
}) {
  return (
    <div className="flex items-center gap-[18px] rounded-[14px] border border-[#1f1f23] bg-[#0a0a0a] px-6 py-[22px]">
      <PillarIcon name={pillar.icon} />
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium tracking-[0.16em] text-[#6e6e78]">{pillar.label}</p>
        <p className="text-[16px] font-semibold tracking-[-0.015em] text-white">{pillar.title}</p>
        <p className="text-[13px] leading-[18px] text-[#b5b5bd]">{pillar.description}</p>
      </div>
    </div>
  );
}

function PillarIcon({ name }: { name: string }) {
  return (
    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-[#1f1f23] bg-[#111114]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
        aria-hidden
      >
        {name === "shield" && (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </>
        )}
        {name === "eye" && (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
        {name === "switch" && (
          <>
            <path d="M3 7h13l-3-3" />
            <path d="M21 17H8l3 3" />
          </>
        )}
        {name === "chat" && (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </>
        )}
      </svg>
    </div>
  );
}
