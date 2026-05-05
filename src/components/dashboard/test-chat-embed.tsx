"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "openclaw.control.settings.v1";

type PersistedControlUiSettings = {
  gatewayUrl?: string;
  sessionKey?: string;
  lastActiveSessionKey?: string;
  [key: string]: unknown;
};

function seedManagedChatSettings(gatewayUrl?: string, sessionKey?: string) {
  if ((!gatewayUrl && !sessionKey) || typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PersistedControlUiSettings) : {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        ...(gatewayUrl ? { gatewayUrl } : {}),
        ...(sessionKey ? { sessionKey, lastActiveSessionKey: sessionKey } : {}),
      }),
    );
  } catch {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...(gatewayUrl ? { gatewayUrl } : {}),
          ...(sessionKey ? { sessionKey, lastActiveSessionKey: sessionKey } : {}),
        }),
      );
    } catch {
      // ignore
    }
  }
}

function hideManagedSessionControls(iframe: HTMLIFrameElement | null) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc || doc.getElementById("saintagi-managed-chat-style")) return;

    const style = doc.createElement("style");
    style.id = "saintagi-managed-chat-style";
    // Hide controls that don't apply to the SaintAGI managed runtime: per-session
    // chooser and the upstream OpenClaw self-update banner (we control upgrades).
    style.textContent =
      ".chat-controls__session{display:none!important}" +
      ".update-banner{display:none!important}";
    doc.head.appendChild(style);
  } catch {
    // The embed still works if the browser blocks parent access to iframe contents.
  }
}

export function TestChatEmbed({
  embeddedConsoleUrl,
  gatewayUrl,
  sessionKey,
  className,
  title = "Agent test chat",
}: {
  embeddedConsoleUrl?: string;
  gatewayUrl?: string;
  sessionKey?: string;
  className?: string;
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    seedManagedChatSettings(gatewayUrl, sessionKey);
  }, [gatewayUrl, sessionKey]);

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
        onLoad={() => hideManagedSessionControls(iframeRef.current)}
      />
    </div>
  );
}
