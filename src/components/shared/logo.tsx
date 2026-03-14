import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <span className="text-sm font-medium tracking-[0.22em] text-white/95">
        SaintClaw
      </span>
    </Link>
  );
}
