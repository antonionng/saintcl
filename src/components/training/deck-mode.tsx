"use client";

import { useMemo } from "react";

import { ActivityPromptCard } from "@/components/training/activity-prompt-card";
import { ParticipantDriftBanner } from "@/components/training/participant-drift-banner";
import { useLiveDeckSession, type DeckState } from "@/components/training/use-live-deck-session";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { ParticipantAction } from "@/lib/training-scripts/types";
import type { TrainingParticipantLabCheckpointRecord } from "@/types";

export type DeckModeProps = {
  inviteCode: string;
  moduleSlug: string;
  deckHref: string;
  deckTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  participantActionsBySlide?: Record<number, ParticipantAction>;
  onOpenLibrary: () => void;
  onStartLab: (checkpointSlug: string | null) => void;
  onDeckStateChange?: (deckState: DeckState | null) => void;
  buildLabHref?: (checkpointSlug: string) => string;
};

export function DeckMode({
  inviteCode,
  moduleSlug,
  deckHref,
  deckTitle,
  labCheckpoints,
  initialLabProgress,
  participantActionsBySlide,
  onOpenLibrary,
  onStartLab,
  onDeckStateChange,
  buildLabHref,
}: DeckModeProps) {
  const {
    deckState,
    liveSession,
    followLive,
    toggleFollowLive,
    rejoinFacilitator,
    iframeRef,
  } = useLiveDeckSession({ inviteCode, moduleSlug, onDeckStateChange });

  const slideNumber =
    typeof deckState?.slideIndex === "number" ? deckState.slideIndex + 1 : null;

  const activeCheckpoint = useMemo(() => {
    if (slideNumber === null) return null;
    return (
      labCheckpoints.find(
        (checkpoint) =>
          slideNumber >= checkpoint.startSlide &&
          slideNumber <= checkpoint.endSlide,
      ) ?? null
    );
  }, [labCheckpoints, slideNumber]);

  const completedCheckpointSlugs = useMemo(() => {
    const completed = new Set<string>();
    for (const record of initialLabProgress) {
      if (record.status === "completed") {
        completed.add(record.labSlug);
      }
    }
    return completed;
  }, [initialLabProgress]);

  const slideAction = useMemo<ParticipantAction | null>(() => {
    if (slideNumber === null || !participantActionsBySlide) return null;
    return participantActionsBySlide[slideNumber] ?? null;
  }, [participantActionsBySlide, slideNumber]);

  const liveMode = liveSession?.liveMode ?? "off";
  const facilitatorSlideIndex = liveSession?.facilitatorSlideIndex ?? null;
  const facilitatorPrompt = liveSession?.prompt ?? null;
  const labHref = activeCheckpoint && buildLabHref
    ? buildLabHref(activeCheckpoint.slug)
    : null;
  const labCompleted = activeCheckpoint
    ? completedCheckpointSlugs.has(activeCheckpoint.slug)
    : false;

  return (
    <div className="space-y-4">
      <ParticipantDriftBanner
        totalSlides={deckState?.totalSlides ?? null}
        participantSlideIndex={
          typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null
        }
        facilitatorSlideIndex={facilitatorSlideIndex}
        classMedianSlideIndex={null}
        liveMode={liveMode}
        prompt={facilitatorPrompt}
        onToggleLive={toggleFollowLive}
        onRejoinFacilitator={rejoinFacilitator}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <div className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/30 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <iframe
            ref={iframeRef}
            src={deckHref}
            title={deckTitle}
            className="h-[72vh] w-full border-0 bg-black"
          />
        </div>

        <aside className="space-y-3">
          <div className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Where you are
            </p>
            <p className="mt-1 text-base font-medium text-white">
              {slideNumber && deckState
                ? `Slide ${slideNumber} of ${deckState.totalSlides}`
                : "Loading deck"}
            </p>
            {deckState?.title ? (
              <p className="mt-1 text-sm text-zinc-400">{deckState.title}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleFollowLive}
                disabled={liveMode === "locked"}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  liveMode === "locked" || followLive
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                }`}
              >
                {liveMode === "locked"
                  ? "Locked to facilitator"
                  : followLive
                    ? "Following live"
                    : "Follow live"}
              </button>
              <button
                type="button"
                onClick={onOpenLibrary}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.08]"
              >
                Library
              </button>
            </div>
          </div>

          <ActivityRail
            labCheckpoints={labCheckpoints}
            activeCheckpointSlug={activeCheckpoint?.slug ?? null}
            completedCheckpointSlugs={completedCheckpointSlugs}
            buildLabHref={buildLabHref}
            onStartLab={onStartLab}
          />
        </aside>
      </div>

      <ActivityPromptCard
        slideNumber={slideNumber}
        activeCheckpoint={activeCheckpoint}
        slideAction={slideAction}
        labCompleted={labCompleted}
        onStartLab={() => onStartLab(activeCheckpoint?.slug ?? null)}
        onOpenLibrary={onOpenLibrary}
        labHref={labHref}
      />
    </div>
  );
}

function ActivityRail({
  labCheckpoints,
  activeCheckpointSlug,
  completedCheckpointSlugs,
  buildLabHref,
  onStartLab,
}: {
  labCheckpoints: TrainingLabCheckpoint[];
  activeCheckpointSlug: string | null;
  completedCheckpointSlugs: Set<string>;
  buildLabHref?: (checkpointSlug: string) => string;
  onStartLab: (checkpointSlug: string | null) => void;
}) {
  if (labCheckpoints.length === 0) return null;
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        Activities in this module
      </p>
      <ul className="mt-3 space-y-2">
        {labCheckpoints.map((checkpoint) => {
          const isActive = checkpoint.slug === activeCheckpointSlug;
          const isDone = completedCheckpointSlugs.has(checkpoint.slug);
          const href = buildLabHref?.(checkpoint.slug) ?? null;
          const statusLabel = isDone
            ? "Done"
            : isActive
              ? "Active"
              : `Slides ${checkpoint.startSlide}-${checkpoint.endSlide}`;
          return (
            <li
              key={checkpoint.slug}
              className={`rounded-2xl border px-3 py-3 text-sm transition ${
                isActive
                  ? "border-violet-400/40 bg-violet-400/[0.08] text-white"
                  : isDone
                    ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-100"
                    : "border-white/10 bg-white/[0.02] text-zinc-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{checkpoint.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">{statusLabel}</p>
                </div>
                {href ? (
                  <a
                    href={href}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-100 transition hover:bg-white/[0.08]"
                  >
                    {isDone ? "Review" : "Open"}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartLab(checkpoint.slug)}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-100 transition hover:bg-white/[0.08]"
                  >
                    {isDone ? "Review" : "Open"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
