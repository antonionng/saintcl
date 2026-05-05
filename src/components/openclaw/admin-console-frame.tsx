"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

function hideManagedConsoleControls(iframe: HTMLIFrameElement | null) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc || doc.getElementById("saintagi-managed-console-style")) return;

    const style = doc.createElement("style");
    style.id = "saintagi-managed-console-style";
    // SaintAGI controls OpenClaw upgrades centrally (vendored runtime + Railway
    // redeploy). The upstream "Update available" banner is misleading here, so
    // we suppress it inside the embedded console.
    style.textContent = ".update-banner{display:none!important}";
    doc.head.appendChild(style);
  } catch {
    // The console still works if the browser blocks parent access to iframe contents.
  }
}

export function AdminConsoleFrame({
  embeddedConsoleUrl,
  title = "Saint AGI Console",
  className,
}: {
  embeddedConsoleUrl: string;
  title?: string;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <iframe
      ref={iframeRef}
      src={embeddedConsoleUrl}
      title={title}
      className={cn("block h-screen min-h-screen w-full bg-[#0b0b12]", className)}
      onLoad={() => hideManagedConsoleControls(iframeRef.current)}
    />
  );
}
