"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CohortDriftStrip, type DriftLearner } from "@/components/training/cohort-drift-strip";
import { SlideScriptTimeline } from "@/components/training/slide-script-timeline";
import type {
  FacilitatorNoteBlockShape,
} from "@/components/training/training-facilitator-console";
import { resolveCheckpointInterventionPrompt, type TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import { createClient } from "@/lib/supabase/client";
import {
  legacyFromLiveMode,
  liveModeFromLegacy,
  subscribeToLiveDelivery,
  type LiveMode,
  type LiveSession,
} from "@/lib/training-realtime";
import type { SlideScript } from "@/lib/training-scripts/types";
import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingParticipantRecord,
} from "@/types";

type SlideManifestEntry = {
  id: string;
  index: number;
  title: string;
  eyebrow: string;
};

type DeckState = {
  slideId: string;
  slideIndex: number;
  totalSlides: number;
  title: string;
  eyebrow: string;
  fragmentIndex: number;
  fragmentCount: number;
};

type CohortSnapshot = {
  cohort: TrainingCohortRecord;
  participants: TrainingParticipantRecord[];
  enrollments: TrainingEnrollmentRecord[];
};

type ParticipantPosition = {
  participant: TrainingParticipantRecord;
  slideId: string | null;
  slideIndex: number | null;
  progressPercent: number | null;
  occurredAt: string | null;
};

type SlideScriptInput = SlideScript | string[];

type FacilitatorCockpitProps = {
  cohortSnapshots: CohortSnapshot[];
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  deckTitle: string;
  labCheckpoints?: TrainingLabCheckpoint[];
  trackCheckpointCompletion?: boolean;
  getNote: (slideIndex: number) => FacilitatorNoteBlockShape;
  getSlideScript: (slideIndex: number, title?: string, eyebrow?: string) => SlideScriptInput;
  getQuestions: (slideIndex: number, title?: string, eyebrow?: string) => string[];
};

function toScriptView(raw: SlideScriptInput) {
  if (Array.isArray(raw)) {
    return { sayThis: raw } as { sayThis: string[] };
  }
  return raw;
}

function sendDeckCommand(
  iframe: HTMLIFrameElement | null,
  payload: { command: "next" | "prev" | "clear-timer" | "goToSlide"; slideId?: string; slideIndex?: number },
) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage({ type: "python-training:command", ...payload }, "*");
}

function liveModeLabel(mode: LiveMode) {
  if (mode === "off") return "Live mode off";
  if (mode === "on") return "Live mode on";
  return "Locked to facilitator";
}

function nextLiveMode(mode: LiveMode): LiveMode {
  if (mode === "off") return "on";
  if (mode === "on") return "locked";
  return "off";
}

