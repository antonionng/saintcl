"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ParticipantNotes } from "@/components/training/participant-notes";

type AssessmentKind = "activity" | "homework" | "quiz" | "module_test";

type QuestionType =
  | "multiple_choice"
  | "multi_select"
  | "short_answer"
  | "long_answer"
  | "code"
  | "notebook_task"
  | "file_upload";

type AssessmentOption = {
  id: string;
  label: string;
};

type AssessmentRubricEntry = {
  criterion: string;
  weight: number;
  descriptor: string;
};

type AssessmentQuestion = {
  id: string;
  slug: string;
  prompt: string;
  questionType: QuestionType;
  sequence: number;
  points: number;
  options: AssessmentOption[];
  rubric: AssessmentRubricEntry[];
};

type AssessmentAttempt = {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "graded" | "returned" | "abandoned";
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  facilitatorReviewStatus: "not_required" | "pending" | "approved" | "changes_requested";
  facilitatorFeedback: string | null;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
};

type AssessmentSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: AssessmentKind;
  sequence: number;
  estimatedMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  isRequired: boolean;
  blocksModuleCompletion: boolean;
  facilitatorReviewRequired: boolean;
  questions: AssessmentQuestion[];
  attempts: AssessmentAttempt[];
  hasPassed: boolean;
};

type ResponseValue = {
  selectedOptionId?: string | null;
  selectedOptionIds?: string[];
  text?: string;
  code?: string;
  fileUrl?: string;
  submissionId?: string | null;
};

type SubmissionEvidenceRecord = {
  id: string;
  scope: string;
  scopeId: string | null;
  kind: string | null;
  summary: string | null;
  artifactUrl: string | null;
  metadata: Record<string, unknown> | null;
  submittedAt: string | null;
};

type Props = {
  inviteCode: string;
  moduleSlug: string;
};

const KIND_LABELS: Record<AssessmentKind, string> = {
  activity: "Activity",
  homework: "Homework",
  quiz: "Quiz",
  module_test: "Module test",
};

function describeStatus(attempt: AssessmentAttempt | null) {
  if (!attempt) return "Not started";
  if (attempt.status === "in_progress") return "In progress";
  if (attempt.status === "submitted" && attempt.facilitatorReviewStatus === "pending") return "Submitted, awaiting review";
  if (attempt.status === "graded" && attempt.passed === true) return `Passed (${attempt.score?.toFixed(0) ?? "?"}%)`;
  if (attempt.status === "graded" && attempt.passed === false) return `Did not pass (${attempt.score?.toFixed(0) ?? "?"}%)`;
  if (attempt.status === "returned") return "Returned for changes";
  return attempt.status;
}

function getLatestAttempt(assessment: AssessmentSummary): AssessmentAttempt | null {
  return (
    assessment.attempts.find((attempt) => attempt.status === "in_progress") ??
    assessment.attempts[0] ??
    null
  );
}

