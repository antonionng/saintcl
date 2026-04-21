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
  codeBlocks: Array<{
    label: string;
    code: string;
  }>;
  expectedSignals: string[];
};

type ResourceLink = {
  label: string;
  href: string;
  kind: string;
};

type MlLabWorkbenchProps = {
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
  /**
   * `"module"` keeps the legacy stacked layout (PythonLearningWorkspace + a separate
   * ParticipantWorkbench evidence rail). `"lab"` collapses the second rail and
   * renders the notebook in lab variant with the model-card form as a compact
   * evidence slot, suitable for the full-viewport lab route.
   */
  variant?: "module" | "lab";
  initialCheckpointSlug?: string | null;
};

export function MlLabWorkbench(props: MlLabWorkbenchProps) {
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
              Model card evidence
            </summary>
            <div className="pt-3">
              <ModelCardForm
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
        workbenchEyebrow="ML lab"
        workbenchTitle="Frame the problem, beat a baseline, write the model card"
        workbenchSubtitle="Run code in the notebook above, then capture the modelling decision below as evidence your facilitator can score."
        labCheckpoints={props.labCheckpoints}
        initialLabProgress={props.initialLabProgress}
        initialSubmissions={props.initialSubmissions}
        deckState={props.deckState}
        facilitatorPrompt={props.facilitatorPrompt}
        renderTaskWorkArea={({ checkpoint, task }) => (
          <ModelCardForm
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

type ModelCardFormProps = {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
};

type ModelCardFields = {
  problemStatement: string;
  target: string;
  metric: string;
  baseline: string;
  bestModel: string;
  performanceDelta: string;
  riskFairnessNotes: string;
  recommendation: string;
};

const EMPTY_MODEL_CARD: ModelCardFields = {
  problemStatement: "",
  target: "",
  metric: "",
  baseline: "",
  bestModel: "",
  performanceDelta: "",
  riskFairnessNotes: "",
  recommendation: "",
};

function ModelCardForm({ inviteCode, moduleSlug, checkpoint, task }: ModelCardFormProps) {
  const storageKey = useMemo(
    () => `ml-lab-model-card:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );

  const [fields, setFields] = useState<ModelCardFields>(EMPTY_MODEL_CARD);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ModelCardFields>;
      setFields((current) => ({ ...current, ...parsed }));
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

  const update = (key: keyof ModelCardFields) => (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = event.target.value;
    setFields((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const summary = `Model card: ${fields.problemStatement.slice(0, 80) || "(empty)"}`;
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "model_card",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "ml-lab",
            modelCard: fields,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save model card.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save model card.");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300">
        Fill in the model card so a future colleague (or auditor) could understand what you built and why.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Problem statement" value={fields.problemStatement} onChange={update("problemStatement")} multiline />
        <Field label="Prediction target" value={fields.target} onChange={update("target")} />
        <Field label="Primary metric (and why)" value={fields.metric} onChange={update("metric")} />
        <Field label="Baseline beaten" value={fields.baseline} onChange={update("baseline")} />
        <Field label="Best model and tuning" value={fields.bestModel} onChange={update("bestModel")} multiline />
        <Field label="Performance delta vs baseline" value={fields.performanceDelta} onChange={update("performanceDelta")} />
        <Field
          label="Risk, fairness, and governance"
          value={fields.riskFairnessNotes}
          onChange={update("riskFairnessNotes")}
          multiline
        />
        <Field label="Deployment recommendation" value={fields.recommendation} onChange={update("recommendation")} multiline />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving model card..."
            : status === "saved"
              ? "Model card submitted as evidence."
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
          Submit model card
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
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={3}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      )}
    </label>
  );
}

export default MlLabWorkbench;
