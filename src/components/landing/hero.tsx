import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintagi-placeholder-logo.png";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="relative mx-auto h-[920px] w-full max-w-[1440px]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[200px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(255, 240, 219, 0.10) 0%, rgba(255, 240, 219, 0.04) 45%, rgba(0, 0, 0, 0) 70%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[225px] h-[213px] w-[606px] -translate-x-1/2"
        >
          <div
            className="absolute inset-0 -rotate-12 rounded-full border border-white/10"
            style={{
              boxShadow: "inset 0 0 0 0.5px rgba(255, 255, 255, 0.04)",
            }}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[269px] h-[154px] w-[462px] -translate-x-1/2"
        >
          <div className="absolute inset-0 -rotate-12 rounded-full border border-white/12" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[295px] h-[108px] w-[324px] -translate-x-1/2"
        >
          <div className="absolute inset-0 -rotate-12 rounded-full border border-white/14" />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[395px] h-[3px] w-[1300px] -translate-x-1/2 blur-[0.75px]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(255, 240, 219, 0.45) 48%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 240, 219, 0.45) 52%, rgba(0, 0, 0, 0) 100%)",
          }}
        />

        <div className="absolute left-1/2 top-[240px] flex h-[120px] w-[200px] -translate-x-1/2 items-center justify-center">
          <Image
            src={placeholderLogo}
            alt="Saint AGI"
            className="h-auto w-[200px] object-contain opacity-95"
            priority
          />
        </div>

        <div className="absolute left-0 top-[420px] flex w-full flex-col items-center gap-7 px-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#1f1f23] bg-[rgba(10,10,10,0.7)] py-1.5 pl-1.5 pr-4">
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-white/[0.08]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </span>
            <span className="text-[11.5px] font-medium tracking-[0.2em] text-[#b5b5bd]">
              SAINT AGI · 2026
            </span>
          </div>

          <h1 className="text-center text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[96px] lg:leading-[92px] lg:tracking-[-0.045em]">
            An agent for
            <br />
            every employee.
          </h1>

          <p className="max-w-[720px] text-center text-base leading-7 tracking-[-0.005em] text-[#b5b5bd] lg:text-xl lg:leading-[29px]">
            Give your team AI teammates that write, read, post, schedule, design, report, and act
            across your systems. One per person. Set up in minutes. Governed forever.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-[10px] bg-white px-6 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              Launch your first agent
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center rounded-[10px] border border-[#2a2a30] bg-[rgba(20,20,26,0.4)] px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:border-[#3a3a40] hover:bg-[rgba(30,30,36,0.6)]"
            >
              Watch a 90-second demo
            </Link>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-[12px] tracking-[0.06em] text-[#6e6e78]">
              47 agents live across 23 companies · 0 incidents this month
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
