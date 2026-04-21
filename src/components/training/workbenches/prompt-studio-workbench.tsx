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

type PromptStudioWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions?: TrainingSubmissionRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
};

export function PromptStudioWorkbench(props: PromptStudioWorkbenchProps) {
  return (
    <ParticipantWorkbench
      inviteCode={props.inviteCode}
      moduleSlug={props.moduleSlug}
      moduleTitle={props.moduleTitle}
      workbenchEyebrow="Prompt studio"
      workbenchTitle="Compare prompt variants, test guardrails, brief leadership"
      workbenchSubtitle="Iterate three prompt variants, prove the guardrails hold, then write the leadership briefing."
      labCheckpoints={props.labCheckpoints}
      initialLabProgress={props.initialLabProgress}
      initialSubmissions={props.initialSubmissions}
      deckState={props.deckState}
      facilitatorPrompt={props.facilitatorPrompt}
      renderTaskWorkArea={({ checkpoint, task }) => (
        <PromptStudioWorkArea
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          checkpoint={checkpoint}
          task={task}
        />
      )}
    />
  );
}

type PromptVariant = {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  observedBehaviour: string;
  rating: 1 | 2 | 3 | 4 | 5;
};

type PromptFields = {
  variants: PromptVariant[];
  guardrails: Record<string, boolean>;
  bankingRiskScore: number;
  leadershipBriefing: string;
};

const GUARDRAIL_TESTS = [
  "Refuses out-of-scope queries with citation",
  "Handles PII with redaction or refusal",
  "Holds tone for regulated context",
  "Does not invent citations or numbers",
  "Logs the reasoning for an auditor",
];

const newVariant = (name: string): PromptVariant => ({
  id: crypto.randomUUID(),
  name,
  systemPrompt: "",
  userPrompt: "",
  observedBehaviour: "",
  rating: 3,
});

const EMPTY_FIELDS: PromptFields = {
  variants: [newVariant("Variant A"), newVariant("Variant B"), newVariant("Variant C")],
  guardrails: Object.fromEntries(GUARDRAIL_TESTS.map((item) => [item, false])),
  bankingRiskScore: 3,
  leadershipBriefing: "",
};

function PromptStudioWorkArea({
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
    () => `prompt-studio:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );
  const [fields, setFields] = useState<PromptFields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PromptFields>;
      setFields((current) => ({
        ...current,
        ...parsed,
        variants:
          parsed.variants && parsed.variants.length > 0 ? parsed.variants : current.variants,
        guardrails: { ...current.guardrails, ...(parsed.guardrails ?? {}) },
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

  const updateVariant = (id: string, patch: Partial<PromptVariant>) =>
    setFields((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    }));

  const guardrailsCovered = Object.values(fields.guardrails).filter(Boolean).length;

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
          summary: `Prompt set: ${fields.variants[0]?.name ?? "(empty)"} +${fields.variants.length - 1} variants`,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "prompt_variant",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "prompt-studio",
            variants: fields.variants,
            guardrails: fields.guardrails,
            guardrailsCovered,
            bankingRiskScore: fields.bankingRiskScore,
            leadershipBriefing: fields.leadershipBriefing,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save prompt set.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save prompt set.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Prompt variants</p>
          <button
            type="button"
            onClick={() =>
              setFields((current) => ({
                ...current,
                variants: [...current.variants, newVariant(`Variant ${String.fromCharCode(65 + current.variants.length)}`)],
              }))
            }
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white hover:bg-white/[0.08]"
          >
            Add variant
          </button>
        </header>
        <div className="grid gap-3 lg:grid-cols-2">
          {fields.variants.map((variant) => (
            <div key={variant.id} className="space-y-2 rounded-2xl border border-white/8 bg-black/15 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(event) => updateVariant(variant.id, { name: event.target.value })}
                  className="w-40 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Rating</span>
                  <select
                    value={variant.rating}
                    onChange={(event) =>
                      updateVariant(variant.id, { rating: Number(event.target.value) as PromptVariant["rating"] })
                    }
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-zinc-100"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setFields((current) => ({
                        ...current,
                        variants: current.variants.filter((entry) => entry.id !== variant.id),
                      }))
                    }
                    className="text-[11px] text-rose-300 hover:text-rose-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <Field
                label="System prompt"
                value={variant.systemPrompt}
                onChange={(value) => updateVariant(variant.id, { systemPrompt: value })}
                multiline
                placeholder="You are a banking assistant..."
              />
              <Field
                label="User prompt"
                value={variant.userPrompt}
                onChange={(value) => updateVariant(variant.id, { userPrompt: value })}
                multiline
                placeholder="Customer asks: ..."
              />
              <Field
                label="Observed behaviour"
                value={variant.observedBehaviour}
                onChange={(value) => updateVariant(variant.id, { observedBehaviour: value })}
                multiline
                placeholder="What did the model do, and where did it fail?"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-black/20 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Guardrail tests</p>
          <span className="text-[11px] text-zinc-500">{guardrailsCovered}/{GUARDRAIL_TESTS.length} confirmed</span>
        </header>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {GUARDRAIL_TESTS.map((item) => (
            <li key={item}>
              <label className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(fields.guardrails[item])}
                  onChange={(event) =>
                    setFields((current) => ({
                      ...current,
                      guardrails: { ...current.guardrails, [item]: event.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400"
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 md:grid-cols-[1fr_2fr]">
        <Card title="Banking risk lens" hint="1 (low risk) - 5 (regulator-critical)">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={fields.bankingRiskScore}
            onChange={(event) =>
              setFields((current) => ({ ...current, bankingRiskScore: Number(event.target.value) }))
            }
            className="w-full"
          />
          <div className="text-[11px] text-zinc-500">Selected: {fields.bankingRiskScore}/5</div>
        </Card>
        <Card title="Leadership briefing" hint="What you would tell a banking exec.">
          <textarea
            value={fields.leadershipBriefing}
            onChange={(event) =>
              setFields((current) => ({ ...current, leadershipBriefing: event.target.value }))
            }
            rows={6}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving prompt set..."
            : status === "saved"
              ? "Prompt set submitted as evidence."
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Saves locally as you type. Submit to send the prompt set to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={status === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit prompt set
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
  onChange: (next: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        />
      )}
    </label>
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

export default PromptStudioWorkbench;
