"use client";

import { useEffect } from "react";

export function AutoBootstrapAgent() {
  useEffect(() => {
    void fetch("/api/openclaw/bootstrap", { method: "POST" }).catch(() => {
      // Non-blocking bootstrap: UX should never fail if bootstrap is unavailable.
    });
  }, []);

  return null;
}

