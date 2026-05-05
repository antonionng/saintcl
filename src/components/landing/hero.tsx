import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden bg-black md:min-h-[calc(100dvh-5rem)]">
      <div className="relative mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-20">
        <div className="flex flex-col items-center gap-7">
          <div className="relative flex h-[min(34vw,380px)] w-full min-h-[220px] max-w-[1100px] items-center justify-center sm:h-[320px]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[min(85vw,700px)] w-[min(95vw,1100px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(255, 240, 219, 0.10) 0%, rgba(255, 240, 219, 0.04) 45%, rgba(0, 0, 0, 0) 70%)",
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[213px] w-[606px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-[200px] sm:w-[520px]"
            >
              <div
                className="h-[min(28vw,213px)] w-[min(85vw,606px)] -rotate-12 rounded-full border border-white/10"
                style={{
                  boxShadow: "inset 0 0 0 0.5px rgba(255, 255, 255, 0.04)",
                }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[154px] w-[462px] max-w-[72vw] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-[140px] sm:w-[400px]"
            >
              <div className="h-[min(20vw,154px)] w-[min(70vw,462px)] -rotate-12 rounded-full border border-white/12" />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[108px] w-[324px] max-w-[55vw] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-[100px] sm:w-[280px]"
            >
              <div className="h-[min(14vw,108px)] w-[min(55vw,324px)] -rotate-12 rounded-full border border-white/14" />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[3px] w-[min(95vw,1300px)] -translate-x-1/2 -translate-y-1/2 blur-[0.75px]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(255, 240, 219, 0.45) 48%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 240, 219, 0.45) 52%, rgba(0, 0, 0, 0) 100%)",
              }}
            />

            <div className="relative z-10 flex h-[120px] w-[200px] items-center justify-center">
              <Image
                src="/saint-agi-mark.svg"
                alt="Saint AGI"
                width={397}
                height={238}
                className="h-auto w-[min(200px,45vw)] object-contain opacity-95"
                unoptimized
                priority
              />
            </div>
          </div>

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
              className="inline-flex items-center rounded-[10px] bg-white px-6 py-3.5 text-[15px] font-semibold !text-black transition-colors hover:bg-white/90"
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
