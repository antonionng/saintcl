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

type FlowDesignerWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions?: TrainingSubmissionRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
};

export function FlowDesignerWorkbench(props: FlowDesignerWorkbenchProps) {
  return (
    <ParticipantWorkbench
      inviteCode={props.inviteCode}
      moduleSlug={props.moduleSlug}
      moduleTitle={props.moduleTitle}
      workbenchEyebrow="Flow designer"
      workbenchTitle="Map the workflow, mark the human-in-the-loop, ship a pilot plan"
      workbenchSubtitle="Build a swimlane row by row, then capture the pilot KPIs and rollback plan as evidence."
      labCheckpoints={props.labCheckpoints}
      initialLabProgress={props.initialLabProgress}
      initialSubmissions={props.initialSubmissions}
      deckState={props.deckState}
      facilitatorPrompt={props.facilitatorPrompt}
      renderTaskWorkArea={({ checkpoint, task }) => (
        <FlowDesignerWorkArea
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          checkpoint={checkpoint}
          task={task}
        />
      )}
    />
  );
}

type SwimlaneRow = {
  id: string;
  step: string;
  actor: "human" | "system" | "ai";
  description: string;
  exception: string;
  hitl: boolean;
};

type PilotKpi = {
  id: string;
  metric: string;
  baseline: string;
  target: string;
};

type FlowFields = {
  rows: SwimlaneRow[];
  kpis: PilotKpi[];
  rollback: string;
  owner: string;
  rolloutPhase: string;
};

const newRow = (): SwimlaneRow => ({
  id: crypto.randomUUID(),
  step: "",
  actor: "human",
  description: "",
  exception: "",
  hitl: false,
});

const newKpi = (): PilotKpi => ({
  id: crypto.randomUUID(),
  metric: "",
  baseline: "",
  target: "",
});

function FlowDesignerWorkArea({
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
    () => `flow-designer:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );

  const [fields, setFields] = useState<FlowFields>(() => ({
    rows: [newRow(), newRow(), newRow()],
    kpis: [newKpi(), newKpi()],
    rollback: "",
    owner: "",
    rolloutPhase: "Pilot",
  }));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FlowFields>;
      setFields((current) => ({
        ...current,
        ...parsed,
        rows: parsed.rows && parsed.rows.length > 0 ? parsed.rows : current.rows,
        kpis: parsed.kpis && parsed.kpis.length > 0 ? parsed.kpis : current.kpis,
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

  const updateRow = (id: string, patch: Partial<SwimlaneRow>) => {
    setFields((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const updateKpi = (id: string, patch: Partial<PilotKpi>) => {
    setFields((current) => ({
      ...current,
      kpis: current.kpis.map((kpi) => (kpi.id === id ? { ...kpi, ...patch } : kpi)),
    }));
  };

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
          summary: `Flow design: ${fields.rows[0]?.step?.slice(0, 80) || "(empty swimlane)"}`,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "flow_design",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "flow-designer",
            swimlane: fields.rows,
            kpis: fields.kpis,
            rollback: fields.rollback,
            owner: fields.owner,
            rolloutPhase: fields.rolloutPhase,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save flow design.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save flow design.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/8 bg-black/20 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Swimlane</p>
          <button
            type="button"
            onClick={() => setFields((current) => ({ ...current, rows: [...current.rows, newRow()] }))}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white hover:bg-white/[0.08]"
          >
            Add step
          </button>
        </header>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm text-zinc-200">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                <th className="px-2 py-2 text-left">Step</th>
                <th className="px-2 py-2 text-left">Actor</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Exception path</th>
                <th className="px-2 py-2 text-left">HITL</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fields.rows.map((row, index) => (
                <tr key={row.id} className="border-t border-white/8">
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      value={row.step}
                      onChange={(event) => updateRow(row.id, { step: event.target.value })}
                      placeholder={`Step ${index + 1}`}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select
                      value={row.actor}
                      onChange={(event) =>
                        updateRow(row.id, { actor: event.target.value as SwimlaneRow["actor"] })
                      }
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                    >
                      <option value="human">Human</option>
                      <option value="system">System</option>
                      <option value="ai">AI</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea
                      value={row.description}
                      onChange={(event) => updateRow(row.id, { description: event.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea
                      value={row.exception}
                      onChange={(event) => updateRow(row.id, { exception: event.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={row.hitl}
                      onChange={(event) => updateRow(row.id, { hitl: event.target.checked })}
                      className="h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() =>
                        setFields((current) => ({
                          ...current,
                          rows: current.rows.filter((entry) => entry.id !== row.id),
                        }))
                      }
                      className="text-[11px] text-rose-300 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-black/20 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Pilot KPIs</p>
          <button
            type="button"
            onClick={() => setFields((current) => ({ ...current, kpis: [...current.kpis, newKpi()] }))}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white hover:bg-white/[0.08]"
          >
            Add KPI
          </button>
        </header>
        <div className="mt-3 grid gap-2">
          {fields.kpis.map((kpi) => (
            <div key={kpi.id} className="grid gap-2 rounded-xl border border-white/8 bg-black/15 p-3 sm:grid-cols-3">
              <input
                type="text"
                value={kpi.metric}
                onChange={(event) => updateKpi(kpi.id, { metric: event.target.value })}
                placeholder="Metric (e.g. cycle time)"
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
              />
              <input
                type="text"
                value={kpi.baseline}
                onChange={(event) => updateKpi(kpi.id, { baseline: event.target.value })}
                placeholder="Baseline"
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
              />
              <input
                type="text"
                value={kpi.target}
                onChange={(event) => updateKpi(kpi.id, { target: event.target.value })}
                placeholder="Target"
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Field label="Owner" value={fields.owner} onChange={(value) => setFields((c) => ({ ...c, owner: value }))} />
        <Field
          label="Rollout phase"
          value={fields.rolloutPhase}
          onChange={(value) => setFields((c) => ({ ...c, rolloutPhase: value }))}
        />
        <Field
          label="Rollback plan"
          value={fields.rollback}
          onChange={(value) => setFields((c) => ({ ...c, rollback: value }))}
          multiline
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving flow design..."
            : status === "saved"
              ? "Flow design submitted as evidence."
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Saves locally as you type. Submit to send the design to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={status === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit flow design
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
  onChange: (next: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
        />
      )}
    </label>
  );
}

export default FlowDesignerWorkbench;
