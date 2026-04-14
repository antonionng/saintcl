import Image from "next/image";

import { Logo } from "@/components/shared/logo";

export default function AcademyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Learning portal</p>
              <p className="text-sm text-zinc-300">Your course materials, labs, and progress in one place</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-3 py-2">
              <Image
                src="/emft-logo.png"
                alt="Emerging Market Financial Training"
                width={70}
                height={70}
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-3 py-2">
              <Image
                src="/ajb-logo.png"
                alt="Al Jazira Bank"
                width={180}
                height={60}
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300">
              AJB AI and Data Programme
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
