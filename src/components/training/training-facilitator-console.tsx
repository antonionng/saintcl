"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingParticipantRecord,
} from "@/types";
import { ajbTrainingProgramme } from "@/lib/training";
import { resolveCheckpointInterventionPrompt, type TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { SlideScript } from "@/lib/training-scripts/types";
import { createClient } from "@/lib/supabase/client";
import {
  legacyFromLiveMode,
  liveModeFromLegacy,
  subscribeToLiveDelivery,
  type LiveMode,
  type LiveSession,
} from "@/lib/training-realtime";

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
  stats: {
    participantCount: number;
    activeParticipantCount: number;
    completedEnrollmentCount: number;
    activeEnrollmentCount: number;
    averageProgress: number;
  };
};

type ParticipantPosition = {
  participant: TrainingParticipantRecord;
  slideId: string | null;
  slideIndex: number | null;
  progressPercent: number | null;
  occurredAt: string | null;
};

type ModuleAccessResponse = {
  data?: {
    unlocks?: Record<string, boolean>;
  };
};

type EvidenceSummary = {
  byParticipant: Record<
    string,
    {
      participantId: string;
      submissionCount: number;
      notesCount: number;
      sharedNotesCount: number;
      lastSubmissionAt: string | null;
      lastNoteAt: string | null;
    }
  >;
  byCheckpoint: Record<
    string,
    {
      checkpointSlug: string;
      submissionCount: number;
      participantCount: number;
      notesCount: number;
      lastSubmissionAt: string | null;
    }
  >;
  recentSubmissions: Array<{
    id: string;
    participantId: string;
    scope: string;
    scopeId: string | null;
    kind: string | null;
    summary: string | null;
    artifactUrl: string | null;
    metadata: Record<string, unknown> | null;
    submittedAt: string | null;
  }>;
};

export type FacilitatorNoteBlockShape = {
  start: number;
  end: number;
  label: string;
  objective: string;
  talkTrack: string[];
  facilitationMoves: string[];
  debrief?: string[];
};

type SlideScriptInput = SlideScript | string[];

type ScriptView = {
  sayThis: string[];
  presenterCues?: string[];
  coreMessage?: string;
  showThis?: string;
  askThis?: string[];
  doThis?: string[];
  watchFor?: string[];
  landThePoint?: string;
  transition?: string;
  segment?: string;
  estMinutes?: number;
};

function toScriptView(raw: SlideScriptInput): ScriptView {
  if (Array.isArray(raw)) {
    return { sayThis: raw };
  }
  return {
    sayThis: raw.sayThis,
    presenterCues: raw.presenterCues,
    coreMessage: raw.coreMessage,
    showThis: raw.showThis,
    askThis: raw.askThis,
    doThis: raw.doThis,
    watchFor: raw.watchFor,
    landThePoint: raw.landThePoint,
    transition: raw.transition,
    segment: raw.segment,
    estMinutes: raw.estMinutes,
  };
}

type TrainingFacilitatorConsoleProps = {
  cohortSnapshots: CohortSnapshot[];
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  deckTitle: string;
  labCheckpoints?: TrainingLabCheckpoint[];
  trackCheckpointCompletion?: boolean;
  getNote: (slideIndex: number) => FacilitatorNoteBlockShape;
  getNoteBlocks: () => FacilitatorNoteBlockShape[];
  getSlideScript: (slideIndex: number, title?: string, eyebrow?: string) => SlideScriptInput;
  getQuestions: (slideIndex: number, title?: string, eyebrow?: string) => string[];
};

const PRESENTER_MODE_MODULES = new Set(["python-for-data", "programme-orientation"]);

type ConsoleMode = "presenter" | "operator";

function modeStorageKey(moduleSlug: string) {
  return `training-facilitator:mode:${moduleSlug}`;
}

function readStoredMode(moduleSlug: string): ConsoleMode {
  if (typeof window === "undefined") return "presenter";
  if (!PRESENTER_MODE_MODULES.has(moduleSlug)) return "operator";
  try {
    const stored = window.localStorage.getItem(modeStorageKey(moduleSlug));
    if (stored === "operator" || stored === "presenter") return stored;
  } catch {
    // ignore storage errors
  }
  return "presenter";
}

type BeatLabel = "brief" | "engage" | "verify" | "defend";

const BEAT_DISPLAY: Record<BeatLabel, { label: string; classes: string }> = {
  brief: { label: "Step 1 - Brief", classes: "border-violet-400/30 bg-violet-400/[0.10] text-violet-100" },
  engage: { label: "Step 2 - Engage", classes: "border-sky-400/30 bg-sky-400/[0.10] text-sky-100" },
  verify: { label: "Step 3 - Verify", classes: "border-amber-400/30 bg-amber-400/[0.10] text-amber-100" },
  defend: { label: "Step 4 - Defend", classes: "border-emerald-400/30 bg-emerald-400/[0.10] text-emerald-100" },
};

// Derive a participant's most recent beat for the active checkpoint by
// scanning the recent workbench_state submissions in evidenceSummary. The
// chat shell tags every workbench submission with metadata.beat, so this is
// a read-only client-side derivation - no new persistence layer needed.
function latestBeatForParticipant(
  participantId: string,
  checkpointSlug: string | null,
  evidenceSummary: EvidenceSummary | null,
): { beat: BeatLabel; submittedAt: string | null; challengeQuestionId: string | null } | null {
  if (!evidenceSummary || !checkpointSlug) return null;
  const candidates = evidenceSummary.recentSubmissions
    .filter((submission) => {
      if (submission.participantId !== participantId) return null;
      if (submission.kind !== "workbench_state") return null;
      const metadata = submission.metadata ?? null;
      const cp = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).checkpointSlug : null;
      return cp === checkpointSlug;
    })
    .sort((a, b) => {
      const at = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bt = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bt - at;
    });
  const latest = candidates[0];
  if (!latest) return null;
  const metadata = (latest.metadata ?? {}) as Record<string, unknown>;
  const beat = metadata.beat;
  const challengeQuestionId = metadata.challengeQuestionId;
  if (beat !== "brief" && beat !== "engage" && beat !== "verify" && beat !== "defend") {
    return null;
  }
  return {
    beat,
    submittedAt: latest.submittedAt,
    challengeQuestionId: typeof challengeQuestionId === "string" ? challengeQuestionId : null,
  };
}

