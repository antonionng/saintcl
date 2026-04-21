"use client";

import { useEffect, useMemo, useState } from "react";

import { PythonLearningWorkspace } from "@/components/training/python-studio-workspace";
import {
  ParticipantWorkbench,
  type WorkbenchActiveTask,
} from "@/components/training/participant-workbench";
import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type NotebookPreview = {
  slug: string;
  title: string;
  href: string;
  outputFolder: string;
  focus: string[];
  codeBlocks: Array<{ label: string; code: string }>;
  expectedSignals: string[];
};

type ResourceLink = { label: string; href: string; kind: string };

type NeuralLabWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  workbookHref: string;
  notebookPreviews: NotebookPreview[];
  resources: ResourceLink[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
  variant?: "module" | "lab";
  initialCheckpointSlug?: string | null;
};

export function NeuralLabWorkbench(props: NeuralLabWorkbenchProps) {
  const isLab = props.variant === "lab";

  if (isLab) {
    const activeCheckpoint =
      props.labCheckpoints.find(
        (checkpoint) => checkpoint.slug === props.initialCheckpointSlug,
      ) ?? props.labCheckpoints[0] ?? null;
    return (
      <div className="space-y-4">
        <PythonLearningWorkspace
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          deckHref={props.deckHref}
          workbookHref={props.workbookHref}
          notebookPreviews={props.notebookPreviews}
          resources={props.resources}
          labCheckpoints={props.labCheckpoints}
          initialLabProgress={props.initialLabProgress}
          initialSubmissions={props.initialSubmissions}
          initialWorkspaces={props.initialWorkspaces}
          currentSlideIndex={props.deckState?.slideIndex ?? null}
          currentSlideTitle={props.deckState?.title ?? null}
          facilitatorPrompt={props.facilitatorPrompt}
          variant="lab"
          initialCheckpointSlug={props.initialCheckpointSlug ?? null}
        />
        {activeCheckpoint ? (
          <details className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-200">
            <summary className="cursor-pointer text-sm font-medium text-white">
              Architecture notes evidence
            </summary>
            <div className="pt-3">
              <ArchitectureNotesPanel
                inviteCode={props.inviteCode}
                moduleSlug={props.moduleSlug}
                checkpoint={activeCheckpoint}
                task={null}
              />
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PythonLearningWorkspace
        inviteCode={props.inviteCode}
        moduleSlug={props.moduleSlug}
        deckHref={props.deckHref}
        workbookHref={props.workbookHref}
        notebookPreviews={props.notebookPreviews}
        resources={props.resources}
        labCheckpoints={props.labCheckpoints}
        initialLabProgress={props.initialLabProgress}
        initialSubmissions={props.initialSubmissions}
        initialWorkspaces={props.initialWorkspaces}
        currentSlideIndex={props.deckState?.slideIndex ?? null}
        currentSlideTitle={props.deckState?.title ?? null}
        facilitatorPrompt={props.facilitatorPrompt}
      />

      <ParticipantWorkbench
        inviteCode={props.inviteCode}
        moduleSlug={props.moduleSlug}
        moduleTitle={props.moduleTitle}
        workbenchEyebrow="Neural lab"
        workbenchTitle="Choose an architecture, read the curves, recommend the next iteration"
        workbenchSubtitle="Use the notebook to train, then capture architecture decisions and the training curve interpretation below."
        labCheckpoints={props.labCheckpoints}
        initialLabProgress={props.initialLabProgress}
        initialSubmissions={props.initialSubmissions}
        deckState={props.deckState}
        facilitatorPrompt={props.facilitatorPrompt}
        renderTaskWorkArea={({ checkpoint, task }) => (
          <ArchitectureNotesPanel
            inviteCode={props.inviteCode}
            moduleSlug={props.moduleSlug}
            checkpoint={checkpoint}
            task={task}
          />
        )}
      />
    </div>
  );
}

type ArchitectureFields = {
  architecture: string;
  why: string;
  trainAccuracy: string;
  valAccuracy: string;
  loss: string;
  curveInterpretation: string;
  failureModes: string;
  nextIteration: string;
};

const EMPTY_FIELDS: ArchitectureFields = {
  architecture: "",
  why: "",
  trainAccuracy: "",
  valAccuracy: "",
  loss: "",
  curveInterpretation: "",
  failureModes: "",
  nextIteration: "",
};

function ArchitectureNotesPanel({
  inviteCode,
  moduleSlug,
  checkpoint,
  task,
}: {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
}) {
  const storageKey = useMemo(
    () => `neural-lab:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );
  const [fields, setFields] = useState<ArchitectureFields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setFields((current) => ({ ...current, ...(JSON.parse(raw) as Partial<ArchitectureFields>) }));
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(fields));
    } catch {
      // ignore
    }
  }, [storageKey, fields]);

  const update = (key: keyof ArchitectureFields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFields((current) => ({ ...current, [key]: value }));
  };

  const trainAcc = parseFloat(fields.trainAccuracy);
  const valAcc = parseFloat(fields.valAccuracy);
  const overfitGap = !Number.isNaN(trainAcc) && !Number.isNaN(valAcc) ? trainAcc - valAcc : null;

  const submit = async () => {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary: `Architecture notes: ${fields.architecture.slice(0, 80) || "(empty)"}`,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "workbench_state",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "neural-lab",
            architectureNotes: fields,
            derived: { overfitGap },
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save architecture notes.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save architecture notes.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Architecture choice" value={fields.architecture} onChange={update("architecture")} />
        <Field label="Why this architecture" value={fields.why} onChange={update("why")} multiline />
        <Field label="Train accuracy" value={fields.trainAccuracy} onChange={update("trainAccuracy")} placeholder="0.94" />
        <Field
          label="Validation accuracy"
          value={fields.valAccuracy}
          onChange={update("valAccuracy")}
          placeholder="0.86"
        />
        <Field label="Loss snapshot" value={fields.loss} onChange={update("loss")} placeholder="train 0.18 / val 0.41" />
        <Field
          label="Curve interpretation"
          value={fields.curveInterpretation}
          onChange={update("curveInterpretation")}
          multiline
        />
        <Field label="Failure modes observed" value={fields.failureModes} onChange={update("failureModes")} multiline />
        <Field label="Next iteration plan" value={fields.nextIteration} onChange={update("nextIteration")} multiline />
      </div>
      {overfitGap !== null ? (
        <div
          className={`rounded-2xl border px-3 py-2 text-xs ${
            overfitGap > 0.1
              ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
              : overfitGap < -0.05
                ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-100"
                : "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
          }`}
        >
          Overfit gap (train − val): {overfitGap.toFixed(3)}
          {overfitGap > 0.1 ? " — model is overfitting; add regularisation or augment data." : null}
          {overfitGap < -0.05 ? " — model under-confident on training; revisit capacity." : null}
          {overfitGap >= -0.05 && overfitGap <= 0.1 ? " — generalisation gap looks healthy." : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving architecture notes..."
            : status === "saved"
              ? "Architecture notes submitted."
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Saves locally as you type. Submit to send a snapshot to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={status === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit architecture notes
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      )}
    </label>
  );
}

export default NeuralLabWorkbench;
