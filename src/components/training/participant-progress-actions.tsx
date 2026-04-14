"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ProgressResponse = {
  error?: {
    message?: string;
  };
};

export function ParticipantProgressActions({ inviteCode, moduleSlug }: { inviteCode: string; moduleSlug: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

  async function sendEvent(eventType: "slide_viewed" | "module_completed") {
    setLoadingEvent(eventType);
    setMessage(null);

    const response = await fetch("/api/training/participant/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode,
        moduleSlug,
        eventType,
        progressPercent: eventType === "module_completed" ? 100 : 5,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as ProgressResponse;
      setMessage(payload.error?.message ?? "Unable to record progress.");
      setLoadingEvent(null);
      return;
    }

    setMessage(eventType === "module_completed" ? "Module completion recorded." : "Module activity recorded.");
    setLoadingEvent(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={loadingEvent !== null}
          onClick={() => sendEvent("slide_viewed")}
        >
          {loadingEvent === "slide_viewed" ? "Saving..." : "Mark activity"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loadingEvent !== null}
          onClick={() => sendEvent("module_completed")}
        >
          {loadingEvent === "module_completed" ? "Saving..." : "Mark module complete"}
        </Button>
      </div>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
