"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingParticipantRecord,
} from "@/types";
import { ajbTrainingProgramme } from "@/lib/training";
import { resolveCheckpointInterventionPrompt, type TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";

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

export type FacilitatorNoteBlockShape = {
  start: number;
  end: number;
  label: string;
  objective: string;
  talkTrack: string[];
  facilitationMoves: string[];
  debrief?: string[];
};

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
  getSlideScript: (slideIndex: number, title?: string, eyebrow?: string) => string[];
  getQuestions: (slideIndex: number, title?: string, eyebrow?: string) => string[];
};

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
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeNotesTab, setActiveNotesTab] = useState<"guide" | "script">("guide");
  const currentSlideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null;

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
  const currentSlideScript = useMemo(
    () => getSlideScript(currentSlideIndex ?? 0, deckState?.title, deckState?.eyebrow),
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

  useEffect(() => {
    if (!selectedInviteCode) return;

    let cancelled = false;
    async function pollLiveState() {
      const response = await fetch(
        `/api/training/live-state?inviteCode=${encodeURIComponent(selectedInviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`,
        { cache: "no-store" },
      );
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as {
        data?: {
          liveSession?: { broadcastEnabled?: boolean; metadata?: { lockToFacilitator?: boolean; facilitatorPrompt?: string | null } };
          participantPositions?: ParticipantPosition[];
          participantLabCheckpoints?: TrainingParticipantLabCheckpointRecord[];
        };
      };
      if (cancelled) return;
      setParticipantPositions(payload.data?.participantPositions ?? []);
      setParticipantLabCheckpoints(payload.data?.participantLabCheckpoints ?? []);
      if (typeof payload.data?.liveSession?.broadcastEnabled === "boolean") {
        setBroadcastEnabled(payload.data.liveSession.broadcastEnabled);
      }
      if (typeof payload.data?.liveSession?.metadata?.lockToFacilitator === "boolean") {
        setLockToFacilitator(payload.data.liveSession.metadata.lockToFacilitator);
      }
      if (
        typeof payload.data?.liveSession?.metadata?.facilitatorPrompt === "string" ||
        payload.data?.liveSession?.metadata?.facilitatorPrompt === null
      ) {
        setFacilitatorPrompt(payload.data.liveSession.metadata.facilitatorPrompt ?? null);
      }

      const moduleAccessResponse = await fetch(
        `/api/training/module-access?inviteCode=${encodeURIComponent(selectedInviteCode)}`,
        { cache: "no-store" },
      );
      if (!moduleAccessResponse.ok || cancelled) return;
      const moduleAccessPayload = (await moduleAccessResponse.json()) as ModuleAccessResponse;
      if (cancelled) return;
      setModuleUnlocks(moduleAccessPayload.data?.unlocks ?? {});
    }

    pollLiveState();
    const interval = window.setInterval(pollLiveState, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [moduleSlug, selectedInviteCode]);

  useEffect(() => {
    if (!deckState || !selectedInviteCode) return;

    let cancelled = false;
    const nextDeckState = deckState;
    async function publishLiveState() {
      const response = await fetch("/api/training/live-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: selectedInviteCode,
          moduleSlug,
          currentSlideId: nextDeckState.slideId,
          currentSlideIndex: nextDeckState.slideIndex,
          broadcastEnabled,
          lockToFacilitator,
          facilitatorPrompt,
        }),
      });

      if (cancelled || !response.ok) return;
      setSyncMessage(
        broadcastEnabled
          ? `Broadcasting slide ${nextDeckState.slideIndex + 1} to ${selectedInviteCode}`
          : "Broadcast paused. Learners can keep moving independently.",
      );
    }

    publishLiveState();
    return () => {
      cancelled = true;
    };
  }, [broadcastEnabled, deckState, facilitatorPrompt, lockToFacilitator, moduleSlug, selectedInviteCode]);

  function nudgeLearners(message: string) {
    setFacilitatorPrompt(message);
    setSyncMessage(message);
  }

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
                onClick={() => sendDeckCommand(iframeRef.current, { command: "prev" })}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                onClick={() => sendDeckCommand(iframeRef.current, { command: "next" })}
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
                </>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Word-for-word delivery script</p>
                  <div className="mt-2 space-y-3">
                    {currentSlideScript.map((line, index) => (
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

      <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Learner slide positions</p>
            <p className="mt-2 text-sm text-zinc-400">Full cohort view across the current teaching moment.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                  onClick={() => nudgeLearners(atRiskPrompt)}
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
                          onClick={() =>
                            sendDeckCommand(iframeRef.current, { command: "goToSlide", slideIndex: entry.slideIndex ?? 0 })
                          }
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

      {labCheckpoints.length > 0 ? (
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                {trackCheckpointCompletion ? "Lab checkpoint completion" : "Checkpoint intervention planner"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {trackCheckpointCompletion
                  ? "See who has started or completed each checkpoint, then nudge the cohort directly from the console."
                  : "Use slide-specific checkpoint prompts to steer the room through each teaching moment."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
                      nudgeLearners(
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
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)_minmax(420px,1.2fr)]">
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Slide navigator</p>
          <div className="mt-4 max-h-[24rem] space-y-2 overflow-y-auto pr-1">
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
                  onClick={() => sendDeckCommand(iframeRef.current, { command: "goToSlide", slideId: slide.id })}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{slide.eyebrow || slide.id}</p>
                  <p className="mt-1 text-sm font-medium">{slide.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Module release controls</p>
          <p className="mt-2 text-sm text-zinc-400">
            Participants can only open the next module after completion unless you release it early for this cohort.
          </p>
          <div className="mt-4 grid gap-3">
            {releaseModules.length > 0 ? (
              releaseModules.map((module) => {
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
              })
            ) : (
              <div className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm text-zinc-400">
                No later modules to release from this facilitator view.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Guide blocks</p>
          <div className="mt-4 grid gap-3">
            {noteBlocks.map((block) => (
              <button
                key={`${block.start}-${block.end}`}
                type="button"
                className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-white/16 hover:bg-white/[0.04]"
                onClick={() => sendDeckCommand(iframeRef.current, { command: "goToSlide", slideIndex: block.start - 1 })}
              >
                <p className="font-medium text-white">
                  Slides {block.start} to {block.end}
                </p>
                <p className="mt-1 text-zinc-400">{block.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
