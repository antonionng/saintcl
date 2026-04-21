"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ParticipantNotes } from "@/components/training/participant-notes";
import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import {
  isWorkbenchTask,
  resolveCheckpointInterventionPrompt,
  type TrainingLabCheckpoint,
  type TrainingLabCheckpointTask,
  type WorkbenchEvidenceKind,
  type WorkbenchTask,
} from "@/lib/training-lab-checkpoints";
import type {
  TrainingParticipantLabCheckpointRecord,
  TrainingScope,
  TrainingSubmissionKind,
  TrainingSubmissionRecord,
} from "@/types";

export type WorkbenchActiveTask = WorkbenchTask & {
  checkpointSlug: string;
};

type LabStatus = {
  status: "not_started" | "launched" | "completed";
  launchedAt: string | null;
  completedAt: string | null;
};

type EvidenceSlot = {
  kind: WorkbenchEvidenceKind;
  label: string;
  helperText?: string;
  submissionKind?: TrainingSubmissionKind | null;
};

type ParticipantWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  workbenchEyebrow: string;
  workbenchTitle: string;
  workbenchSubtitle?: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions?: TrainingSubmissionRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
  // Optional renderer for the active task work area. Specialized workbenches
  // (SQL editor, model card, viz canvas, etc) plug in through this slot.
  renderTaskWorkArea?: (context: {
    checkpoint: TrainingLabCheckpoint;
    task: WorkbenchActiveTask | null;
  }) => ReactNode;
};

const EVIDENCE_SLOT_BY_KIND: Record<WorkbenchEvidenceKind, EvidenceSlot> = {
  notes: {
    kind: "notes",
    label: "Notes",
    helperText: "Captured automatically below in the notes panel.",
    submissionKind: null,
  },
  artifact_link: {
    kind: "artifact_link",
    label: "Artifact link",
    helperText: "Paste a link to your work (Drive, Notion, GitHub, dashboard).",
    submissionKind: "artifact_link",
  },
  file_upload: {
    kind: "file_upload",
    label: "File reference",
    helperText: "Reference an uploaded file or attachment ID for this checkpoint.",
    submissionKind: "file_upload",
  },
  workbench_state: {
    kind: "workbench_state",
    label: "Workbench state",
    helperText: "A snapshot of the workbench is captured automatically when you submit.",
    submissionKind: "workbench_state",
  },
};

function describeStatus(status: LabStatus["status"]) {
  if (status === "completed") return "Completed";
  if (status === "launched") return "In progress";
  return "Not started";
}

function statusTone(status: LabStatus["status"]) {
  if (status === "completed") return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100";
  if (status === "launched") return "border-amber-400/20 bg-amber-400/[0.06] text-amber-100";
  return "border-white/8 bg-white/[0.02] text-zinc-200";
}

function pickWorkbenchTask(tasks: TrainingLabCheckpointTask[] | undefined): WorkbenchActiveTask | null {
  if (!tasks || tasks.length === 0) return null;
  for (const task of tasks) {
    if (isWorkbenchTask(task)) {
      return task as WorkbenchActiveTask;
    }
  }
  return null;
}

