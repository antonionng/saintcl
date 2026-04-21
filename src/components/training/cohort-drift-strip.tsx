"use client";

import { useMemo } from "react";

import type { TrainingParticipantRecord } from "@/types";

export type DriftLearner = {
  participant: TrainingParticipantRecord;
  slideIndex: number | null;
};

type CohortDriftStripProps = {
  totalSlides: number | null;
  facilitatorSlideIndex: number | null;
  learners: DriftLearner[];
  onJumpToLearner?: (slideIndex: number) => void;
  catchUpThreshold?: number;
  onNudgeCatchUp?: (message: string) => void;
};

type Band = "on" | "near" | "behind" | "far" | "no-data";

function bandFor(currentSlideIndex: number | null, learnerSlideIndex: number | null): Band {
  if (learnerSlideIndex === null || currentSlideIndex === null) return "no-data";
  const lag = currentSlideIndex - learnerSlideIndex;
  if (lag <= 0) return "on";
  if (lag === 1) return "near";
  if (lag <= 3) return "behind";
  return "far";
}

const bandToDot: Record<Band, string> = {
  on: "bg-emerald-400",
  near: "bg-emerald-400/60",
  behind: "bg-amber-400",
  far: "bg-rose-500",
  "no-data": "bg-zinc-700",
};

const bandToOutline: Record<Band, string> = {
  on: "ring-emerald-400/40",
  near: "ring-emerald-400/30",
  behind: "ring-amber-400/40",
  far: "ring-rose-500/50",
  "no-data": "ring-zinc-600/40",
};

export function CohortDriftStrip({
  totalSlides,
  facilitatorSlideIndex,
  learners,
  onJumpToLearner,
  catchUpThreshold = 3,
  onNudgeCatchUp,
}: CohortDriftStripProps) {
  const summary = useMemo(() => {
    const buckets = { on: 0, near: 0, behind: 0, far: 0, "no-data": 0 } satisfies Record<Band, number>;
    for (const learner of learners) {
      buckets[bandFor(facilitatorSlideIndex, learner.slideIndex)] += 1;
    }
    return buckets;
  }, [facilitatorSlideIndex, learners]);

  const farBehindCount = summary.far;
  const showCatchUp = farBehindCount > 0 || summary.behind >= catchUpThreshold;

  const totalForScale = totalSlides && totalSlides > 0 ? totalSlides : 1;

  return (
    <div className="flex w-full flex-col gap-3 rounded-[1.25rem] border border-white/[0.08] bg-black/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <Legend dot="bg-emerald-400" label={`On / near (${summary.on + summary.near})`} />
          <Legend dot="bg-amber-400" label={`Behind (${summary.behind})`} />
          <Legend dot="bg-rose-500" label={`Far behind (${summary.far})`} />
          {summary["no-data"] > 0 ? (
            <Legend dot="bg-zinc-700" label={`No data (${summary["no-data"]})`} />
          ) : null}
        </div>
        {showCatchUp && onNudgeCatchUp ? (
          <button
            type="button"
            onClick={() =>
              onNudgeCatchUp(
                farBehindCount > 0
                  ? `${farBehindCount} learner${farBehindCount === 1 ? "" : "s"} ${farBehindCount === 1 ? "is" : "are"} far behind. Take 60 seconds to catch up to the current slide.`
                  : "Take 60 seconds to catch up to the current slide.",
              )
            }
            className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1.5 text-xs text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-400/[0.16]"
          >
            Catch up
          </button>
        ) : null}
      </div>

      <div className="relative h-12 w-full">
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10" aria-hidden />
        {typeof facilitatorSlideIndex === "number" ? (
          <div
            className="absolute top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-white/70"
            style={{ left: `${(facilitatorSlideIndex / totalForScale) * 100}%` }}
            aria-hidden
          />
        ) : null}
        {learners.map((learner) => {
          const band = bandFor(facilitatorSlideIndex, learner.slideIndex);
          const left =
            learner.slideIndex !== null ? (learner.slideIndex / totalForScale) * 100 : 0;
          return (
            <button
              key={learner.participant.id}
              type="button"
              title={`${learner.participant.fullName} - slide ${learner.slideIndex !== null ? learner.slideIndex + 1 : "unknown"}`}
              onClick={() =>
                onJumpToLearner && learner.slideIndex !== null
                  ? onJumpToLearner(learner.slideIndex)
                  : undefined
              }
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition hover:scale-125 ${bandToDot[band]} ${bandToOutline[band]}`}
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
