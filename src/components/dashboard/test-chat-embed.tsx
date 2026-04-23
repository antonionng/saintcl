"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "openclaw.control.settings.v1";

export function TestChatEmbed({
  embeddedConsoleUrl,
  gatewayUrl,
  className,
  title = "Agent test chat",
}: {
  embeddedConsoleUrl?: string;
  gatewayUrl?: string;
  className?: string;
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!gatewayUrl || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (parsed.gatewayUrl !== gatewayUrl) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, gatewayUrl }));
      }
    } catch {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ gatewayUrl }));
      } catch {
        // ignore
      }
    }
  }, [gatewayUrl]);

  if (!embeddedConsoleUrl) {
    return (
      <div
        className={cn(
          "flex h-[420px] items-center justify-center rounded-lg border border-border-subtle bg-surface-1 text-sm text-zinc-500",
          className,
        )}
      >
        Chat will appear once your agent is ready.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-subtle bg-surface-1",
        className,
      )}
    >
      <iframe
        ref={iframeRef}
        src={embeddedConsoleUrl}
        title={title}
        className="block h-full min-h-[560px] w-full border-0 bg-transparent"
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
