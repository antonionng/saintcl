"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TrainingParticipantRecord } from "@/types";

function initialsFor(displayName: string, fallback: string | null) {
  const source = displayName.trim() || fallback?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type ProfileResponse = {
  data?: { participant: TrainingParticipantRecord };
  error?: { message?: string };
};

export function ParticipantProfilePanel({
  participant,
}: {
  participant: TrainingParticipantRecord;
}) {
  const [displayName, setDisplayName] = useState(participant.displayName ?? participant.fullName ?? "");
  const [roleAtCompany, setRoleAtCompany] = useState(participant.roleAtCompany ?? "");
  const [bio, setBio] = useState(participant.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/training/participant/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim() || null,
        roleAtCompany: roleAtCompany.trim() || null,
        bio: bio.trim() || null,
      }),
    });

    const payload = (await response.json()) as ProfileResponse;
    if (!response.ok) {
      setError(payload.error?.message ?? "We could not save your profile.");
      setSaving(false);
      return;
    }

    setSavedAt(Date.now());
    setSaving(false);
  }

  const profileComplete = Boolean(displayName.trim() && roleAtCompany.trim() && bio.trim());
  const bioRemaining = 280 - bio.length;
  const justSaved = savedAt !== null && Date.now() - savedAt < 4000;
  const initials = initialsFor(displayName, participant.fullName);

  return (
    <Card className="overflow-hidden border-white/8 bg-black/10">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div
          aria-hidden
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            profileComplete
              ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/30"
              : "bg-white/[0.06] text-zinc-200 ring-1 ring-white/10"
          }`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-white">
            {displayName.trim() || participant.fullName || "Your profile"}
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            {roleAtCompany.trim() || "Add your role to introduce yourself"}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
            profileComplete
              ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200"
              : "border-amber-400/30 bg-amber-400/[0.08] text-amber-100"
          }`}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${profileComplete ? "bg-emerald-300" : "bg-amber-300"}`}
          />
          {profileComplete ? "Done" : "Todo"}
        </span>
      </div>

      <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
        <Field label="Display name" hint="Shown on your posts in the cohort feed.">
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={80}
            placeholder={participant.fullName ?? "How you want to appear in the feed"}
          />
        </Field>

        <Field label="Role">
          <Input
            value={roleAtCompany}
            onChange={(event) => setRoleAtCompany(event.target.value)}
            maxLength={120}
            placeholder="e.g. Credit risk analyst"
          />
        </Field>

        <Field
          label="One-line intro"
          trailing={
            <span
              className={`text-[10px] tabular-nums ${bioRemaining < 20 ? "text-amber-300" : "text-zinc-600"}`}
            >
              {bioRemaining}
            </span>
          }
        >
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={280}
            rows={3}
            placeholder="One sentence the room would recognise you by."
          />
        </Field>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-zinc-500">
            {justSaved ? "Saved. Your next post uses these details." : "Visible to cohort and facilitator."}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="w-full whitespace-nowrap sm:w-auto"
          >
            {saving ? "Saving" : justSaved ? "Saved" : "Save profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  hint,
  trailing,
  children,
}: {
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</label>
        {trailing}
      </div>
      {children}
      {hint ? <p className="text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}
