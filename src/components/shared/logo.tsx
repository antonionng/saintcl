import Image from "next/image";
import Link from "next/link";

import brandLogo from "../../../public/saintagi-placeholder-logo.png";

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
        src={brandLogo}
        alt="Saint AGI"
        className="h-9 w-auto object-contain opacity-95"
        priority
      />
      {showWordmark ? <span className="text-sm font-medium tracking-[-0.02em] text-white">Saint AGI</span> : null}
    </Link>
  );
}