export function TrainingAssessmentsPanel({ inviteCode, moduleSlug }: Props) {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<AssessmentQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/training/participant/assessments?inviteCode=${encodeURIComponent(inviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to load assessments.");
      }
      const payload = await response.json();
      setAssessments((payload?.data ?? []) as AssessmentSummary[]);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [inviteCode, moduleSlug]);

  useEffect(() => {
    void refresh();
    return () => {
      Object.values(autosaveTimers.current).forEach((timer) => clearTimeout(timer));
      autosaveTimers.current = {};
    };
  }, [refresh]);

  const activeAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === activeAssessmentId) ?? null,
    [activeAssessmentId, assessments],
  );

  const startAssessment = useCallback(
    async (assessment: AssessmentSummary) => {
      setActionMessage(null);
      try {
        const response = await fetch("/api/training/participant/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            inviteCode,
            moduleSlug,
            assessmentSlug: assessment.slug,
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message ?? "Unable to start assessment.");
        }
        const payload = await response.json();
        setActiveAssessmentId(assessment.id);
        setActiveAttempt(payload.data.attempt as AssessmentAttempt);
        setActiveQuestions(payload.data.questions as AssessmentQuestion[]);
        const seeded: Record<string, ResponseValue> = {};
        for (const saved of (payload.data.savedResponses ?? []) as Array<{
          questionId: string;
          response: ResponseValue;
        }>) {
          seeded[saved.questionId] = saved.response ?? {};
        }
        setResponses(seeded);
      } catch (caught) {
        setActionMessage(caught instanceof Error ? caught.message : "Unable to start assessment.");
      }
    },
    [inviteCode, moduleSlug],
  );

  const scheduleAutosave = useCallback(
    (questionId: string, value: ResponseValue) => {
      if (!activeAttempt) return;
      const existing = autosaveTimers.current[questionId];
      if (existing) clearTimeout(existing);
      autosaveTimers.current[questionId] = setTimeout(async () => {
        setSavingQuestionId(questionId);
        try {
          const response = await fetch("/api/training/participant/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save",
              inviteCode,
              moduleSlug,
              attemptId: activeAttempt.id,
              questionId,
              response: value,
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload?.error?.message ?? "Unable to save response.");
          }
        } catch (caught) {
          setActionMessage(caught instanceof Error ? caught.message : "Unable to save response.");
        } finally {
          setSavingQuestionId(null);
        }
      }, 600);
    },
    [activeAttempt, inviteCode, moduleSlug],
  );

  const updateResponse = useCallback(
    (questionId: string, value: ResponseValue) => {
      setResponses((current) => ({ ...current, [questionId]: value }));
      scheduleAutosave(questionId, value);
    },
    [scheduleAutosave],
  );

  const submitAttempt = useCallback(async () => {
    if (!activeAttempt) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      Object.values(autosaveTimers.current).forEach((timer) => clearTimeout(timer));
      autosaveTimers.current = {};
      const response = await fetch("/api/training/participant/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          inviteCode,
          moduleSlug,
          attemptId: activeAttempt.id,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to submit assessment.");
      }
      const payload = await response.json();
      const finalAttempt = payload.data.attempt as AssessmentAttempt;
      setActiveAttempt(finalAttempt);
      const score = typeof payload.data.score === "number" ? payload.data.score.toFixed(0) : "?";
      if (payload.data.requiresFacilitatorReview) {
        setActionMessage(`Submitted. Awaiting facilitator review. Auto-graded score so far: ${score}%.`);
      } else if (payload.data.passed) {
        setActionMessage(`Passed with ${score}%.`);
      } else {
        setActionMessage(`Did not pass. Scored ${score}%. You can retry if attempts remain.`);
      }
      await refresh();
    } catch (caught) {
      setActionMessage(caught instanceof Error ? caught.message : "Unable to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }, [activeAttempt, inviteCode, moduleSlug, refresh]);

  const closeRunner = useCallback(() => {
    setActiveAssessmentId(null);
    setActiveAttempt(null);
    setActiveQuestions([]);
    setResponses({});
  }, []);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
        Loading assessments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 px-5 py-6 text-sm text-amber-100">
        {error}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
        No assessments are configured for this module yet. Once your facilitator publishes them they will appear here.
      </div>
    );
  }

  if (activeAssessment && activeAttempt) {
    return (
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{KIND_LABELS[activeAssessment.kind]}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{activeAssessment.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{activeAssessment.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                Attempt {activeAttempt.attemptNumber}
                {activeAssessment.maxAttempts ? ` of ${activeAssessment.maxAttempts}` : ""}
              </span>
              <button
                type="button"
                onClick={closeRunner}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {activeQuestions.map((question, index) => {
            const value = responses[question.id] ?? {};
            const isSaving = savingQuestionId === question.id;
            return (
              <QuestionCard
                key={question.id}
                index={index}
                question={question}
                value={value}
                onChange={(next) => updateResponse(question.id, next)}
                isSaving={isSaving}
                disabled={activeAttempt.status !== "in_progress"}
                inviteCode={inviteCode}
                moduleSlug={moduleSlug}
                attemptStatus={activeAttempt.status}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-4">
          <p className="text-sm text-zinc-300">{actionMessage ?? "Answers autosave as you type."}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={closeRunner}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Save and exit
            </button>
            <button
              type="button"
              onClick={submitAttempt}
              disabled={submitting || activeAttempt.status !== "in_progress"}
              className="rounded-full bg-sky-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit attempt"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionMessage ? (
        <div className="rounded-[1.5rem] border border-sky-400/20 bg-sky-500/[0.08] px-5 py-3 text-sm text-sky-100">
          {actionMessage}
        </div>
      ) : null}
      {assessments.map((assessment) => {
        const latest = getLatestAttempt(assessment);
        const status = describeStatus(latest);
        const attemptCount = assessment.attempts.length;
        const remaining =
          assessment.maxAttempts === null
            ? "unlimited attempts"
            : `${Math.max(assessment.maxAttempts - attemptCount, 0)} attempt${
                Math.max(assessment.maxAttempts - attemptCount, 0) === 1 ? "" : "s"
              } left`;
        return (
          <div key={assessment.id} className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{KIND_LABELS[assessment.kind]}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{assessment.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{assessment.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    Pass {assessment.passingScore}%
                  </span>
                  {assessment.estimatedMinutes ? (
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      ~{assessment.estimatedMinutes} min
                    </span>
                  ) : null}
                  {assessment.blocksModuleCompletion ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1 text-amber-100">
                      Required to complete module
                    </span>
                  ) : null}
                  {assessment.facilitatorReviewRequired ? (
                    <span className="rounded-full border border-white/10 px-3 py-1">Facilitator review</span>
                  ) : null}
                  <span className="rounded-full border border-white/10 px-3 py-1">{remaining}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200">{status}</span>
                <button
                  type="button"
                  onClick={() => startAssessment(assessment)}
                  className="rounded-full bg-sky-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
                >
                  {latest?.status === "in_progress" ? "Resume" : assessment.hasPassed ? "Review" : "Start"}
                </button>
              </div>
            </div>
            {latest?.facilitatorFeedback ? (
              <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-200">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Facilitator feedback</p>
                <p className="mt-2 whitespace-pre-line">{latest.facilitatorFeedback}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type QuestionCardProps = {
  index: number;
  question: AssessmentQuestion;
  value: ResponseValue;
  onChange: (next: ResponseValue) => void;
  isSaving: boolean;
  disabled: boolean;
  inviteCode: string;
  moduleSlug: string;
  attemptStatus: AssessmentAttempt["status"];
};

function QuestionCard({
  index,
  question,
  value,
  onChange,
  isSaving,
  disabled,
  inviteCode,
  moduleSlug,
  attemptStatus,
}: QuestionCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Question {index + 1} - {question.points} pt{question.points === 1 ? "" : "s"}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-white">{question.prompt}</p>
        </div>
        <span className="text-[11px] text-zinc-500">{isSaving ? "Saving..." : "Saved"}</span>
      </div>

      <div className="mt-4 space-y-2">
        {question.questionType === "notebook_task" ? (
          <NotebookTaskEvidencePicker
            inviteCode={inviteCode}
            moduleSlug={moduleSlug}
            value={value}
            onChange={onChange}
            disabled={disabled || attemptStatus !== "in_progress"}
          />
        ) : (
          renderInput(question, value, onChange, disabled)
        )}
      </div>

      {question.rubric.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-zinc-300">
          <summary className="cursor-pointer text-zinc-400">Rubric</summary>
          <ul className="mt-2 space-y-1">
            {question.rubric.map((entry) => (
              <li key={entry.criterion}>
                <span className="text-zinc-200">{entry.criterion}</span>{" "}
                <span className="text-zinc-500">- {entry.descriptor} (weight {(entry.weight * 100).toFixed(0)}%)</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="mt-4">
        <ParticipantNotes
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          scope="assessment_question"
          scopeId={question.id}
          label="Working notes"
          placeholder="Stash your thinking, links, draft answers. These notes are private."
          compact
        />
      </div>
    </div>
  );
}

function renderInput(
  question: AssessmentQuestion,
  value: ResponseValue,
  onChange: (next: ResponseValue) => void,
  disabled: boolean,
) {
  if (question.questionType === "multiple_choice") {
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-200"
          >
            <input
              type="radio"
              name={question.id}
              checked={value.selectedOptionId === option.id}
              disabled={disabled}
              onChange={() => onChange({ selectedOptionId: option.id })}
              className="mt-1"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.questionType === "multi_select") {
    const selected = new Set(value.selectedOptionIds ?? []);
    return (
      <div className="space-y-2">
        {question.options.map((option) => {
          const checked = selected.has(option.id);
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-200"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  const next = new Set(selected);
                  if (checked) {
                    next.delete(option.id);
                  } else {
                    next.add(option.id);
                  }
                  onChange({ selectedOptionIds: Array.from(next) });
                }}
                className="mt-1"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.questionType === "short_answer") {
    return (
      <input
        type="text"
        value={value.text ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ text: event.target.value })}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        placeholder="Type your answer"
      />
    );
  }

  if (question.questionType === "long_answer") {
    return (
      <textarea
        value={value.text ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ text: event.target.value })}
        rows={5}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
        placeholder="Write your response"
      />
    );
  }

  if (question.questionType === "code") {
    return (
      <textarea
        value={value.code ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ code: event.target.value })}
        rows={8}
        spellCheck={false}
        className="w-full rounded-2xl border border-white/10 bg-[#05080d] px-3 py-2 font-mono text-xs leading-6 text-zinc-100 focus:border-sky-400/40 focus:outline-none"
        placeholder="# Paste or type your snippet"
      />
    );
  }

  if (question.questionType === "file_upload") {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={value.fileUrl ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ fileUrl: event.target.value })}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
          placeholder="Paste a shareable link to your artefact"
        />
        <p className="text-xs text-zinc-500">
          Upload your artefact to your usual storage and paste the link here. The facilitator will open it during review.
        </p>
      </div>
    );
  }

  return null;
}

type NotebookTaskEvidencePickerProps = {
  inviteCode: string;
  moduleSlug: string;
  value: ResponseValue;
  onChange: (next: ResponseValue) => void;
  disabled: boolean;
};

function NotebookTaskEvidencePicker({
  inviteCode,
  moduleSlug,
  value,
  onChange,
  disabled,
}: NotebookTaskEvidencePickerProps) {
  const [submissions, setSubmissions] = useState<SubmissionEvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/training/participant/submit?inviteCode=${encodeURIComponent(inviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}&limit=50`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to load submissions.");
      }
      const payload = await response.json();
      setSubmissions((payload?.data ?? []) as SubmissionEvidenceRecord[]);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [inviteCode, moduleSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedId = value.submissionId ?? null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <p>Bind one of your saved workbench submissions as the evidence for this question.</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-4 py-3 text-xs text-amber-100">
          {error}
        </div>
      ) : null}

      {submissions.length === 0 && !loading && !error ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-zinc-400">
          No saved submissions yet. Run the linked notebook checkpoint in the workspace tab and submit a snapshot, then refresh.
        </div>
      ) : null}

      {submissions.length > 0 ? (
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {submissions.map((submission) => {
            const isSelected = submission.id === selectedId;
            const submittedLabel = submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleString()
              : "Draft";
            const meta = submission.metadata as Record<string, unknown> | null;
            const notebookTitle =
              typeof meta?.notebookTitle === "string"
                ? (meta.notebookTitle as string)
                : typeof meta?.notebookSlug === "string"
                  ? (meta.notebookSlug as string)
                  : null;
            return (
              <button
                key={submission.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...value,
                    submissionId: isSelected ? null : submission.id,
                  })
                }
                className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
                  isSelected
                    ? "border-sky-400/40 bg-sky-500/[0.12] text-sky-50"
                    : "border-white/8 bg-white/[0.02] text-zinc-200 hover:border-white/16 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                    {submission.kind ?? "submission"} - {submission.scope}
                  </span>
                  <span className="text-[11px] text-zinc-500">{submittedLabel}</span>
                </div>
                {submission.summary ? (
                  <p className="mt-1.5 text-sm text-white">{submission.summary}</p>
                ) : null}
                {notebookTitle ? (
                  <p className="mt-1 text-[11px] text-zinc-400">Notebook: {notebookTitle}</p>
                ) : null}
                {submission.scopeId ? (
                  <p className="mt-0.5 text-[11px] text-zinc-500">Scope id: {submission.scopeId}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedId ? (
        <p className="text-[11px] text-emerald-300">Bound submission {selectedId.slice(0, 8)} as evidence.</p>
      ) : null}
    </div>
  );
}