function formatRelativeTime(value: string | null) {
  if (!value) return "No activity yet";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function resolveLearnerBand(currentSlideIndex: number | null, learnerSlideIndex: number | null) {
  if (learnerSlideIndex === null || currentSlideIndex === null) {
    return {
      label: "No slide data",
      tone: "border-white/10 bg-white/[0.04] text-zinc-200",
      lag: null as number | null,
    };
  }

  const lag = Math.max(currentSlideIndex - learnerSlideIndex, 0);
  if (lag === 0) {
    return {
      label: "On current slide",
      tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
      lag,
    };
  }
  if (lag <= 3) {
    return {
      label: "1 to 3 slides behind",
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      lag,
    };
  }
  return {
    label: "More than 3 behind",
    tone: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    lag,
  };
}

function buildAtRiskPrompt(input: { checkpointTitle: string; learnerCount: number }) {
  if (input.learnerCount === 1) {
    return `One learner is behind the current slide and has not completed ${input.checkpointTitle}. Please return to the workspace, complete the checkpoint, and then rejoin the live deck.`;
  }

  return `${input.learnerCount} learners are behind the current slide and have not completed ${input.checkpointTitle}. Please return to the workspace, complete the checkpoint, and then rejoin the live deck.`;
}

function buildSlideSpecificRiskPrompt(input: {
  checkpoint: TrainingLabCheckpoint;
  learnerCount: number;
  slideNumber: number;
}) {
  const matchedPrompt = resolveCheckpointInterventionPrompt(input.checkpoint, input.slideNumber);
  if (!matchedPrompt) {
    return buildAtRiskPrompt({
      checkpointTitle: input.checkpoint.title,
      learnerCount: input.learnerCount,
    });
  }

  if (input.learnerCount === 1) {
    return `One learner is behind the current teaching moment. ${matchedPrompt.prompt}`;
  }

  return `${input.learnerCount} learners are behind the current teaching moment. ${matchedPrompt.prompt}`;
}

function sendDeckCommand(
  iframe: HTMLIFrameElement | null,
  payload: { command: "next" | "prev" | "clear-timer" | "goToSlide"; slideId?: string; slideIndex?: number },
) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage({ type: "python-training:command", ...payload }, "*");
}

