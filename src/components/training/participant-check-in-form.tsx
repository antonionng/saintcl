"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CheckInResponse = {
  data?: {
    redirectTo?: string;
  };
  error?: {
    message?: string;
  };
};

export function ParticipantCheckInForm({
  inviteCode,
  cohortName,
  signedInEmail,
}: {
  inviteCode: string;
  cohortName?: string | null;
  signedInEmail?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "sign-in">("join");
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: "join" | "sign-in") {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(mode === "join" ? "/api/training/participant/check-in" : "/api/training/participant/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode,
        ...(mode === "join"
          ? {
              fullName,
              employeeId: employeeId.trim() || null,
            }
          : {}),
      }),
    });

    const payload = (await response.json()) as CheckInResponse;
    if (!response.ok) {
      setError(payload.error?.message ?? "Unable to join the training cohort.");
      setLoading(false);
      return;
    }

    router.push(payload.data?.redirectTo || `/academy/${inviteCode}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="inline-flex rounded-full border border-white/10 bg-black/10 p-1">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "join" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
          }`}
          onClick={() => switchMode("join")}
        >
          Join cohort
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "sign-in" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
          }`}
          onClick={() => switchMode("sign-in")}
        >
          Sign in
        </button>
      </div>

      {mode === "join" ? (
        <div className="space-y-2">
          <label className="app-field-label">Full name</label>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>
      ) : null}

      {mode === "join" ? (
        <div className="space-y-2">
          <label className="app-field-label">Employee ID</label>
          <Input
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder="Optional"
          />
        </div>
      ) : null}

      {cohortName || signedInEmail ? (
        <p className="text-sm leading-6 text-zinc-400">
          {mode === "join" ? "You are joining" : "You are resuming"}{" "}
          {cohortName ? <span className="text-white">{cohortName}</span> : "this cohort"}
          {signedInEmail ? (
            <>
              {" "}as <span className="text-white">{signedInEmail}</span>.
            </>
          ) : (
            "."
          )}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? mode === "join"
            ? "Joining cohort..."
            : "Restoring session..."
          : mode === "join"
            ? "Join cohort and continue"
            : "Resume training"}
      </Button>
    </form>
  );
}
