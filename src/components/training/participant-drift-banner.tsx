"use client";

import type { LiveMode } from "@/lib/training-realtime";

type ParticipantDriftBannerProps = {
  totalSlides: number | null;
  participantSlideIndex: number | null;
  facilitatorSlideIndex: number | null;
  classMedianSlideIndex: number | null;
  liveMode: LiveMode;
  onToggleLive: () => void;
  prompt: string | null;
  onRejoinFacilitator: () => void;
};

export function ParticipantDriftBanner({
  totalSlides,
  participantSlideIndex,
  facilitatorSlideIndex,
  classMedianSlideIndex,
  liveMode,
  onToggleLive,
  prompt,
  onRejoinFacilitator,
}: ParticipantDriftBannerProps) {
  const totalForScale = totalSlides && totalSlides > 0 ? totalSlides : 1;
  const showFacilitator = typeof facilitatorSlideIndex === "number" && liveMode !== "off";
  const lockedToFacilitator = liveMode === "locked";
  const liveOn = liveMode !== "off";

  const drift =
    typeof participantSlideIndex === "number" && typeof facilitatorSlideIndex === "number"
      ? participantSlideIndex - facilitatorSlideIndex
      : null;

  const driftLabel = (() => {
    if (drift === null) return null;
    if (Math.abs(drift) <= 0) return "On the facilitator slide";
    if (drift > 0) return `${drift} slide${drift === 1 ? "" : "s"} ahead`;
    const behind = Math.abs(drift);
    return `${behind} slide${behind === 1 ? "" : "s"} behind`;
  })();

  return (
    <div className="sticky top-0 z-30 -mx-1 flex flex-col gap-2 rounded-[1.25rem] border border-white/[0.08] bg-black/70 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleLive}
            disabled={lockedToFacilitator}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              liveOn
                ? "border-emerald-400/40 bg-emerald-400/[0.12] text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            } ${lockedToFacilitator ? "cursor-not-allowed opacity-80" : ""}`}
          >
            {lockedToFacilitator
              ? "Locked to facilitator"
              : liveOn
                ? "Live class on"
                : "Live class off"}
          </button>
          {driftLabel ? (
            <span className="text-xs text-zinc-400">{driftLabel}</span>
          ) : null}
        </div>
        {showFacilitator && drift !== null && drift !== 0 ? (
          <button
            type="button"
            onClick={onRejoinFacilitator}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.08]"
          >
            Jump to facilitator slide
          </button>
        ) : null}
      </div>

      <div className="relative h-6 w-full">
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10" aria-hidden />
        {typeof classMedianSlideIndex === "number" ? (
          <Marker
            label="Class"
            colorClass="bg-zinc-300"
            leftPercent={(classMedianSlideIndex / totalForScale) * 100}
          />
        ) : null}
        {showFacilitator ? (
          <Marker
            label="Facilitator"
            colorClass="bg-amber-300"
            leftPercent={(facilitatorSlideIndex! / totalForScale) * 100}
          />
        ) : null}
        {typeof participantSlideIndex === "number" ? (
          <Marker
            label="You"
            colorClass="bg-emerald-400"
            leftPercent={(participantSlideIndex / totalForScale) * 100}
            emphasised
          />
        ) : null}
      </div>

      {prompt ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-3 py-2 text-sm text-amber-100">
          {prompt}
        </div>
      ) : null}
    </div>
  );
}

function Marker({
  label,
  colorClass,
  leftPercent,
  emphasised,
}: {
  label: string;
  colorClass: string;
  leftPercent: number;
  emphasised?: boolean;
}) {
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${leftPercent}%` }}
      title={label}
    >
      <div
        className={`h-3 w-3 rounded-full ${colorClass} ${emphasised ? "ring-2 ring-white/40" : ""}`}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