export function ParticipantWorkbench({
  inviteCode,
  moduleSlug,
  moduleTitle,
  workbenchEyebrow,
  workbenchTitle,
  workbenchSubtitle,
  labCheckpoints,
  initialLabProgress,
  initialSubmissions = [],
  deckState = null,
  facilitatorPrompt = null,
  renderTaskWorkArea,
}: ParticipantWorkbenchProps) {
  const currentSlideIndex = typeof deckState?.slideIndex === "number" ? deckState.slideIndex : null;

  const [activeCheckpointSlug, setActiveCheckpointSlug] = useState<string>(labCheckpoints[0]?.slug ?? "");
  const [labStatusOverridesBySlug, setLabStatusOverridesBySlug] = useState<Record<string, LabStatus>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<TrainingSubmissionRecord[]>(initialSubmissions);

  // Keep submissions in sync if upstream pushes a new initial set.
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

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
            },
          ];
        }),
      ) as Record<string, LabStatus>,
    [initialLabProgress, labCheckpoints, labStatusOverridesBySlug],
  );

  const completedCheckpointCount = useMemo(
    () => Object.values(labStatusBySlug).filter((entry) => entry.status === "completed").length,
    [labStatusBySlug],
  );

  // Auto-follow facilitator slide changes when the participant has not picked a
  // checkpoint manually (or the picked one has no slide overlap right now).
  const slideAlignedCheckpoint = useMemo(() => {
    if (currentSlideIndex === null) return null;
    const slideNumber = currentSlideIndex + 1;
    return (
      labCheckpoints.find(
        (checkpoint) => slideNumber >= checkpoint.startSlide && slideNumber <= checkpoint.endSlide,
      ) ?? null
    );
  }, [labCheckpoints, currentSlideIndex]);

  const lastFollowedSlideRef = useRef<number | null>(null);
  useEffect(() => {
    if (!slideAlignedCheckpoint) return;
    if (currentSlideIndex === lastFollowedSlideRef.current) return;
    lastFollowedSlideRef.current = currentSlideIndex;
    setActiveCheckpointSlug(slideAlignedCheckpoint.slug);
  }, [slideAlignedCheckpoint, currentSlideIndex]);

  const activeCheckpoint = useMemo(
    () => labCheckpoints.find((checkpoint) => checkpoint.slug === activeCheckpointSlug) ?? labCheckpoints[0] ?? null,
    [activeCheckpointSlug, labCheckpoints],
  );

  const activeWorkbenchTask = useMemo(
    () => pickWorkbenchTask(activeCheckpoint?.tasks),
    [activeCheckpoint],
  );

  const activeStatus = activeCheckpoint ? labStatusBySlug[activeCheckpoint.slug] : null;

  const intervention = useMemo(() => {
    if (!activeCheckpoint || currentSlideIndex === null) return null;
    return resolveCheckpointInterventionPrompt(activeCheckpoint, currentSlideIndex + 1);
  }, [activeCheckpoint, currentSlideIndex]);

  const sendLabCheckpointEvent = useCallback(
    async (checkpoint: TrainingLabCheckpoint, eventType: "lab_launched" | "lab_completed") => {
      const completedCount = labCheckpoints.filter((entry) => {
        if (entry.slug === checkpoint.slug) return eventType === "lab_completed";
        return labStatusBySlug[entry.slug]?.status === "completed";
      }).length;
      const launchedCount = labCheckpoints.filter((entry) => {
        if (entry.slug === checkpoint.slug) return eventType === "lab_launched";
        return labStatusBySlug[entry.slug]?.status === "launched";
      }).length;
      const progressPercent = labCheckpoints.length
        ? Math.max(5, Math.min(100, Math.round(((completedCount + launchedCount * 0.5) / labCheckpoints.length) * 100)))
        : null;

      const response = await fetch("/api/training/participant/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          eventType,
          progressPercent,
          metadata: {
            labSlug: checkpoint.slug,
            labTitle: checkpoint.title,
            workbench: workbenchEyebrow,
          },
        }),
      }).catch(() => null);

      if (!response?.ok) {
        setActionMessage("We could not record that checkpoint update. Please try again.");
        return;
      }

      const now = new Date().toISOString();
      setLabStatusOverridesBySlug((current) => {
        const previous = current[checkpoint.slug];
        return {
          ...current,
          [checkpoint.slug]: {
            status: eventType === "lab_completed" ? "completed" : "launched",
            launchedAt: eventType === "lab_launched" ? now : previous?.launchedAt ?? now,
            completedAt: eventType === "lab_completed" ? now : previous?.completedAt ?? null,
          },
        };
      });
      setActionMessage(
        eventType === "lab_completed"
          ? `${checkpoint.title} marked complete. Your facilitator can now see this evidence.`
          : `${checkpoint.title} started. Stay in this workbench until you are ready to mark it complete.`,
      );
    },
    [inviteCode, moduleSlug, labCheckpoints, labStatusBySlug, workbenchEyebrow],
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            {workbenchEyebrow}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">{moduleTitle}</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
            {completedCheckpointCount}/{labCheckpoints.length} checkpoints complete
          </span>
          {currentSlideIndex !== null ? (
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
              Slide {currentSlideIndex + 1}
            </span>
          ) : null}
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{workbenchTitle}</p>
        {workbenchSubtitle ? (
          <p className="mt-2 text-sm text-zinc-300">{workbenchSubtitle}</p>
        ) : null}
      </div>

      {facilitatorPrompt ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">Facilitator prompt</p>
          <p className="mt-2">{facilitatorPrompt}</p>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Progress update</p>
          <p className="mt-2">{actionMessage}</p>
        </div>
      ) : null}

      {labCheckpoints.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-6 text-sm text-zinc-300">
          Workbench tasks for this module are not configured yet. Use the workbook tab while we wire them in.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <CheckpointRail
            checkpoints={labCheckpoints}
            statusBySlug={labStatusBySlug}
            activeSlug={activeCheckpoint?.slug ?? ""}
            onSelect={setActiveCheckpointSlug}
          />

          {activeCheckpoint ? (
            <ActiveCheckpointPanel
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              checkpoint={activeCheckpoint}
              task={activeWorkbenchTask}
              status={activeStatus}
              currentSlideIndex={currentSlideIndex}
              intervention={intervention}
              submissions={submissions}
              onSubmissionCreated={(submission) =>
                setSubmissions((current) => {
                  const next = current.filter((entry) => entry.id !== submission.id);
                  next.unshift(submission);
                  return next;
                })
              }
              onLaunch={() => void sendLabCheckpointEvent(activeCheckpoint, "lab_launched")}
              onComplete={() => void sendLabCheckpointEvent(activeCheckpoint, "lab_completed")}
              renderTaskWorkArea={renderTaskWorkArea}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CheckpointRail({
  checkpoints,
  statusBySlug,
  activeSlug,
  onSelect,
}: {
  checkpoints: TrainingLabCheckpoint[];
  statusBySlug: Record<string, LabStatus>;
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/8 bg-black/15 p-3">
      <p className="px-2 pt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Checkpoints</p>
      <div className="space-y-2">
        {checkpoints.map((checkpoint) => {
          const status = statusBySlug[checkpoint.slug]?.status ?? "not_started";
          const isActive = checkpoint.slug === activeSlug;
          return (
            <button
              key={checkpoint.slug}
              type="button"
              onClick={() => onSelect(checkpoint.slug)}
              className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-100"
                  : "border-white/8 bg-white/[0.02] text-zinc-200 hover:border-white/16 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Slides {checkpoint.startSlide}-{checkpoint.endSlide}
                  </p>
                  <p className="mt-1 truncate font-medium">{checkpoint.title}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${statusTone(status)}`}>
                  {describeStatus(status)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveCheckpointPanel({
  inviteCode,
  moduleSlug,
  checkpoint,
  task,
  status,
  currentSlideIndex,
  intervention,
  submissions,
  onSubmissionCreated,
  onLaunch,
  onComplete,
  renderTaskWorkArea,
}: {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
  status: LabStatus | null;
  currentSlideIndex: number | null;
  intervention: ReturnType<typeof resolveCheckpointInterventionPrompt>;
  submissions: TrainingSubmissionRecord[];
  onSubmissionCreated: (submission: TrainingSubmissionRecord) => void;
  onLaunch: () => void;
  onComplete: () => void;
  renderTaskWorkArea?: ParticipantWorkbenchProps["renderTaskWorkArea"];
}) {
  const taskScope: TrainingScope = task ? "task" : "checkpoint";
  const taskScopeId = task ? task.id : checkpoint.slug;

  const evidenceKinds = task?.evidenceKinds ?? ["notes", "artifact_link"];
  const evidenceSlots = evidenceKinds.map((kind) => EVIDENCE_SLOT_BY_KIND[kind]);

  const scopedSubmissions = submissions.filter(
    (submission) =>
      (submission.scope === "task" && submission.scopeId === task?.id) ||
      (submission.scope === "checkpoint" && submission.scopeId === checkpoint.slug),
  );

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-black/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Slides {checkpoint.startSlide}-{checkpoint.endSlide}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">{checkpoint.title}</h3>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">{checkpoint.description}</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs ${statusTone(status?.status ?? "not_started")}`}>
          {describeStatus(status?.status ?? "not_started")}
        </div>
      </div>

      {intervention ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] px-4 py-3 text-sm text-sky-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/70">Focus right now</p>
          <p className="mt-1">{intervention.label}: {intervention.prompt}</p>
        </div>
      ) : null}

      {task ? (
        <section className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <header>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Task brief</p>
            <h4 className="mt-1 text-base font-semibold text-white">{task.title}</h4>
          </header>
          <p className="text-sm text-zinc-300">{task.prompt}</p>
          {task.successCriteria.length > 0 ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">What good looks like</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                {task.successCriteria.map((criterion) => (
                  <li key={criterion} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {renderTaskWorkArea ? (
        <section className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
          <header>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Workspace</p>
          </header>
          {renderTaskWorkArea({ checkpoint, task })}
        </section>
      ) : null}

      <EvidencePanel
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        checkpoint={checkpoint}
        task={task}
        slots={evidenceSlots}
        submissions={scopedSubmissions}
        onSubmissionCreated={onSubmissionCreated}
      />

      <ParticipantNotes
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        scope={taskScope}
        scopeId={taskScopeId}
        label={task ? `Notes for ${task.title}` : `Notes for ${checkpoint.title}`}
        placeholder="Capture decisions, blockers, and questions for this checkpoint."
        compact
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
        <div className="text-[11px] text-zinc-500">
          {currentSlideIndex !== null ? `Following slide ${currentSlideIndex + 1}` : "Self-paced"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLaunch}
            className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-4 py-2 text-sm text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/[0.12]"
          >
            Start checkpoint
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.12]"
          >
            Mark complete
          </button>
        </div>
      </footer>
    </div>
  );
}

function EvidencePanel({
  inviteCode,
  moduleSlug,
  checkpoint,
  task,
  slots,
  submissions,
  onSubmissionCreated,
}: {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
  slots: EvidenceSlot[];
  submissions: TrainingSubmissionRecord[];
  onSubmissionCreated: (submission: TrainingSubmissionRecord) => void;
}) {
  const submittableSlots = slots.filter((slot) => slot.submissionKind);

  return (
    <section className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Evidence</p>
          <p className="mt-1 text-sm text-zinc-300">
            Attach the work you produced so your facilitator can score against the rubric.
          </p>
        </div>
      </header>

      {submittableSlots.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {submittableSlots.map((slot) => (
            <EvidenceSlotForm
              key={slot.kind}
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              checkpoint={checkpoint}
              task={task}
              slot={slot}
              onSubmissionCreated={onSubmissionCreated}
            />
          ))}
        </div>
      ) : null}

      <SubmissionList submissions={submissions} />
    </section>
  );
}

function EvidenceSlotForm({
  inviteCode,
  moduleSlug,
  checkpoint,
  task,
  slot,
  onSubmissionCreated,
}: {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
  slot: EvidenceSlot;
  onSubmissionCreated: (submission: TrainingSubmissionRecord) => void;
}) {
  const [artifactUrl, setArtifactUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!summary.trim() && !artifactUrl.trim()) return;
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary: summary.trim() || null,
          artifactUrl: artifactUrl.trim() || null,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: slot.submissionKind,
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            evidenceKind: slot.kind,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save evidence.");
      }
      const payload = (await response.json()) as { data?: TrainingSubmissionRecord };
      if (payload.data) {
        onSubmissionCreated(payload.data);
      }
      setStatus("saved");
      setSummary("");
      setArtifactUrl("");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save evidence.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-2xl border border-white/8 bg-black/15 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{slot.label}</p>
        <span
          className={`text-[10px] font-medium ${
            status === "error" ? "text-rose-300" : status === "saving" ? "text-zinc-400" : "text-emerald-300"
          }`}
        >
          {status === "saving"
            ? "Saving..."
            : status === "saved"
              ? "Saved"
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Ready"}
        </span>
      </div>
      {slot.helperText ? <p className="text-[11px] text-zinc-500">{slot.helperText}</p> : null}
      {slot.kind === "artifact_link" ? (
        <input
          type="url"
          value={artifactUrl}
          onChange={(event) => setArtifactUrl(event.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      ) : null}
      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="One-line summary of this evidence (what it shows, why it matters)."
        rows={2}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "saving" || (!summary.trim() && !artifactUrl.trim())}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit evidence
        </button>
      </div>
    </form>
  );
}

function SubmissionList({ submissions }: { submissions: TrainingSubmissionRecord[] }) {
  if (submissions.length === 0) {
    return (
      <p className="text-[11px] text-zinc-500">
        No evidence submitted yet for this checkpoint.
      </p>
    );
  }
  return (
    <ul className="space-y-2 text-sm text-zinc-200">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              <span>{submission.kind ?? submission.scope}</span>
              <span>·</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
            {submission.summary ? <p className="mt-1 text-sm text-zinc-200">{submission.summary}</p> : null}
            {submission.artifactUrl ? (
              <a
                href={submission.artifactUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-sky-300 underline"
              >
                Open artifact
              </a>
            ) : null}
          </div>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
            {submission.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default ParticipantWorkbench;
