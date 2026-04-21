"use client";

import { useMemo } from "react";

import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { SegmentBlock } from "@/lib/training-scripts/types";

type AssessmentBadge = {
  slug: string;
  title: string;
  slideRange?: { start: number; end: number };
};

type ModuleMapProps = {
  moduleTitle: string;
  totalSlides: number;
  segments: SegmentBlock[];
  labCheckpoints: TrainingLabCheckpoint[];
  assessments?: AssessmentBadge[];
  currentSlideIndex?: number | null;
  onJumpToSlide?: (slideIndex: number) => void;
};

export function ModuleMap({
  moduleTitle,
  totalSlides,
  segments,
  labCheckpoints,
  assessments = [],
  currentSlideIndex = null,
  onJumpToSlide,
}: ModuleMapProps) {
  const segmentRows = useMemo(() => {
    return segments.map((segment) => {
      const checkpointsForSegment = labCheckpoints.filter(
        (checkpoint) => checkpoint.endSlide >= segment.start && checkpoint.startSlide <= segment.end,
      );
      const assessmentsForSegment = assessments.filter((assessment) => {
        if (!assessment.slideRange) return false;
        return assessment.slideRange.end >= segment.start && assessment.slideRange.start <= segment.end;
      });
      return {
        segment,
        checkpoints: checkpointsForSegment,
        assessments: assessmentsForSegment,
      };
    });
  }, [assessments, labCheckpoints, segments]);

  const totalForScale = totalSlides > 0 ? totalSlides : 1;

  return (
    <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Module map</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{moduleTitle}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {totalSlides} slides across {segments.length} segment{segments.length === 1 ? "" : "s"}.
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {segmentRows.map(({ segment, checkpoints, assessments: segmentAssessments }) => {
          const widthPercent = ((segment.end - segment.start + 1) / totalForScale) * 100;
          const leftPercent = ((segment.start - 1) / totalForScale) * 100;
          const isCurrent =
            typeof currentSlideIndex === "number" &&
            currentSlideIndex + 1 >= segment.start &&
            currentSlideIndex + 1 <= segment.end;

          return (
            <div
              key={`${segment.start}-${segment.end}`}
              className={`rounded-2xl border px-4 py-3 transition ${
                isCurrent ? "border-sky-400/30 bg-sky-400/[0.06]" : "border-white/8 bg-white/[0.02]"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Slides {segment.start} - {segment.end}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{segment.label}</p>
                  <p className="mt-1 text-xs text-zinc-400">{segment.objective}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToSlide?.(segment.start - 1)}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-200 transition hover:bg-white/[0.06]"
                >
                  Jump
                </button>
              </div>

              <div className="relative mt-3 h-4 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className={`absolute top-0 h-full ${isCurrent ? "bg-sky-400/30" : "bg-white/10"}`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                />
                {typeof currentSlideIndex === "number" ? (
                  <div
                    className="absolute top-0 h-full w-[2px] bg-white/80"
                    style={{ left: `${(currentSlideIndex / totalForScale) * 100}%` }}
                    aria-hidden
                  />
                ) : null}
              </div>

              {(checkpoints.length > 0 || segmentAssessments.length > 0) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {checkpoints.map((checkpoint) => (
                    <span
                      key={checkpoint.slug}
                      title={`${checkpoint.title} (slides ${checkpoint.startSlide}-${checkpoint.endSlide})`}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-400/[0.08] px-2.5 py-0.5 text-[11px] text-violet-100"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-300" aria-hidden />
                      {checkpoint.title}
                    </span>
                  ))}
                  {segmentAssessments.map((assessment) => (
                    <span
                      key={assessment.slug}
                      title={assessment.title}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-2.5 py-0.5 text-[11px] text-amber-100"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
                      {assessment.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
