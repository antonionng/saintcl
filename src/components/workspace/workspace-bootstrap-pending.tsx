"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Cleared when the main workspace shell mounts. */
export const WORKSPACE_BOOTSTRAP_ATTEMPTS_KEY = "saintagi.workspace.orgBootstrapAttempts";

export function WorkspaceBootstrapPending() {
  const router = useRouter();
  const [phase, setPhase] = useState<"retrying" | "stuck">("retrying");

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled || typeof window === "undefined") return;
      try {
        const raw = sessionStorage.getItem(WORKSPACE_BOOTSTRAP_ATTEMPTS_KEY);
        const n = raw ? parseInt(raw, 10) || 0 : 0;
        if (n >= 14) {
          setPhase("stuck");
          return;
        }
        sessionStorage.setItem(WORKSPACE_BOOTSTRAP_ATTEMPTS_KEY, String(n + 1));
      } catch {
        setPhase("stuck");
        return;
      }
      router.refresh();
    };

    const t = window.setTimeout(tick, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [router]);

  if (phase === "stuck") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-md text-sm leading-6 text-zinc-400">
          Your workspace is taking longer than usual to finish provisioning. Try reloading the page. If this keeps
          happening, contact support.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center text-sm text-zinc-400">
      <p className="text-white">Finishing workspace setup…</p>
    </div>
  );
}
