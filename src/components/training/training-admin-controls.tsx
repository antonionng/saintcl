"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiResponse = {
  data?: {
    inviteCode?: string;
    slug?: string;
  };
  error?: {
    message?: string;
  };
};

export function TrainingAdminControls() {
  const [cohortName, setCohortName] = useState("AJB April 2026 Cohort");
  const [inviteCode, setInviteCode] = useState("ajb-apr-2026");
  const [startsOn, setStartsOn] = useState("2026-04-19");
  const [endsOn, setEndsOn] = useState("2026-07-16");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function syncProgramme() {
    setLoadingAction("sync");
    setMessage(null);

    const response = await fetch("/api/training/programmes/sync", { method: "POST" });
    const payload = (await response.json()) as ApiResponse;
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Unable to sync programme.");
      setLoadingAction(null);
      return;
    }

    setMessage("AJB programme synced into the training tables.");
    setLoadingAction(null);
  }

  async function createCohort() {
    setLoadingAction("cohort");
    setMessage(null);

    const response = await fetch("/api/training/cohorts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        programmeSlug: "ajb-ai-and-data-programme",
        name: cohortName,
        audience: "Enterprise banking cohort at Al Jazira Bank",
        startsOn,
        endsOn,
        inviteCode,
      }),
    });

    const payload = (await response.json()) as ApiResponse;
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Unable to create cohort.");
      setLoadingAction(null);
      return;
    }

    setMessage(`Cohort created. Participant link: /academy/${inviteCode}`);
    setLoadingAction(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={loadingAction !== null} onClick={syncProgramme}>
          {loadingAction === "sync" ? "Syncing..." : "Sync AJB programme"}
        </Button>
        <Button type="button" variant="secondary" disabled={loadingAction !== null} onClick={createCohort}>
          {loadingAction === "cohort" ? "Creating..." : "Create cohort invite"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="app-field-label">Cohort name</label>
          <Input value={cohortName} onChange={(event) => setCohortName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Invite code</label>
          <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Starts on</label>
          <Input value={startsOn} onChange={(event) => setStartsOn(event.target.value)} type="date" />
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Ends on</label>
          <Input value={endsOn} onChange={(event) => setEndsOn(event.target.value)} type="date" />
        </div>
      </div>

      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
