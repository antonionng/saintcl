"use client";

import { useMemo, useState } from "react";

import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import { resolveCheckpointInterventionPrompt, type TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { TrainingParticipantLabCheckpointRecord } from "@/types";

type TrainingParticipantCheckpointExperienceProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
  enableProgressTracking?: boolean;
};

type LabStatus = {
  status: "not_started" | "launched" | "completed";
  launchedAt: string | null;
  completedAt: string | null;
  lastEventAt: string | null;
};

function resolveCheckpointProgressPercent(input: {
  checkpoints: TrainingLabCheckpoint[];
  labStatusBySlug: Record<string, LabStatus>;
  checkpointSlug: string;
  eventType: "lab_launched" | "lab_completed";
}) {
  if (input.checkpoints.length === 0) return null;

  const completedCount = input.checkpoints.filter((checkpoint) => {
    if (checkpoint.slug === input.checkpointSlug) {
      return input.eventType === "lab_completed";
    }
    return input.labStatusBySlug[checkpoint.slug]?.status === "completed";
  }).length;

  const launchedCount = input.checkpoints.filter((checkpoint) => {
    if (checkpoint.slug === input.checkpointSlug) {
      return input.eventType === "lab_launched";
    }
    return input.labStatusBySlug[checkpoint.slug]?.status === "launched";
  }).length;

  const effectiveProgress = completedCount + launchedCount * 0.5;
  return Math.max(5, Math.min(100, Math.round((effectiveProgress / input.checkpoints.length) * 100)));
}