export function TrainingFacilitatorConsole({
  cohortSnapshots,
  moduleSlug,
  moduleTitle,
  deckHref,
  deckTitle,
  labCheckpoints = [],
  trackCheckpointCompletion = true,
  getNote,
  getNoteBlocks,
  getSlideScript,
  getQuestions,
}: TrainingFacilitatorConsoleProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [slides, setSlides] = useState<SlideManifestEntry[]>([]);
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [selectedInviteCode, setSelectedInviteCode] = useState(cohortSnapshots[0]?.cohort.inviteCode ?? "");
  const [broadcastEnabled, setBroadcastEnabled] = useState(false);
  const [lockToFacilitator, setLockToFacilitator] = useState(false);
  const [facilitatorPrompt, setFacilitatorPrompt] = useState<string | null>(null);
  const [moduleUnlocks, setModuleUnlocks] = useState<Record<string, boolean>>({});
  const [participantPositions, setParticipantPositions] = useState<ParticipantPosition[]>([]);
  const [participantLabCheckpoints, setParticipantLabCheckpoints] = useState<TrainingParticipantLabCheckpointRecord[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState<EvidenceSummary | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeNotesTab, setActiveNotesTab] = useState<"guide" | "script">("guide");
  const supportsPresenter = PRESENTER_MODE_MODULES.has(moduleSlug);
  const [mode, setMode] = useState<ConsoleMode>(supportsPresenter ? "presenter" : "operator");
  const [activeOperatorTab, setActiveOperatorTab] = useState<
    "roster" | "checkpoints" | "release" | "navigator" | "segments"
  >("roster");
  const [activeChip, setActiveChip] = useState<"ask" | "watch" | "do" | null>(null);
  const currentSlideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null;

  useEffect(() => {
    setMode(readStoredMode(moduleSlug));
  }, [moduleSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supportsPresenter) return;
    try {
      window.localStorage.setItem(modeStorageKey(moduleSlug), mode);
    } catch {
      // ignore storage errors
    }
  }, [mode, moduleSlug, supportsPresenter]);

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
  const currentSlideScriptView = useMemo<ScriptView>(
    () => toScriptView(getSlideScript(currentSlideIndex ?? 0, deckState?.title, deckState?.eyebrow)),
    [currentSlideIndex, deckState?.eyebrow, deckState?.title, getSlideScript],
  );
  const currentFacilitatorQuestions = useMemo(
    () => getQuestions(currentSlideIndex ?? 0, deckState?.title, deckState?.eyebrow),
    [currentSlideIndex, deckState?.eyebrow, deckState?.title, getQuestions],
  );
  const noteBlocks = useMemo(() => getNoteBlocks(), [getNoteBlocks]);
  const learnerRoster = useMemo(() => {
    return participantPositions
      .map((entry) => {
        const band = resolveLearnerBand(
          currentSlideIndex,
          typeof entry.slideIndex === "number" ? entry.slideIndex : null,
        );
        return {
          ...entry,
          band,
        };
      })
      .sort((left, right) => {
        const leftLag = left.band.lag ?? Number.POSITIVE_INFINITY;
        const rightLag = right.band.lag ?? Number.POSITIVE_INFINITY;
        return leftLag - rightLag;
      });
  }, [currentSlideIndex, participantPositions]);
  const rosterSummary = useMemo(() => {
    return learnerRoster.reduce(
      (summary, entry) => {
        if (entry.band.label === "On current slide") summary.onCurrent += 1;
        else if (entry.band.label === "1 to 3 slides behind") summary.slightlyBehind += 1;
        else if (entry.band.label === "More than 3 behind") summary.farBehind += 1;
        else summary.noData += 1;
        return summary;
      },
      { onCurrent: 0, slightlyBehind: 0, farBehind: 0, noData: 0 },
    );
  }, [learnerRoster]);
  const currentModuleSequence = useMemo(
    () => ajbTrainingProgramme.modules.find((module) => module.slug === moduleSlug)?.sequence ?? 0,
    [moduleSlug],
  );
  const participantLabSummary = useMemo(() => {
    return learnerRoster.map((entry) => {
      const checkpoints = participantLabCheckpoints.filter((item) => item.participant.id === entry.participant.id);
      const completedCount = checkpoints.filter((item) => item.status === "completed").length;
      const activeCount = checkpoints.filter((item) => item.status === "launched").length;
      const pending = checkpoints.filter((item) => item.status !== "completed");
      return {
        participantId: entry.participant.id,
        completedCount,
        activeCount,
        pending,
      };
    });
  }, [learnerRoster, participantLabCheckpoints]);
  const checkpointSummary = useMemo(() => {
    return labCheckpoints.map((checkpoint) => {
      const matching = participantLabCheckpoints.filter((item) => item.labSlug === checkpoint.slug);
      return {
        checkpoint,
        completed: matching.filter((item) => item.status === "completed").length,
        launched: matching.filter((item) => item.status === "launched").length,
        notStarted: matching.filter((item) => item.status === "not_started").length,
      };
    });
  }, [labCheckpoints, participantLabCheckpoints]);
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
  const checkpointPromptsBySlug = useMemo(() => {
    if (currentSlideIndex === null) {
      return {} as Record<string, ReturnType<typeof resolveCheckpointInterventionPrompt>>;
    }

    return Object.fromEntries(
      labCheckpoints.map((checkpoint) => [
        checkpoint.slug,
        resolveCheckpointInterventionPrompt(checkpoint, currentSlideIndex + 1),
      ]),
    ) as Record<string, ReturnType<typeof resolveCheckpointInterventionPrompt>>;
  }, [currentSlideIndex, labCheckpoints]);
  const atRiskLearners = useMemo(() => {
    if (!activeCheckpoint) return [];

    return learnerRoster.filter((entry) => {
      const lag = entry.band.lag ?? 0;
      if (lag <= 0) return false;

      if (!trackCheckpointCompletion) {
        return true;
      }

      const checkpointStatus = participantLabCheckpoints.find(
        (item) => item.participant.id === entry.participant.id && item.labSlug === activeCheckpoint.slug,
      );

      return checkpointStatus?.status !== "completed";
    });
  }, [activeCheckpoint, learnerRoster, participantLabCheckpoints, trackCheckpointCompletion]);
  const atRiskPrompt = useMemo(() => {
    if (!activeCheckpoint || atRiskLearners.length === 0) return null;
    return buildSlideSpecificRiskPrompt({
      checkpoint: activeCheckpoint,
      learnerCount: atRiskLearners.length,
      slideNumber: (currentSlideIndex ?? 0) + 1,
    });
  }, [activeCheckpoint, atRiskLearners.length, currentSlideIndex]);
  const releaseModules = useMemo(
    () => ajbTrainingProgramme.modules.filter((module) => module.sequence > currentModuleSequence),
    [currentModuleSequence],
  );

  // Tracks whether the initial hydrate has settled. The auto-publish effect
  // waits for this to flip true before sending the first POST so we never
  // overwrite the DB liveMode/prompt with the component's stale defaults.
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
        evidenceSummary?: EvidenceSummary | null;
      };
    };

    function applyLiveSession(next: LiveSession | null | undefined) {
      if (!next) return;
      const legacy = legacyFromLiveMode(next.liveMode);
      setBroadcastEnabled(legacy.broadcastEnabled);
      setLockToFacilitator(legacy.lockToFacilitator);
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
      setEvidenceSummary(payload.data?.evidenceSummary ?? null);

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

      const moduleAccessResponse = await fetch(
        `/api/training/module-access?inviteCode=${encodeURIComponent(selectedInviteCode)}`,
        { cache: "no-store" },
      );
      if (!moduleAccessResponse.ok || cancelled) {
        return { cohortId: payload.data?.live?.cohortId ?? null, moduleId: payload.data?.live?.moduleId ?? null };
      }
      const moduleAccessPayload = (await moduleAccessResponse.json()) as ModuleAccessResponse;
      if (cancelled) {
        return { cohortId: payload.data?.live?.cohortId ?? null, moduleId: payload.data?.live?.moduleId ?? null };
      }
      setModuleUnlocks(moduleAccessPayload.data?.unlocks ?? {});

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
              if (!replaced) {
                // Unknown participant: trigger a fallback hydrate so the roster
                // picks up the new entry on the next slow tick rather than
                // synthesising a stub here.
                return current;
              }
              return next;
            });
          },
        });
        unsubscribe = subscription.unsubscribe;
      }

      // Slow fallback poll for participant lab checkpoints + module unlocks +
      // any dropped broadcasts. 30s is well below cognitive expectations and
      // 12x lighter than the previous 3s loop.
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

  // Auto-publish whenever the slide, live-mode, or prompt changes after the
  // initial hydrate. A dedup key suppresses no-op republishes when the realtime
  // broadcast echoes our own values back to us (the HTTP broadcast bypasses
  // Supabase's `self: false`), which would otherwise risk a publish storm.
  const lastPublishedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedInviteCode) return;
    if (!hydratedRef.current) return;

    const liveMode: LiveMode = lockToFacilitator
      ? "locked"
      : broadcastEnabled
        ? "on"
        : "off";
    const slideId = deckState?.slideId ?? null;
    const slideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : 0;
    const promptKey = facilitatorPrompt ?? "";
    const publishKey = `${selectedInviteCode}|${slideId ?? ""}|${slideIndex}|${liveMode}|${promptKey}`;
    if (lastPublishedKeyRef.current === publishKey) return;
    lastPublishedKeyRef.current = publishKey;

    let cancelled = false;

    async function publishLiveState() {
      const response = await fetch("/api/training/live-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: selectedInviteCode,
          moduleSlug,
          currentSlideId: slideId,
          currentSlideIndex: slideIndex,
          liveMode,
          prompt: facilitatorPrompt,
        }),
      });

      if (cancelled || !response.ok) return;
      const slideLabel = deckState ? `slide ${slideIndex + 1}` : "current slide";
      if (liveMode === "locked") {
        setSyncMessage(`Learners locked to ${slideLabel} for ${selectedInviteCode}`);
      } else if (liveMode === "on") {
        setSyncMessage(`Broadcasting ${slideLabel} to ${selectedInviteCode}. Learners can self-navigate.`);
      } else {
        setSyncMessage("Broadcast paused. Learners can keep moving independently.");
      }
    }

    publishLiveState();
    return () => {
      cancelled = true;
    };
  }, [
    broadcastEnabled,
    deckState,
    facilitatorPrompt,
    lockToFacilitator,
    moduleSlug,
    selectedInviteCode,
  ]);

  const nudgeLearners = useCallback((message: string) => {
    setFacilitatorPrompt(message);
    setSyncMessage(message);
  }, []);

  const goNext = useCallback(() => sendDeckCommand(iframeRef.current, { command: "next" }), []);
  const goPrev = useCallback(() => sendDeckCommand(iframeRef.current, { command: "prev" }), []);

  useEffect(() => {
    if (mode !== "presenter") return;
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
      } else if (event.key === "o") {
        event.preventDefault();
        setMode("operator");
      } else if (event.key === " ") {
        event.preventDefault();
        setBroadcastEnabled((current) => !current);
      } else if (event.key === "g") {
        event.preventDefault();
        setActiveOperatorTab("navigator");
        setMode("operator");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, mode]);

  async function setModuleRelease(nextModuleSlug: string, unlocked: boolean) {
    const response = await fetch("/api/training/module-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode: selectedInviteCode,
        moduleSlug: nextModuleSlug,
        unlocked,
      }),
    });

    if (!response.ok) return;

    setModuleUnlocks((current) => ({ ...current, [nextModuleSlug]: unlocked }));
    const targetModule = ajbTrainingProgramme.modules.find((module) => module.slug === nextModuleSlug);
    setSyncMessage(
      unlocked
        ? `${targetModule?.title ?? nextModuleSlug} is now open for participants in ${selectedInviteCode}.`
        : `${targetModule?.title ?? nextModuleSlug} is now gated again in ${selectedInviteCode}.`,
    );
  }

  const slideNumberForDisplay = currentSlideIndex !== null ? currentSlideIndex + 1 : null;
  const totalSlidesForDisplay = deckState?.totalSlides ?? slides.length ?? null;

  if (supportsPresenter && mode === "presenter") {
    return (
      <PresenterLayout
        deckHref={deckHref}
        deckTitle={deckTitle}
        deckIframeRef={iframeRef}
        slideNumber={slideNumberForDisplay}
        totalSlides={totalSlidesForDisplay}
        deckState={deckState}
        scriptView={currentSlideScriptView}
        currentNote={currentNote}
        moduleTitle={moduleTitle}
        cohortSnapshots={cohortSnapshots}
        selectedInviteCode={selectedInviteCode}
        onSelectInviteCode={setSelectedInviteCode}
        broadcastEnabled={broadcastEnabled}
        onToggleBroadcast={() => setBroadcastEnabled((current) => !current)}
        lockToFacilitator={lockToFacilitator}
        onToggleLock={() => setLockToFacilitator((current) => !current)}
        onClearPrompt={() => setFacilitatorPrompt(null)}
        atRiskPrompt={atRiskPrompt}
        onPromptAtRisk={() => atRiskPrompt && nudgeLearners(atRiskPrompt)}
        onCatchUpPrompt={() => nudgeLearners("Please catch up to the current slide now.")}
        activeChip={activeChip}
        setActiveChip={setActiveChip}
        questions={currentFacilitatorQuestions}
        syncMessage={syncMessage}
        onSwitchToOperator={() => setMode("operator")}
        onPrev={goPrev}
        onNext={goNext}
        onClearTimer={() => sendDeckCommand(iframeRef.current, { command: "clear-timer" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid min-h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(420px,0.92fr)]">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Facilitator deck console</p>
              <p className="text-sm text-zinc-300">
                {deckState ? `${deckState.slideIndex + 1} / ${deckState.totalSlides} · ${deckState.title}` : "Waiting for deck state"}
              </p>
              {syncMessage ? <p className="mt-1 text-xs text-zinc-500">{syncMessage}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {supportsPresenter ? (
                <button
                  type="button"
                  className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-400/[0.18]"
                  onClick={() => setMode("presenter")}
                >
                  Switch to Presenter
                </button>
              ) : null}
              <select
                value={selectedInviteCode}
                onChange={(event) => setSelectedInviteCode(event.target.value)}
                className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-sm text-white"
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
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  broadcastEnabled
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.05]"
                }`}
                onClick={() => setBroadcastEnabled((current) => !current)}
              >
                {broadcastEnabled ? "Broadcast on" : "Broadcast off"}
              </button>
              <button
                type="button"
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  lockToFacilitator
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                    : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.05]"
                }`}
                onClick={() => setLockToFacilitator((current) => !current)}
              >
                {lockToFacilitator ? "Unlock learners" : "Lock to facilitator"}
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={() => nudgeLearners("Please catch up to the current slide now.")}
              >
                Catch-up prompt
              </button>
              {atRiskPrompt ? (
                <button
                  type="button"
                  className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/[0.16]"
                  onClick={() => nudgeLearners(atRiskPrompt)}
                >
                  Prompt at-risk learners
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={() => setFacilitatorPrompt(null)}
              >
                Clear prompt
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={goPrev}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={goNext}
              >
                Next
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={() => sendDeckCommand(iframeRef.current, { command: "clear-timer" })}
              >
                Clear timer
              </button>
            </div>
          </div>
          <iframe ref={iframeRef} src={deckHref} title={deckTitle} className="h-[calc(100vh-13rem)] w-full border-0 bg-black" />
        </div>

        <div className="flex min-h-0 flex-col gap-6">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Current slide</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{deckState?.title ?? "Loading..."}</h2>
            <p className="mt-2 text-sm text-zinc-400">{deckState?.eyebrow ?? moduleTitle}</p>
            <p className="mt-2 text-sm text-zinc-300">Script block: {currentNote.label}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div
                className={`rounded-full border px-3 py-1 text-xs ${
                  broadcastEnabled
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-200"
                }`}
              >
                {broadcastEnabled ? "Broadcast active" : "Broadcast paused"}
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs ${
                  lockToFacilitator
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-200"
                }`}
              >
                {lockToFacilitator ? "Learners locked to facilitator" : "Learners can self-navigate"}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {activeCheckpoint ? (
                <div className="rounded-2xl border border-rose-400/10 bg-rose-400/[0.05] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-rose-200/70">Intervention focus</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    Active checkpoint: <strong>{activeCheckpoint.title}</strong>
                  </p>
                  {activeInterventionPrompt ? (
                    <p className="mt-2 text-sm text-zinc-300">
                      Recommended prompt now: <span className="text-white">{activeInterventionPrompt.label}</span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-zinc-300">
                    {atRiskLearners.length > 0
                      ? trackCheckpointCompletion
                        ? `${atRiskLearners.length} learners are behind this teaching moment and still missing the active checkpoint.`
                        : `${atRiskLearners.length} learners are behind this teaching moment and may need intervention on the active checkpoint.`
                      : trackCheckpointCompletion
                        ? "No learners are currently behind the slide flow and missing this checkpoint."
                        : "No learners are currently behind the slide flow for this checkpoint."}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    activeNotesTab === "guide"
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/10 bg-black/10 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                  onClick={() => setActiveNotesTab("guide")}
                >
                  Facilitator guide
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    activeNotesTab === "script"
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/10 bg-black/10 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                  onClick={() => setActiveNotesTab("script")}
                >
                  Delivery script
                </button>
              </div>
              {activeNotesTab === "guide" ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Facilitator focus</p>
                    <p className="mt-2 text-sm text-zinc-200">{currentNote.objective}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Guide highlights</p>
                    <div className="mt-2 space-y-2">
                      {currentNote.talkTrack.map((line) => (
                        <div key={line} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-300">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Top tips</p>
                    <div className="mt-2 space-y-2">
                      {currentNote.facilitationMoves.map((line) => (
                        <div key={line} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-300">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                  {currentNote.debrief?.length ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Debrief prompts</p>
                      <div className="mt-2 space-y-2">
                        {currentNote.debrief.map((line) => (
                          <div key={line} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-300">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {currentSlideScriptView.presenterCues && currentSlideScriptView.presenterCues.length > 0 ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Slide-specific moves</p>
                      <div className="mt-2 space-y-2">
                        {currentSlideScriptView.presenterCues.map((line) => (
                          <div
                            key={line}
                            className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-50"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div>
                  {currentSlideScriptView.coreMessage ? (
                    <p className="mb-3 text-sm font-semibold text-white">{currentSlideScriptView.coreMessage}</p>
                  ) : null}
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Word-for-word delivery script</p>
                  <div className="mt-2 space-y-3">
                    {currentSlideScriptView.sayThis.map((line, index) => (
                      <div
                        key={`${index}-${line}`}
                        className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.04] px-4 py-4 text-sm leading-7 text-zinc-100"
                      >
                        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-sky-200/70">Say this {index + 1}</p>
                        <p>{line}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Facilitator questions</p>
                    <div className="mt-2 space-y-3">
                      {currentFacilitatorQuestions.map((line, index) => (
                        <div
                          key={`${index}-${line}`}
                          className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-4 text-sm leading-7 text-zinc-100"
                        >
                          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Ask the room {index + 1}</p>
                          <p>{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {supportsPresenter ? (
        <OperatorTabset
          activeTab={activeOperatorTab}
          onTabChange={setActiveOperatorTab}
          slides={slides}
          deckState={deckState}
          noteBlocks={noteBlocks}
          releaseModules={releaseModules}
          moduleUnlocks={moduleUnlocks}
          setModuleRelease={setModuleRelease}
          learnerRoster={learnerRoster}
          rosterSummary={rosterSummary}
          activeCheckpoint={activeCheckpoint}
          activeInterventionPrompt={activeInterventionPrompt}
          atRiskLearners={atRiskLearners}
          atRiskPrompt={atRiskPrompt}
          trackCheckpointCompletion={trackCheckpointCompletion}
          checkpointSummary={checkpointSummary}
          checkpointPromptsBySlug={checkpointPromptsBySlug}
          participantLabSummary={participantLabSummary}
          participantLabCheckpoints={participantLabCheckpoints}
          evidenceSummary={evidenceSummary}
          onJumpToSlide={(payload) => sendDeckCommand(iframeRef.current, payload)}
          onNudge={nudgeLearners}
        />
      ) : (
        <LegacyOperatorPanels
          slides={slides}
          deckState={deckState}
          noteBlocks={noteBlocks}
          releaseModules={releaseModules}
          moduleUnlocks={moduleUnlocks}
          setModuleRelease={setModuleRelease}
          learnerRoster={learnerRoster}
          rosterSummary={rosterSummary}
          activeCheckpoint={activeCheckpoint}
          activeInterventionPrompt={activeInterventionPrompt}
          atRiskLearners={atRiskLearners}
          atRiskPrompt={atRiskPrompt}
          trackCheckpointCompletion={trackCheckpointCompletion}
          checkpointSummary={checkpointSummary}
          checkpointPromptsBySlug={checkpointPromptsBySlug}
          participantLabSummary={participantLabSummary}
          participantLabCheckpoints={participantLabCheckpoints}
          evidenceSummary={evidenceSummary}
          onJumpToSlide={(payload) => sendDeckCommand(iframeRef.current, payload)}
          onNudge={nudgeLearners}
        />
      )}
    </div>
  );
}

type LearnerEntry = ReturnType<typeof resolveLearnerBand> extends infer _R
  ? ParticipantPosition & { band: ReturnType<typeof resolveLearnerBand> }
  : never;

type SecondaryProps = {
  slides: SlideManifestEntry[];
  deckState: DeckState | null;
  noteBlocks: FacilitatorNoteBlockShape[];
  releaseModules: typeof ajbTrainingProgramme.modules;
  moduleUnlocks: Record<string, boolean>;
  setModuleRelease: (slug: string, unlocked: boolean) => void;
  learnerRoster: LearnerEntry[];
  rosterSummary: { onCurrent: number; slightlyBehind: number; farBehind: number; noData: number };
  activeCheckpoint: TrainingLabCheckpoint | null;
  activeInterventionPrompt: ReturnType<typeof resolveCheckpointInterventionPrompt> | null;
  atRiskLearners: LearnerEntry[];
  atRiskPrompt: string | null;
  trackCheckpointCompletion: boolean;
  checkpointSummary: Array<{
    checkpoint: TrainingLabCheckpoint;
    completed: number;
    launched: number;
    notStarted: number;
  }>;
  checkpointPromptsBySlug: Record<string, ReturnType<typeof resolveCheckpointInterventionPrompt>>;
  participantLabSummary: Array<{
    participantId: string;
    completedCount: number;
    activeCount: number;
    pending: TrainingParticipantLabCheckpointRecord[];
  }>;
  participantLabCheckpoints: TrainingParticipantLabCheckpointRecord[];
  evidenceSummary: EvidenceSummary | null;
  onJumpToSlide: (payload: { command: "goToSlide"; slideId?: string; slideIndex?: number }) => void;
  onNudge: (message: string) => void;
};

function RosterPanel({
  learnerRoster,
  rosterSummary,
  activeCheckpoint,
  activeInterventionPrompt,
  atRiskLearners,
  atRiskPrompt,
  trackCheckpointCompletion,
  participantLabCheckpoints,
  evidenceSummary,
  onJumpToSlide,
  onNudge,
}: Pick<
  SecondaryProps,
  | "learnerRoster"
  | "rosterSummary"
  | "activeCheckpoint"
  | "activeInterventionPrompt"
  | "atRiskLearners"
  | "atRiskPrompt"
  | "trackCheckpointCompletion"
  | "participantLabCheckpoints"
  | "evidenceSummary"
  | "onJumpToSlide"
  | "onNudge"
>) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100">
          On current slide: {rosterSummary.onCurrent}
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
          1 to 3 behind: {rosterSummary.slightlyBehind}
        </div>
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
          More than 3 behind: {rosterSummary.farBehind}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
          No data yet: {rosterSummary.noData}
        </div>
      </div>
      {activeCheckpoint && (activeCheckpoint.challengeQuestions ?? []).length > 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                Defend bank for {activeCheckpoint.title}
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Each participant gets one of these on the Defend step. Coach uses the rubric. You press where the rubric is thin.
              </p>
              <ul className="mt-3 space-y-2">
                {(activeCheckpoint.challengeQuestions ?? []).map((question) => (
                  <li
                    key={question.id}
                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-zinc-200"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.10] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                        {question.type}
                      </span>
                      <span className="text-[11px] text-zinc-400">{question.id}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-100">{question.prompt}</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
                      {question.rubric.map((line, lineIndex) => (
                        <li key={lineIndex} className="flex gap-1.5">
                          <span aria-hidden className="text-zinc-600">-</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
      {activeCheckpoint ? (
        <div className="mt-4 rounded-2xl border border-rose-400/10 bg-rose-400/[0.05] px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-rose-200/70">At-risk now</p>
              <p className="mt-2 text-sm text-zinc-100">
                {activeCheckpoint.title} is the active checkpoint for this slide range.
              </p>
              {activeInterventionPrompt ? (
                <p className="mt-2 text-sm text-zinc-300">
                  Suggested intervention: <span className="text-white">{activeInterventionPrompt.label}</span>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-zinc-300">
                {atRiskLearners.length > 0
                  ? trackCheckpointCompletion
                    ? `${atRiskLearners.length} learners are behind the deck and have not completed this checkpoint.`
                    : `${atRiskLearners.length} learners are behind the deck during this checkpoint.`
                  : trackCheckpointCompletion
                    ? "No learners currently match the behind-and-incomplete rule."
                    : "No learners currently match the behind-during-checkpoint rule."}
              </p>
            </div>
            {atRiskPrompt ? (
              <button
                type="button"
                className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/[0.16]"
                onClick={() => onNudge(atRiskPrompt)}
              >
                Broadcast targeted prompt
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-4 max-h-[28rem] overflow-y-auto pr-1">
        {learnerRoster.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {learnerRoster.map((entry) => {
              const activeCheckpointStatus = activeCheckpoint
                ? participantLabCheckpoints.find(
                    (item) => item.participant.id === entry.participant.id && item.labSlug === activeCheckpoint.slug,
                  )
                : null;
              const isAtRisk =
                Boolean(activeCheckpoint) &&
                (entry.band.lag ?? 0) > 0 &&
                (trackCheckpointCompletion ? activeCheckpointStatus?.status !== "completed" : true);

              return (
                <div
                  key={entry.participant.id}
                  className={`rounded-2xl border p-4 ${
                    isAtRisk ? "border-rose-400/20 bg-rose-400/[0.05]" : "border-white/8 bg-black/10"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium text-white">{entry.participant.fullName}</p>
                      <p className="mt-1 text-sm text-zinc-400">{entry.participant.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className={`rounded-full border px-3 py-1 text-xs font-medium ${entry.band.tone}`}>
                        {entry.band.label}
                      </div>
                      {isAtRisk && trackCheckpointCompletion ? (
                        <div className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-100">
                          Missing active checkpoint
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                      Slide: {typeof entry.slideIndex === "number" ? entry.slideIndex + 1 : "Not started"}
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                      Progress: {typeof entry.progressPercent === "number" ? `${entry.progressPercent}%` : "No data"}
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                      Behind: {typeof entry.band.lag === "number" ? `${entry.band.lag} slides` : "Unknown"}
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                      Status: {entry.participant.status}
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                      Last seen: {formatRelativeTime(entry.occurredAt ?? entry.participant.lastSeenAt ?? null)}
                    </div>
                  </div>
                  {evidenceSummary?.byParticipant?.[entry.participant.id] ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-sky-400/20 bg-sky-500/[0.08] px-3 py-1 text-sky-100">
                        {evidenceSummary.byParticipant[entry.participant.id].submissionCount} submission
                        {evidenceSummary.byParticipant[entry.participant.id].submissionCount === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-zinc-200">
                        {evidenceSummary.byParticipant[entry.participant.id].notesCount} note
                        {evidenceSummary.byParticipant[entry.participant.id].notesCount === 1 ? "" : "s"}
                      </span>
                      {evidenceSummary.byParticipant[entry.participant.id].sharedNotesCount > 0 ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-amber-100">
                          {evidenceSummary.byParticipant[entry.participant.id].sharedNotesCount} shared with you
                        </span>
                      ) : null}
                      {evidenceSummary.byParticipant[entry.participant.id].lastSubmissionAt ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-zinc-300">
                          Last submission {formatRelativeTime(evidenceSummary.byParticipant[entry.participant.id].lastSubmissionAt)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {(() => {
                    const beat = latestBeatForParticipant(
                      entry.participant.id,
                      activeCheckpoint?.slug ?? null,
                      evidenceSummary,
                    );
                    if (!beat) return null;
                    const display = BEAT_DISPLAY[beat.beat];
                    const challenge = beat.challengeQuestionId
                      ? activeCheckpoint?.challengeQuestions?.find((q) => q.id === beat.challengeQuestionId)
                      : null;
                    return (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className={`rounded-full border px-3 py-1 ${display.classes}`}>
                          {display.label}
                        </span>
                        {beat.submittedAt ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-zinc-300">
                            Last step update {formatRelativeTime(beat.submittedAt)}
                          </span>
                        ) : null}
                        {challenge ? (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-emerald-100">
                            Defend: {challenge.type}
                          </span>
                        ) : null}
                      </div>
                    );
                  })()}
                  {activeCheckpoint && trackCheckpointCompletion ? (
                    <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3 text-sm text-zinc-300">
                      Active checkpoint status:{" "}
                      <span className="font-medium text-white">
                        {activeCheckpointStatus?.status === "completed"
                          ? "Completed"
                          : activeCheckpointStatus?.status === "launched"
                            ? "In progress"
                            : "Not started"}
                      </span>
                    </div>
                  ) : null}
                  {typeof entry.slideIndex === "number" ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        onClick={() => onJumpToSlide({ command: "goToSlide", slideIndex: entry.slideIndex ?? 0 })}
                      >
                        Jump deck to learner slide
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-zinc-400">
            No participant slide positions yet. Ask learners to join the academy link and open this module deck.
          </div>
        )}
      </div>
    </div>
  );
}

function CheckpointsPanel({
  checkpointSummary,
  checkpointPromptsBySlug,
  trackCheckpointCompletion,
  learnerRoster,
  participantLabSummary,
  evidenceSummary,
  onNudge,
}: Pick<
  SecondaryProps,
  | "checkpointSummary"
  | "checkpointPromptsBySlug"
  | "trackCheckpointCompletion"
  | "learnerRoster"
  | "participantLabSummary"
  | "evidenceSummary"
  | "onNudge"
>) {
  if (checkpointSummary.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-zinc-400">
        This module has no lab checkpoints configured.
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-2">
        {checkpointSummary.map(({ checkpoint, completed, launched, notStarted }) => (
          <div key={checkpoint.slug} className="rounded-2xl border border-white/8 bg-black/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{checkpoint.title}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Slides {checkpoint.startSlide} to {checkpoint.endSlide}. {checkpoint.description}
                </p>
                {checkpointPromptsBySlug[checkpoint.slug] ? (
                  <p className="mt-2 text-sm text-zinc-300">
                    Prompt for this moment: <span className="text-white">{checkpointPromptsBySlug[checkpoint.slug]?.label}</span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-400/[0.16]"
                onClick={() =>
                  onNudge(
                    checkpointPromptsBySlug[checkpoint.slug]?.prompt ??
                      checkpoint.facilitatorPrompt,
                  )
                }
              >
                {trackCheckpointCompletion ? "Prompt incomplete learners" : "Broadcast checkpoint prompt"}
              </button>
            </div>
            {trackCheckpointCompletion ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-sm text-emerald-100">
                  Completed: {completed}
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2 text-sm text-amber-100">
                  In progress: {launched}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200">
                  Not started: {notStarted}
                </div>
              </div>
            ) : null}
            {evidenceSummary?.byCheckpoint?.[checkpoint.slug] ? (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-sky-400/20 bg-sky-500/[0.08] px-3 py-1 text-sky-100">
                  {evidenceSummary.byCheckpoint[checkpoint.slug].submissionCount} submission
                  {evidenceSummary.byCheckpoint[checkpoint.slug].submissionCount === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-zinc-200">
                  {evidenceSummary.byCheckpoint[checkpoint.slug].participantCount} participant
                  {evidenceSummary.byCheckpoint[checkpoint.slug].participantCount === 1 ? "" : "s"} with evidence
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-zinc-200">
                  {evidenceSummary.byCheckpoint[checkpoint.slug].notesCount} note
                  {evidenceSummary.byCheckpoint[checkpoint.slug].notesCount === 1 ? "" : "s"}
                </span>
                {evidenceSummary.byCheckpoint[checkpoint.slug].lastSubmissionAt ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-zinc-300">
                    Last submission {formatRelativeTime(evidenceSummary.byCheckpoint[checkpoint.slug].lastSubmissionAt)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {trackCheckpointCompletion ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {learnerRoster.map((entry) => {
            const summary = participantLabSummary.find((item) => item.participantId === entry.participant.id);
            return (
              <div key={`labs-${entry.participant.id}`} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{entry.participant.fullName}</p>
                    <p className="mt-1 text-sm text-zinc-400">{summary?.completedCount ?? 0} completed, {summary?.activeCount ?? 0} in progress</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
                    {summary?.pending?.[0]?.labTitle ? `Next risk: ${summary.pending[0].labTitle}` : "All checkpoints complete"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ReleasePanel({
  releaseModules,
  moduleUnlocks,
  setModuleRelease,
}: Pick<SecondaryProps, "releaseModules" | "moduleUnlocks" | "setModuleRelease">) {
  if (releaseModules.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-zinc-400">
        No later modules to release from this facilitator view.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {releaseModules.map((module) => {
        const isUnlocked = moduleUnlocks[module.slug] === true;
        return (
          <div key={module.slug} className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-zinc-300">
            <p className="font-medium text-white">
              {module.sequence}. {module.title}
            </p>
            <p className="mt-2 text-zinc-400">
              {isUnlocked ? "Released early for this cohort." : "Still locked behind prior module completion."}
            </p>
            <button
              type="button"
              className={`mt-4 rounded-full border px-4 py-2 text-sm transition ${
                isUnlocked
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                  : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              }`}
              onClick={() => setModuleRelease(module.slug, !isUnlocked)}
            >
              {isUnlocked ? "Re-lock module" : "Unlock module"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function NavigatorPanel({
  slides,
  deckState,
  onJumpToSlide,
}: Pick<SecondaryProps, "slides" | "deckState" | "onJumpToSlide">) {
  return (
    <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
      {slides.map((slide) => {
        const isActive = slide.id === deckState?.slideId;
        return (
          <button
            key={slide.id}
            type="button"
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              isActive
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/8 bg-black/10 text-zinc-300 hover:border-white/16 hover:bg-white/[0.04]"
            }`}
            onClick={() => onJumpToSlide({ command: "goToSlide", slideId: slide.id })}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              {slide.index + 1}. {slide.eyebrow || slide.id}
            </p>
            <p className="mt-1 text-sm font-medium">{slide.title}</p>
          </button>
        );
      })}
    </div>
  );
}

function SegmentsPanel({ noteBlocks, onJumpToSlide }: Pick<SecondaryProps, "noteBlocks" | "onJumpToSlide">) {
  return (
    <div className="grid gap-3">
      {noteBlocks.map((block) => (
        <button
          key={`${block.start}-${block.end}`}
          type="button"
          className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-white/16 hover:bg-white/[0.04]"
          onClick={() => onJumpToSlide({ command: "goToSlide", slideIndex: block.start - 1 })}
        >
          <p className="font-medium text-white">
            Slides {block.start} to {block.end}
          </p>
          <p className="mt-1 text-zinc-400">{block.label}</p>
          <p className="mt-2 text-zinc-500">{block.objective}</p>
        </button>
      ))}
    </div>
  );
}

function OperatorTabset(props: SecondaryProps & {
  activeTab: "roster" | "checkpoints" | "release" | "navigator" | "segments";
  onTabChange: (tab: "roster" | "checkpoints" | "release" | "navigator" | "segments") => void;
}) {
  const tabs: Array<{ id: typeof props.activeTab; label: string }> = [
    { id: "roster", label: "Roster" },
    { id: "checkpoints", label: "Checkpoints" },
    { id: "release", label: "Module release" },
    { id: "navigator", label: "Slide navigator" },
    { id: "segments", label: "Segment map" },
  ];

  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/8 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              props.activeTab === tab.id
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/10 bg-black/10 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
            onClick={() => props.onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {props.activeTab === "roster" ? (
          <RosterPanel
            learnerRoster={props.learnerRoster}
            rosterSummary={props.rosterSummary}
            activeCheckpoint={props.activeCheckpoint}
            activeInterventionPrompt={props.activeInterventionPrompt}
            atRiskLearners={props.atRiskLearners}
            atRiskPrompt={props.atRiskPrompt}
            trackCheckpointCompletion={props.trackCheckpointCompletion}
            participantLabCheckpoints={props.participantLabCheckpoints}
            evidenceSummary={props.evidenceSummary}
            onJumpToSlide={props.onJumpToSlide}
            onNudge={props.onNudge}
          />
        ) : null}
        {props.activeTab === "checkpoints" ? (
          <CheckpointsPanel
            checkpointSummary={props.checkpointSummary}
            checkpointPromptsBySlug={props.checkpointPromptsBySlug}
            trackCheckpointCompletion={props.trackCheckpointCompletion}
            learnerRoster={props.learnerRoster}
            participantLabSummary={props.participantLabSummary}
            evidenceSummary={props.evidenceSummary}
            onNudge={props.onNudge}
          />
        ) : null}
        {props.activeTab === "release" ? (
          <ReleasePanel
            releaseModules={props.releaseModules}
            moduleUnlocks={props.moduleUnlocks}
            setModuleRelease={props.setModuleRelease}
          />
        ) : null}
        {props.activeTab === "navigator" ? (
          <NavigatorPanel slides={props.slides} deckState={props.deckState} onJumpToSlide={props.onJumpToSlide} />
        ) : null}
        {props.activeTab === "segments" ? (
          <SegmentsPanel noteBlocks={props.noteBlocks} onJumpToSlide={props.onJumpToSlide} />
        ) : null}
      </div>
    </div>
  );
}

function LegacyOperatorPanels(props: SecondaryProps) {
  return (
    <>
      <RosterPanelWrapper {...props} />
      {props.checkpointSummary.length > 0 ? <CheckpointsPanelWrapper {...props} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)_minmax(420px,1.2fr)]">
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Slide navigator</p>
          <div className="mt-4">
            <NavigatorPanel slides={props.slides} deckState={props.deckState} onJumpToSlide={props.onJumpToSlide} />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Module release controls</p>
          <p className="mt-2 text-sm text-zinc-400">
            Participants can only open the next module after completion unless you release it early for this cohort.
          </p>
          <div className="mt-4">
            <ReleasePanel
              releaseModules={props.releaseModules}
              moduleUnlocks={props.moduleUnlocks}
              setModuleRelease={props.setModuleRelease}
            />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Guide blocks</p>
          <div className="mt-4">
            <SegmentsPanel noteBlocks={props.noteBlocks} onJumpToSlide={props.onJumpToSlide} />
          </div>
        </div>
      </div>
    </>
  );
}

function RosterPanelWrapper(props: SecondaryProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Learner slide positions</p>
          <p className="mt-2 text-sm text-zinc-400">Full cohort view across the current teaching moment.</p>
        </div>
      </div>
      <div className="mt-4">
        <RosterPanel
          learnerRoster={props.learnerRoster}
          rosterSummary={props.rosterSummary}
          activeCheckpoint={props.activeCheckpoint}
          activeInterventionPrompt={props.activeInterventionPrompt}
          atRiskLearners={props.atRiskLearners}
          atRiskPrompt={props.atRiskPrompt}
          trackCheckpointCompletion={props.trackCheckpointCompletion}
          participantLabCheckpoints={props.participantLabCheckpoints}
          evidenceSummary={props.evidenceSummary}
          onJumpToSlide={props.onJumpToSlide}
          onNudge={props.onNudge}
        />
      </div>
    </div>
  );
}

function CheckpointsPanelWrapper(props: SecondaryProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            {props.trackCheckpointCompletion ? "Lab checkpoint completion" : "Checkpoint intervention planner"}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {props.trackCheckpointCompletion
              ? "See who has started or completed each checkpoint, then nudge the cohort directly from the console."
              : "Use slide-specific checkpoint prompts to steer the room through each teaching moment."}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <CheckpointsPanel
          checkpointSummary={props.checkpointSummary}
          checkpointPromptsBySlug={props.checkpointPromptsBySlug}
          trackCheckpointCompletion={props.trackCheckpointCompletion}
          learnerRoster={props.learnerRoster}
          participantLabSummary={props.participantLabSummary}
          evidenceSummary={props.evidenceSummary}
          onNudge={props.onNudge}
        />
      </div>
    </div>
  );
}

type PresenterLayoutProps = {
  deckHref: string;
  deckTitle: string;
  deckIframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  slideNumber: number | null;
  totalSlides: number | null;
  deckState: DeckState | null;
  scriptView: ScriptView;
  currentNote: FacilitatorNoteBlockShape;
  moduleTitle: string;
  cohortSnapshots: CohortSnapshot[];
  selectedInviteCode: string;
  onSelectInviteCode: (code: string) => void;
  broadcastEnabled: boolean;
  onToggleBroadcast: () => void;
  lockToFacilitator: boolean;
  onToggleLock: () => void;
  onClearPrompt: () => void;
  atRiskPrompt: string | null;
  onPromptAtRisk: () => void;
  onCatchUpPrompt: () => void;
  activeChip: "ask" | "watch" | "do" | null;
  setActiveChip: (chip: "ask" | "watch" | "do" | null) => void;
  questions: string[];
  syncMessage: string | null;
  onSwitchToOperator: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClearTimer: () => void;
};

function PresenterLayout({
  deckHref,
  deckTitle,
  deckIframeRef,
  slideNumber,
  totalSlides,
  deckState,
  scriptView,
  currentNote,
  moduleTitle,
  cohortSnapshots,
  selectedInviteCode,
  onSelectInviteCode,
  broadcastEnabled,
  onToggleBroadcast,
  lockToFacilitator,
  onToggleLock,
  onClearPrompt,
  atRiskPrompt,
  onPromptAtRisk,
  onCatchUpPrompt,
  activeChip,
  setActiveChip,
  questions,
  syncMessage,
  onSwitchToOperator,
  onPrev,
  onNext,
  onClearTimer,
}: PresenterLayoutProps) {
  const askThis = scriptView.askThis && scriptView.askThis.length > 0 ? scriptView.askThis : questions;
  const watchFor = scriptView.watchFor ?? [];
  const doThis = scriptView.doThis ?? [];

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-black/40 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:border-white/8 sm:bg-black/30">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white">
            Slide {slideNumber ?? "—"} of {totalSlides ?? "—"}
          </div>
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">{currentNote.label}</div>
          {syncMessage ? <div className="text-xs text-zinc-500">{syncMessage}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={onPrev}
          >
            ← Prev
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={onNext}
          >
            Next →
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              broadcastEnabled
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.05]"
            }`}
            onClick={onToggleBroadcast}
          >
            {broadcastEnabled ? "Broadcast on" : "Broadcast off"}
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              lockToFacilitator
                ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.05]"
            }`}
            onClick={onToggleLock}
          >
            {lockToFacilitator ? "Unlock" : "Lock"}
          </button>
          <select
            value={selectedInviteCode}
            onChange={(event) => onSelectInviteCode(event.target.value)}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white"
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
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={onCatchUpPrompt}
          >
            Catch-up
          </button>
          {atRiskPrompt ? (
            <button
              type="button"
              className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100 transition hover:border-rose-400/40"
              onClick={onPromptAtRisk}
            >
              Prompt at-risk
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={onClearPrompt}
          >
            Clear prompt
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={onClearTimer}
          >
            Clear timer
          </button>
          <button
            type="button"
            className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-100 transition hover:border-sky-400/40"
            onClick={onSwitchToOperator}
          >
            Operator mode
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.85fr)]">
        <article className="flex flex-col rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <header className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{deckState?.eyebrow ?? moduleTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{deckState?.title ?? "Loading…"}</h1>
            {scriptView.coreMessage ? (
              <p className="mt-4 max-w-[68ch] text-lg font-semibold leading-8 text-white/95">
                {scriptView.coreMessage}
              </p>
            ) : null}
            {scriptView.showThis ? (
              <p className="mt-3 max-w-[68ch] text-sm uppercase tracking-[0.18em] text-zinc-400">
                Show this · <span className="normal-case tracking-normal text-zinc-300">{scriptView.showThis}</span>
              </p>
            ) : null}
          </header>

          <section className="space-y-6 text-zinc-100" aria-label="Say this">
            {scriptView.sayThis.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 12)}`}
                className="max-w-[68ch] text-lg leading-8"
              >
                {paragraph}
              </p>
            ))}
          </section>

          {scriptView.landThePoint ? (
            <section
              className="mt-8 max-w-[68ch] rounded-2xl border-l-4 border-emerald-400/60 bg-emerald-400/[0.06] px-5 py-4"
              aria-label="Land the point"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">Land the point</p>
              <p className="mt-2 text-lg leading-8 text-white">{scriptView.landThePoint}</p>
            </section>
          ) : null}

          {scriptView.transition ? (
            <p className="mt-6 max-w-[68ch] text-sm italic text-zinc-400">Transition: {scriptView.transition}</p>
          ) : null}

          <div className="mt-auto pt-8" />
        </article>

        <aside className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/8 px-4 py-2 text-xs uppercase tracking-[0.22em] text-zinc-400">
              What the room sees
            </div>
            <div className="relative h-[260px] overflow-hidden bg-black sm:h-[320px]">
              <iframe
                ref={deckIframeRef}
                src={deckHref}
                title={deckTitle}
                className="absolute left-0 top-0 h-[800px] w-[1280px] origin-top-left scale-[0.32] border-0 sm:scale-[0.36]"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-zinc-300">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Segment focus</p>
            <p className="mt-2 text-zinc-200">{currentNote.objective}</p>
          </div>
          {scriptView.presenterCues && scriptView.presenterCues.length > 0 ? (
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs text-amber-100/90">
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">Slide cues</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-amber-50/90">
                {scriptView.presenterCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs text-zinc-500">
            Shortcuts: <span className="text-zinc-300">j</span>/
            <span className="text-zinc-300">k</span> next/prev,{" "}
            <span className="text-zinc-300">space</span> broadcast,{" "}
            <span className="text-zinc-300">o</span> operator mode,{" "}
            <span className="text-zinc-300">g</span> slide navigator
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/8 bg-black/55 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:border-white/8 sm:bg-black/35">
        <div className="flex flex-wrap items-center gap-2">
          <ChipButton
            label={`Ask the room (${askThis.length})`}
            tone="emerald"
            active={activeChip === "ask"}
            onClick={() => setActiveChip(activeChip === "ask" ? null : "ask")}
            disabled={askThis.length === 0}
          />
          <ChipButton
            label={`Watch for (${watchFor.length})`}
            tone="amber"
            active={activeChip === "watch"}
            onClick={() => setActiveChip(activeChip === "watch" ? null : "watch")}
            disabled={watchFor.length === 0}
          />
          <ChipButton
            label={`Do this (${doThis.length})`}
            tone="sky"
            active={activeChip === "do"}
            onClick={() => setActiveChip(activeChip === "do" ? null : "do")}
            disabled={doThis.length === 0}
          />
          {scriptView.estMinutes ? (
            <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
              Approx {scriptView.estMinutes} min
            </span>
          ) : null}
        </div>
        {activeChip === "ask" ? <ChipContent items={askThis} tone="emerald" /> : null}
        {activeChip === "watch" ? <ChipContent items={watchFor} tone="amber" /> : null}
        {activeChip === "do" ? <ChipContent items={doThis} tone="sky" /> : null}
      </div>
    </div>
  );
}

function ChipButton({
  label,
  tone,
  active,
  disabled,
  onClick,
}: {
  label: string;
  tone: "emerald" | "amber" | "sky";
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    emerald: active ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100" : "border-emerald-400/20 text-emerald-100/80",
    amber: active ? "border-amber-400/40 bg-amber-400/15 text-amber-100" : "border-amber-400/20 text-amber-100/80",
    sky: active ? "border-sky-400/40 bg-sky-400/15 text-sky-100" : "border-sky-400/20 text-sky-100/80",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {label}
    </button>
  );
}

function ChipContent({ items, tone }: { items: string[]; tone: "emerald" | "amber" | "sky" }) {
  const toneClass = {
    emerald: "border-emerald-400/20 bg-emerald-400/[0.05]",
    amber: "border-amber-400/20 bg-amber-400/[0.05]",
    sky: "border-sky-400/20 bg-sky-400/[0.05]",
  }[tone];
  return (
    <div className={`mt-3 grid gap-2 rounded-2xl border ${toneClass} px-4 py-3 text-sm leading-7 text-zinc-100`}>
      {items.map((item, index) => (
        <p key={`${index}-${item.slice(0, 16)}`}>{item}</p>
      ))}
    </div>
  );
}
