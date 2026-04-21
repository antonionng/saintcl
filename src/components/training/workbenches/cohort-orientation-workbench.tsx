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

type CohortOrientationWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions?: TrainingSubmissionRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
};

const PROFILE_CHECKLIST = [
  "Profile photo uploaded",
  "Function and team listed",
  "Working hours and timezone set",
  "Preferred channel and pronouns added",
];

export function CohortOrientationWorkbench(props: CohortOrientationWorkbenchProps) {
  return (
    <ParticipantWorkbench
      inviteCode={props.inviteCode}
      moduleSlug={props.moduleSlug}
      moduleTitle={props.moduleTitle}
      workbenchEyebrow="Cohort orientation"
      workbenchTitle="Set the conditions for the next seven modules"
      workbenchSubtitle="Use this workbench to capture your achievement plan, draft your intro post for the cohort, and confirm your profile is ready."
      labCheckpoints={props.labCheckpoints}
      initialLabProgress={props.initialLabProgress}
      initialSubmissions={props.initialSubmissions}
      deckState={props.deckState}
      facilitatorPrompt={props.facilitatorPrompt}
      renderTaskWorkArea={({ checkpoint, task }) => (
        <CohortOrientationTaskWorkArea
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          checkpoint={checkpoint}
          task={task}
        />
      )}
    />
  );
}

type WorkAreaProps = {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
};

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

function CohortOrientationTaskWorkArea({ inviteCode, moduleSlug, checkpoint, task }: WorkAreaProps) {
  const storageKey = useMemo(
    () => `cohort-orientation:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );

  const [outcome, setOutcome] = useState("");
  const [habit, setHabit] = useState("");
  const [risk, setRisk] = useState("");
  const [introPost, setIntroPost] = useState("");
  const [profileChecks, setProfileChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PROFILE_CHECKLIST.map((item) => [item, false])),
  );
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hydrate locally so participants do not lose state if they navigate away
  // before the explicit submit. The canonical evidence still goes through the
  // submissions API on Save.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        outcome?: string;
        habit?: string;
        risk?: string;
        introPost?: string;
        profileChecks?: Record<string, boolean>;
      };
      if (parsed.outcome) setOutcome(parsed.outcome);
      if (parsed.habit) setHabit(parsed.habit);
      if (parsed.risk) setRisk(parsed.risk);
      if (parsed.introPost) setIntroPost(parsed.introPost);
      if (parsed.profileChecks) {
        setProfileChecks((current) => ({ ...current, ...parsed.profileChecks }));
      }
    } catch {
      // localStorage may be unavailable (e.g. SSR, privacy mode); ignore.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ outcome, habit, risk, introPost, profileChecks }),
      );
    } catch {
      // ignore quota errors
    }
  }, [storageKey, outcome, habit, risk, introPost, profileChecks]);

  const profileCompleted = Object.values(profileChecks).filter(Boolean).length;

  const handleSave = async () => {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const summary = `Achievement plan: ${outcome.slice(0, 80) || "(empty)"}`;
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "workbench_state",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "cohort-orientation",
            achievementPlan: { outcome, habit, risk },
            introPost,
            profileChecklist: profileChecks,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save workbench state.");
      }
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setErrorMessage(caught instanceof Error ? caught.message : "Unable to save workbench state.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <FormCard title="Achievement plan" hint="What does success look like for you across the programme?">
          <LabelledTextarea
            label="Programme outcome you will own"
            value={outcome}
            onChange={setOutcome}
            placeholder="e.g. Ship a Python-driven branch performance report by week 6."
          />
          <LabelledTextarea
            label="Daily or weekly habit you will commit to"
            value={habit}
            onChange={setHabit}
            placeholder="e.g. 30 minutes of notebook practice every morning."
          />
          <LabelledTextarea
            label="Biggest risk to your participation"
            value={risk}
            onChange={setRisk}
            placeholder="e.g. Sprint reviews on Wednesday afternoons."
          />
        </FormCard>

        <FormCard title="Cohort intro post" hint="A two paragraph note your peers will read in the cohort feed.">
          <textarea
            value={introPost}
            onChange={(event) => setIntroPost(event.target.value)}
            rows={8}
            placeholder="Hi cohort - I'm Alex from Branch Operations. I joined the programme to..."
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
          />
          <p className="text-[11px] text-zinc-500">{introPost.length} characters drafted</p>
        </FormCard>
      </div>

      <FormCard
        title="Profile checklist"
        hint={`${profileCompleted}/${PROFILE_CHECKLIST.length} items confirmed`}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {PROFILE_CHECKLIST.map((item) => (
            <li key={item}>
              <label className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(profileChecks[item])}
                  onChange={(event) =>
                    setProfileChecks((current) => ({ ...current, [item]: event.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400 focus:ring-sky-400"
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </FormCard>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {status === "saving"
            ? "Saving workbench state..."
            : status === "saved"
              ? "Workbench state submitted as evidence."
              : status === "error"
                ? errorMessage ?? "Save failed"
                : "Saves locally as you type. Hit submit to send a snapshot to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={status === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit workbench snapshot
        </button>
      </div>
    </div>
  );
}

function FormCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
      </header>
      {children}
    </div>
  );
}

function LabelledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
      />
    </label>
  );
}

export default CohortOrientationWorkbench;
