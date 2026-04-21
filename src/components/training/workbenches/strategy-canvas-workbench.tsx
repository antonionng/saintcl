"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ParticipantWorkbench,
  type WorkbenchActiveTask,
} from "@/components/training/participant-workbench";
import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type StrategyCanvasWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions?: TrainingSubmissionRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
};

export function StrategyCanvasWorkbench(props: StrategyCanvasWorkbenchProps) {
  return (
    <ParticipantWorkbench
      inviteCode={props.inviteCode}
      moduleSlug={props.moduleSlug}
      moduleTitle={props.moduleTitle}
      workbenchEyebrow="Strategy canvas"
      workbenchTitle="Score the opportunity, govern the risk, draft the exec one-pager"
      workbenchSubtitle="Use the scorecard for value, feasibility, and risk; check governance; then write the recommendation."
      labCheckpoints={props.labCheckpoints}
      initialLabProgress={props.initialLabProgress}
      initialSubmissions={props.initialSubmissions}
      deckState={props.deckState}
      facilitatorPrompt={props.facilitatorPrompt}
      renderTaskWorkArea={({ checkpoint, task }) => (
        <StrategyCanvasWorkArea
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          checkpoint={checkpoint}
          task={task}
        />
      )}
    />
  );
}

const SCORE_DIMENSIONS = ["Value", "Feasibility", "Risk-adjusted"] as const;
type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

const GOVERNANCE_ITEMS = [
  "Data residency and consent confirmed",
  "Model risk tier and approver identified",
  "Customer impact and disclosure plan written",
  "Auditability of decisions designed in",
];

type CanvasFields = {
  opportunity: string;
  scores: Record<ScoreDimension, number>;
  governance: Record<string, boolean>;
  pilotScope: string;
  successMetric: string;
  execOnePager: string;
};

const EMPTY_FIELDS: CanvasFields = {
  opportunity: "",
  scores: { Value: 3, Feasibility: 3, "Risk-adjusted": 3 },
  governance: Object.fromEntries(GOVERNANCE_ITEMS.map((item) => [item, false])),
  pilotScope: "",
  successMetric: "",
  execOnePager: "",
};

function StrategyCanvasWorkArea({
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
    () => `strategy-canvas:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );
  const [fields, setFields] = useState<CanvasFields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CanvasFields>;
      setFields((current) => ({
        ...current,
        ...parsed,
        scores: { ...current.scores, ...(parsed.scores ?? {}) },
        governance: { ...current.governance, ...(parsed.governance ?? {}) },
      }));
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

  const compositeScore =
    (fields.scores.Value + fields.scores.Feasibility + fields.scores["Risk-adjusted"]) / 3;
  const governanceCovered = Object.values(fields.governance).filter(Boolean).length;

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
          summary: `Opportunity score ${compositeScore.toFixed(1)}/5: ${fields.opportunity.slice(0, 80) || "(no opportunity)"}`,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "strategy_canvas",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "strategy-canvas",
            opportunity: fields.opportunity,
            scores: fields.scores,
            compositeScore,
            governance: fields.governance,
            governanceCovered,
            pilotScope: fields.pilotScope,
            successMetric: fields.successMetric,
            execOnePager: fields.execOnePager,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save strategy canvas.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save strategy canvas.");
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Opportunity">
        <textarea
          value={fields.opportunity}
          onChange={(event) => setFields((c) => ({ ...c, opportunity: event.target.value }))}
          rows={3}
          placeholder="Describe the opportunity in one sentence. Who benefits and how?"
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
        />
      </Card>

      <Card title="Scorecard" hint={`Composite ${compositeScore.toFixed(1)}/5`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {SCORE_DIMENSIONS.map((dimension) => (
            <label key={dimension} className="space-y-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{dimension}</span>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={fields.scores[dimension]}
                onChange={(event) =>
                  setFields((c) => ({
                    ...c,
                    scores: { ...c.scores, [dimension]: Number(event.target.value) },
                  }))
                }
                className="w-full"
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>1</span>
                <span className="font-mono text-sm text-zinc-100">{fields.scores[dimension]}</span>
                <span>5</span>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Governance" hint={`${governanceCovered}/${GOVERNANCE_ITEMS.length} covered`}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {GOVERNANCE_ITEMS.map((item) => (
            <li key={item}>
              <label className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(fields.governance[item])}
                  onChange={(event) =>
                    setFields((c) => ({
                      ...c,
                      governance: { ...c.governance, [item]: event.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400"
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Pilot scope">
          <textarea
            value={fields.pilotScope}
            onChange={(event) => setFields((c) => ({ ...c, pilotScope: event.target.value }))}
            rows={3}
            placeholder="Who, where, for how long, with what guardrails."
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </Card>
        <Card title="Success metric">
          <textarea
            value={fields.successMetric}
            onChange={(event) => setFields((c) => ({ ...c, successMetric: event.target.value }))}
            rows={3}
            placeholder="One number we will defend and how it will be measured."
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </Card>
      </div>

      <Card title="Exec one-pager (markdown supported)">
        <textarea
          value={fields.execOnePager}
          onChange={(event) => setFields((c) => ({ ...c, execOnePager: event.target.value }))}
          rows={10}
          placeholder={"## Recommendation\n\n- Opportunity\n- Why now\n- Pilot plan\n- Risks and guardrails\n- Decision requested"}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs leading-6 text-zinc-100 focus:border-sky-400/40 focus:outline-none"
        />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving strategy canvas..."
            : status === "saved"
              ? "Strategy canvas submitted as evidence."
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Saves locally as you type. Submit to send the canvas to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={status === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit strategy canvas
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/8 bg-black/20 p-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
      </header>
      {children}
    </div>
  );
}

export default StrategyCanvasWorkbench;