export function FacilitatorCockpit({
  cohortSnapshots,
  moduleSlug,
  moduleTitle,
  deckHref,
  deckTitle,
  labCheckpoints = [],
  trackCheckpointCompletion = true,
  getNote,
  getSlideScript,
  getQuestions,
}: FacilitatorCockpitProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [slides, setSlides] = useState<SlideManifestEntry[]>([]);
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [selectedInviteCode, setSelectedInviteCode] = useState(cohortSnapshots[0]?.cohort.inviteCode ?? "");
  const [liveMode, setLiveMode] = useState<LiveMode>("off");
  const [facilitatorPrompt, setFacilitatorPrompt] = useState<string | null>(null);
  const [participantPositions, setParticipantPositions] = useState<ParticipantPosition[]>([]);
  const [participantLabCheckpoints, setParticipantLabCheckpoints] = useState<TrainingParticipantLabCheckpointRecord[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentSlideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null;
  const totalSlides = deckState?.totalSlides ?? slides.length ?? null;
  const slideNumberForDisplay = currentSlideIndex !== null ? currentSlideIndex + 1 : null;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "python-training:slides") {
        setSlides(event.data.slides || []);
      }
      if (event.data.type === "python-training:state") {
        setDeckState(event.data);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const currentNote = useMemo(() => getNote(currentSlideIndex ?? 0), [currentSlideIndex, getNote]);
  const currentSlideScriptView = useMemo(
    () => toScriptView(getSlideScript(currentSlideIndex ?? 0, deckState?.title, deckState?.eyebrow)),
    [currentSlideIndex, deckState?.eyebrow, deckState?.title, getSlideScript],
  );
  const currentFacilitatorQuestions = useMemo(
    () => getQuestions(currentSlideIndex ?? 0, deckState?.title, deckState?.eyebrow),
    [currentSlideIndex, deckState?.eyebrow, deckState?.title, getQuestions],
  );

  const driftLearners = useMemo<DriftLearner[]>(() => {
    return participantPositions.map((entry) => ({
      participant: entry.participant,
      slideIndex: typeof entry.slideIndex === "number" ? entry.slideIndex : null,
    }));
  }, [participantPositions]);

  const activeCheckpoint = useMemo(() => {
    if (currentSlideIndex === null) return null;
    return (
      labCheckpoints.find((checkpoint) => {
        const slideNumber = currentSlideIndex + 1;
        return slideNumber >= checkpoint.startSlide && slideNumber <= checkpoint.endSlide;
      }) ?? null
    );
  }, [currentSlideIndex, labCheckpoints]);

  const activeInterventionPrompt = useMemo(() => {
    if (!activeCheckpoint || currentSlideIndex === null) return null;
    return resolveCheckpointInterventionPrompt(activeCheckpoint, currentSlideIndex + 1);
  }, [activeCheckpoint, currentSlideIndex]);

  const atRiskCount = useMemo(() => {
    if (!activeCheckpoint) return 0;
    return driftLearners.filter((learner) => {
      if (learner.slideIndex === null || currentSlideIndex === null) return false;
      const lag = currentSlideIndex - learner.slideIndex;
      if (lag <= 0) return false;
      if (!trackCheckpointCompletion) return true;
      const status = participantLabCheckpoints.find(
        (item) => item.participant.id === learner.participant.id && item.labSlug === activeCheckpoint.slug,
      );
      return status?.status !== "completed";
    }).length;
  }, [activeCheckpoint, currentSlideIndex, driftLearners, participantLabCheckpoints, trackCheckpointCompletion]);

  // Tracks whether the initial hydrate has settled so the auto-publish effect
  // does not race the network and overwrite the DB liveMode/prompt with the
  // component's stale defaults on first slide event.
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!selectedInviteCode) return;

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let fallbackTimer: number | null = null;
    hydratedRef.current = false;

    type LiveStatePayload = {
      data?: {
        live?: LiveSession | null;
        liveSession?: { broadcastEnabled?: boolean; metadata?: { lockToFacilitator?: boolean; facilitatorPrompt?: string | null } };
        participantPositions?: ParticipantPosition[];
        participantLabCheckpoints?: TrainingParticipantLabCheckpointRecord[];
      };
    };

    function applyLiveSession(next: LiveSession | null | undefined) {
      if (!next) return;
      setLiveMode(next.liveMode);
      setFacilitatorPrompt(next.prompt);
    }

    async function hydrate(): Promise<{ cohortId: string | null; moduleId: string | null }> {
      const response = await fetch(
        `/api/training/live-state?inviteCode=${encodeURIComponent(selectedInviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`,
        { cache: "no-store" },
      );
      if (!response.ok || cancelled) return { cohortId: null, moduleId: null };
      const payload = (await response.json()) as LiveStatePayload;
      if (cancelled) return { cohortId: null, moduleId: null };

      setParticipantPositions(payload.data?.participantPositions ?? []);
      setParticipantLabCheckpoints(payload.data?.participantLabCheckpoints ?? []);

      if (payload.data?.live) {
        applyLiveSession(payload.data.live);
      } else if (payload.data?.liveSession) {
        const legacy = payload.data.liveSession;
        applyLiveSession({
          cohortId: "",
          moduleId: "",
          facilitatorSlideId: null,
          facilitatorSlideIndex: 0,
          liveMode: liveModeFromLegacy({
            broadcastEnabled: Boolean(legacy.broadcastEnabled),
            lockToFacilitator: Boolean(legacy.metadata?.lockToFacilitator),
          }),
          prompt: legacy.metadata?.facilitatorPrompt ?? null,
          promptAt: null,
          updatedAt: new Date().toISOString(),
        });
      }

      return {
        cohortId: payload.data?.live?.cohortId ?? null,
        moduleId: payload.data?.live?.moduleId ?? null,
      };
    }

    void hydrate().then(({ cohortId, moduleId }) => {
      if (cancelled) return;
      hydratedRef.current = true;
      const supabase = createClient();
      if (supabase && cohortId && moduleId) {
        const subscription = subscribeToLiveDelivery({
          supabase,
          cohortId,
          moduleId,
          onLiveSession: (next) => {
            if (cancelled) return;
            applyLiveSession(next);
          },
          onPosition: (position) => {
            if (cancelled) return;
            setParticipantPositions((current) => {
              let replaced = false;
              const next = current.map((entry) => {
                if (entry.participant.id !== position.participantId) return entry;
                replaced = true;
                return {
                  ...entry,
                  slideId: position.slideId,
                  slideIndex: position.slideIndex,
                  progressPercent: position.progressPercent,
                  occurredAt: position.occurredAt,
                };
              });
              if (!replaced) return current;
              return next;
            });
          },
        });
        unsubscribe = subscription.unsubscribe;
      }

      fallbackTimer = window.setInterval(() => {
        void hydrate();
      }, 30_000);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (fallbackTimer !== null) window.clearInterval(fallbackTimer);
    };
  }, [moduleSlug, selectedInviteCode]);

  const publishLiveState = useCallback(
    async (overrides: { liveMode?: LiveMode; prompt?: string | null } = {}) => {
      if (!deckState || !selectedInviteCode) return;
      const mode = overrides.liveMode ?? liveMode;
      const prompt = overrides.prompt ?? facilitatorPrompt;
      const legacy = legacyFromLiveMode(mode);

      await fetch("/api/training/live-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: selectedInviteCode,
          moduleSlug,
          currentSlideId: deckState.slideId,
          currentSlideIndex: deckState.slideIndex,
          liveMode: mode,
          prompt,
          // Legacy aliases for any older subscribers.
          broadcastEnabled: legacy.broadcastEnabled,
          lockToFacilitator: legacy.lockToFacilitator,
          facilitatorPrompt: prompt,
        }),
      });
    },
    [deckState, facilitatorPrompt, liveMode, moduleSlug, selectedInviteCode],
  );

  // Keep the latest publish callback in a ref so the auto-publish effect can
  // call it without re-running every time liveMode/facilitatorPrompt change
  // (which would otherwise create a publish storm and make the participant's
  // "Live class on/off" pill flicker).
  const publishLiveStateRef = useRef(publishLiveState);
  useEffect(() => {
    publishLiveStateRef.current = publishLiveState;
  }, [publishLiveState]);

  // Auto-publish ONLY when the actual slide changes. We track the last
  // published slide so re-renders triggered by realtime echoes (HTTP broadcast
  // bypasses Supabase's `self: false`) cannot retrigger this effect.
  const lastPublishedSlideRef = useRef<string | null>(null);
  useEffect(() => {
    if (!deckState || !selectedInviteCode) return;
    if (!hydratedRef.current) return;
    const slideKey = `${selectedInviteCode}|${deckState.slideId ?? ""}|${deckState.slideIndex}`;
    if (lastPublishedSlideRef.current === slideKey) return;
    lastPublishedSlideRef.current = slideKey;
    void publishLiveStateRef.current();
  }, [deckState, selectedInviteCode]);

  const goNext = useCallback(() => sendDeckCommand(iframeRef.current, { command: "next" }), []);
  const goPrev = useCallback(() => sendDeckCommand(iframeRef.current, { command: "prev" }), []);

  const cycleLiveMode = useCallback(() => {
    const next = nextLiveMode(liveMode);
    setLiveMode(next);
    setStatusMessage(liveModeLabel(next));
    void publishLiveState({ liveMode: next });
  }, [liveMode, publishLiveState]);

  const nudge = useCallback(
    (message: string) => {
      setFacilitatorPrompt(message);
      setStatusMessage(message);
      void publishLiveState({ prompt: message });
    },
    [publishLiveState],
  );

  const clearPrompt = useCallback(() => {
    setFacilitatorPrompt(null);
    setStatusMessage("Prompt cleared");
    void publishLiveState({ prompt: null });
  }, [publishLiveState]);

  const promptAtRisk = useCallback(() => {
    if (activeInterventionPrompt) {
      nudge(activeInterventionPrompt.prompt);
      return;
    }
    if (activeCheckpoint) {
      nudge(activeCheckpoint.facilitatorPrompt);
      return;
    }
    nudge("Take a moment to catch up to the current slide.");
  }, [activeCheckpoint, activeInterventionPrompt, nudge]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "j" || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "k" || event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === " ") {
        event.preventDefault();
        cycleLiveMode();
      } else if (event.key === "[") {
        event.preventDefault();
        nudge("Take 60 seconds to catch up to the current slide.");
      } else if (event.key === "]") {
        event.preventDefault();
        promptAtRisk();
      } else if (event.key === "?") {
        event.preventDefault();
        setShowShortcuts((current) => !current);
      } else if (event.key === "Escape") {
        if (showShortcuts) {
          event.preventDefault();
          setShowShortcuts(false);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cycleLiveMode, goNext, goPrev, nudge, promptAtRisk, showShortcuts]);

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/[0.08] bg-black/30 px-5 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-[0.22em] text-zinc-500">{moduleTitle}</p>
          <h1 className="mt-1 truncate text-base font-semibold text-white">
            {deckState?.title ?? "Loading deck"}
            {slideNumberForDisplay && totalSlides ? (
              <span className="ml-2 text-sm font-normal text-zinc-400">
                Slide {slideNumberForDisplay} / {totalSlides}
              </span>
            ) : null}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedInviteCode}
            onChange={(event) => setSelectedInviteCode(event.target.value)}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white"
          >
            {cohortSnapshots.length > 0 ? (
              cohortSnapshots.map((snapshot) => (
                <option key={snapshot.cohort.id} value={snapshot.cohort.inviteCode ?? ""}>
                  {snapshot.cohort.name}
                </option>
              ))
            ) : (
              <option value="">No cohorts</option>
            )}
          </select>
          <button
            type="button"
            onClick={cycleLiveMode}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              liveMode === "off"
                ? "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                : liveMode === "on"
                  ? "border-emerald-400/40 bg-emerald-400/[0.12] text-emerald-100"
                  : "border-amber-400/40 bg-amber-400/[0.12] text-amber-100"
            }`}
            title="Space to cycle: off > on > locked"
          >
            {liveModeLabel(liveMode)}
          </button>
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
            title="Show keyboard shortcuts"
          >
            ?
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <iframe
            ref={iframeRef}
            src={deckHref}
            title={deckTitle}
            className="h-full w-full border-0 bg-black"
          />
          {facilitatorPrompt ? (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-black/80 px-4 py-3 text-sm text-amber-100 backdrop-blur">
              <span className="flex-1">{facilitatorPrompt}</span>
              <button
                type="button"
                onClick={clearPrompt}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200 transition hover:bg-white/[0.05]"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <SlideScriptTimeline
            note={currentNote}
            script={currentSlideScriptView}
            questions={currentFacilitatorQuestions}
            slideNumber={slideNumberForDisplay}
            totalSlides={totalSlides}
            slideTitle={deckState?.title ?? null}
            slideEyebrow={deckState?.eyebrow ?? null}
          />
        </aside>
      </div>

      <footer className="flex flex-col gap-2">
        {atRiskCount > 0 && activeCheckpoint ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-100">
            <span>
              {atRiskCount} learner{atRiskCount === 1 ? " is" : "s are"} behind on
              <span className="ml-1 font-semibold text-white">{activeCheckpoint.title}</span>.
            </span>
            <button
              type="button"
              onClick={promptAtRisk}
              className="rounded-full border border-rose-400/40 bg-rose-400/[0.12] px-3 py-1.5 text-xs text-rose-50 transition hover:bg-rose-400/[0.2]"
            >
              Send intervention prompt
            </button>
          </div>
        ) : null}

        <CohortDriftStrip
          totalSlides={totalSlides}
          facilitatorSlideIndex={currentSlideIndex}
          learners={driftLearners}
          onJumpToLearner={(slideIndex) => sendDeckCommand(iframeRef.current, { command: "goToSlide", slideIndex })}
          onNudgeCatchUp={nudge}
        />

        {statusMessage ? (
          <p className="text-center text-xs text-zinc-500">{statusMessage}</p>
        ) : null}
      </footer>

      {showShortcuts ? (
        <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />
      ) : null}
    </div>
  );
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-black/90 p-6 text-sm text-zinc-200 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Esc
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          <Shortcut keys={["j", "->"]} label="Next slide" />
          <Shortcut keys={["k", "<-"]} label="Previous slide" />
          <Shortcut keys={["space"]} label="Cycle live mode (off / on / locked)" />
          <Shortcut keys={["["]} label="Nudge cohort to catch up" />
          <Shortcut keys={["]"]} label="Send intervention prompt for current checkpoint" />
          <Shortcut keys={["?"]} label="Show or hide this overlay" />
        </ul>
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-zinc-300">{label}</span>
      <span className="flex gap-1.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium uppercase text-white"
          >
            {key}
          </kbd>
        ))}
      </span>
    </li>
  );
}
