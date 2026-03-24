import Image from "next/image";
import Link from "next/link";

import placeholderLogo from "../../../public/saintclaw-placeholder-logo.png";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3 self-start", className)}>
      <Image
        src={placeholderLogo}
        alt="Saint AGI"
        className="h-9 w-auto object-contain opacity-95"
        priority
      />
      {showWordmark ? <span className="text-sm font-medium tracking-[-0.02em] text-white/95">Saint AGI</span> : null}
    </Link>
  );
}
