"use client";

import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { ParticipantAction } from "@/lib/training-scripts/types";

export type ActivityPromptCardProps = {
  slideNumber: number | null;
  activeCheckpoint: TrainingLabCheckpoint | null;
  slideAction: ParticipantAction | null;
  labCompleted: boolean;
  onStartLab: () => void;
  onOpenLibrary: () => void;
  labHref?: string | null;
};

export function ActivityPromptCard({
  slideNumber,
  activeCheckpoint,
  slideAction,
  labCompleted,
  onStartLab,
  onOpenLibrary,
  labHref,
}: ActivityPromptCardProps) {
  if (activeCheckpoint) {
    return (
      <div className="rounded-[1.25rem] border border-violet-400/25 bg-violet-400/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-violet-200/80">
              Activity {labCompleted ? "complete" : "in progress"}
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {activeCheckpoint.title}
            </p>
            <p className="mt-1 text-sm text-violet-100/80">
              {activeCheckpoint.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {labHref ? (
              <a
                href={labHref}
                className="rounded-full border border-violet-400/40 bg-violet-400/[0.14] px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400/[0.22]"
              >
                {labCompleted ? "Review lab" : "Start lab"}
              </a>
            ) : (
              <button
                type="button"
                onClick={onStartLab}
                className="rounded-full border border-violet-400/40 bg-violet-400/[0.14] px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400/[0.22]"
              >
                {labCompleted ? "Review lab" : "Start lab"}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenLibrary}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              Open library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (slideAction) {
    const isLabAction =
      slideAction.kind === "open_workspace" ||
      slideAction.kind === "complete_checkpoint";
    return (
      <div className="rounded-[1.25rem] border border-sky-400/25 bg-sky-400/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200/80">
              Suggested next step
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {slideAction.label}
            </p>
            {slideAction.description ? (
              <p className="mt-1 text-sm text-sky-100/80">
                {slideAction.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLabAction ? (
              labHref ? (
                <a
                  href={labHref}
                  className="rounded-full border border-sky-400/40 bg-sky-400/[0.14] px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400/[0.22]"
                >
                  Start lab
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onStartLab}
                  className="rounded-full border border-sky-400/40 bg-sky-400/[0.14] px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400/[0.22]"
                >
                  Start lab
                </button>
              )
            ) : null}
            {slideAction.href ? (
              <a
                href={slideAction.href}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
              >
                Open
              </a>
            ) : null}
            <button
              type="button"
              onClick={onOpenLibrary}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            On the deck
          </p>
          <p className="mt-1 text-base text-white">
            {slideNumber
              ? `Slide ${slideNumber}. Follow along. The next activity will surface here when you reach it.`
              : "Loading deck."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLibrary}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
        >
          Library
        </button>
      </div>
    </div>
  );
}