export function TrainingParticipantCheckpointExperience({
  inviteCode,
  moduleSlug,
  moduleTitle,
  labCheckpoints,
  initialLabProgress,
  deckState = null,
  facilitatorPrompt = null,
  enableProgressTracking = true,
}: TrainingParticipantCheckpointExperienceProps) {
  const [labStatusOverridesBySlug, setLabStatusOverridesBySlug] = useState<Record<string, LabStatus>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const currentSlideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null;

  const labStatusBySlug = useMemo(
    () =>
      Object.fromEntries(
        labCheckpoints.map((checkpoint) => {
          const record = initialLabProgress.find((item) => item.labSlug === checkpoint.slug) ?? null;
          return [
            checkpoint.slug,
            labStatusOverridesBySlug[checkpoint.slug] ?? {
              status: record?.status ?? "not_started",
              launchedAt: record?.launchedAt ?? null,
              completedAt: record?.completedAt ?? null,
              lastEventAt: record?.lastEventAt ?? null,
            },
          ];
        }),
      ) as Record<string, LabStatus>,
    [initialLabProgress, labCheckpoints, labStatusOverridesBySlug],
  );

  const checkpointCards = useMemo(
    () =>
      labCheckpoints.map((checkpoint) => ({
        ...checkpoint,
        ...(labStatusBySlug[checkpoint.slug] ?? {
          status: "not_started" as const,
          launchedAt: null,
          completedAt: null,
          lastEventAt: null,
        }),
      })),
    [labCheckpoints, labStatusBySlug],
  );

  const completedCheckpointCount = useMemo(
    () => checkpointCards.filter((checkpoint) => checkpoint.status === "completed").length,
    [checkpointCards],
  );

  const activeCheckpoint = useMemo(() => {
    if (currentSlideIndex === null) return null;
    const slideNumber = currentSlideIndex + 1;
    return (
      checkpointCards.find((checkpoint) => slideNumber >= checkpoint.startSlide && slideNumber <= checkpoint.endSlide) ?? null
    );
  }, [checkpointCards, currentSlideIndex]);

  const overdueCheckpoint = useMemo(() => {
    if (currentSlideIndex === null) return null;
    const slideNumber = currentSlideIndex + 1;
    return checkpointCards.find((checkpoint) => slideNumber > checkpoint.endSlide && checkpoint.status !== "completed") ?? null;
  }, [checkpointCards, currentSlideIndex]);

  const activePrompt = useMemo(() => {
    if (!activeCheckpoint || currentSlideIndex === null) return null;
    return resolveCheckpointInterventionPrompt(activeCheckpoint, currentSlideIndex + 1);
  }, [activeCheckpoint, currentSlideIndex]);

  async function sendLabCheckpointEvent(checkpoint: TrainingLabCheckpoint, eventType: "lab_launched" | "lab_completed") {
    const progressPercent = resolveCheckpointProgressPercent({
      checkpoints: labCheckpoints,
      labStatusBySlug,
      checkpointSlug: checkpoint.slug,
      eventType,
    });

    const response = enableProgressTracking
      ? await fetch("/api/training/participant/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inviteCode,
            moduleSlug,
            eventType,
            progressPercent,
            metadata: {
              labSlug: checkpoint.slug,
              labTitle: checkpoint.title,
              teachingMoment: activePrompt?.label ?? null,
            },
          }),
        }).catch(() => null)
      : ({ ok: true } as Response);

    if (!response?.ok) {
      setActionMessage("We could not record that checkpoint action. Please try again.");
      return;
    }

    const now = new Date().toISOString();
    setLabStatusOverridesBySlug((current) => ({
      ...current,
      [checkpoint.slug]: {
        status: eventType === "lab_completed" ? "completed" : "launched",
        launchedAt: eventType === "lab_launched" ? now : current[checkpoint.slug]?.launchedAt ?? now,
        completedAt: eventType === "lab_completed" ? now : current[checkpoint.slug]?.completedAt ?? null,
        lastEventAt: now,
      },
    }));
    setActionMessage(
      eventType === "lab_completed"
        ? enableProgressTracking
          ? `${checkpoint.title} completed. Your facilitator can now see this checkpoint status.`
          : `${checkpoint.title} completed in review mode. This status is only stored in your current browser session.`
        : enableProgressTracking
          ? `${checkpoint.title} started. Stay with this teaching moment until you are ready to mark it complete.`
          : `${checkpoint.title} started in review mode. You can preview the checkpoint flow without signing in.`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
            {moduleTitle} checkpoints
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
            {completedCheckpointCount}/{checkpointCards.length} complete
          </span>
          {currentSlideIndex !== null ? (
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
              Slide {currentSlideIndex + 1}
            </span>
          ) : null}
        </div>
      </div>

      {facilitatorPrompt ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-4 py-4 text-sm text-amber-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">Facilitator prompt</p>
          <p className="mt-2">{facilitatorPrompt}</p>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-4 text-sm text-emerald-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Progress update</p>
          <p className="mt-2">{actionMessage}</p>
        </div>
      ) : null}

      {overdueCheckpoint ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-4 text-sm text-rose-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-200/70">Action needed</p>
          <p className="mt-2">
            You have moved beyond <strong>{overdueCheckpoint.title}</strong> without marking it complete. Return to this checkpoint and finish it before continuing.
          </p>
        </div>
      ) : activeCheckpoint ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] px-4 py-4 text-sm text-sky-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/70">Current checkpoint</p>
          <p className="mt-2">
            You are inside <strong>{activeCheckpoint.title}</strong>.
            {activePrompt ? ` Focus for this moment: ${activePrompt.prompt}` : " Complete this teaching moment before moving on."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {checkpointCards.map((checkpoint) => {
          const tone =
            checkpoint.status === "completed"
              ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
              : checkpoint.status === "launched"
                ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100"
                : "border-white/8 bg-white/[0.02] text-zinc-200";
          const promptForCheckpoint =
            currentSlideIndex !== null ? resolveCheckpointInterventionPrompt(checkpoint, currentSlideIndex + 1) : null;

          return (
            <div key={checkpoint.slug} className={`rounded-2xl border px-4 py-4 ${tone}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                    Slides {checkpoint.startSlide} to {checkpoint.endSlide}
                  </p>
                  <p className="mt-2 font-medium text-white">{checkpoint.title}</p>
                  <p className="mt-2 max-w-3xl text-sm text-zinc-300">{checkpoint.description}</p>
                  {promptForCheckpoint ? (
                    <p className="mt-2 text-sm text-zinc-300">
                      Focus now: <span className="text-white">{promptForCheckpoint.label}</span>
                    </p>
                  ) : null}
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium">
                  {checkpoint.status === "completed"
                    ? "Completed"
                    : checkpoint.status === "launched"
                      ? "In progress"
                      : "Not started"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void sendLabCheckpointEvent(checkpoint, "lab_launched")}
                  className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-4 py-2 text-sm text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/[0.12]"
                >
                  Start checkpoint
                </button>
                <button
                  type="button"
                  onClick={() => void sendLabCheckpointEvent(checkpoint, "lab_completed")}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.12]"
                >
                  Mark complete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
