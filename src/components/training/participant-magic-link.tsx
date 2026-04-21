"use client";

import { useState } from "react";

export function ParticipantMagicLink({ link, label = "Copy magic link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement("input");
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
