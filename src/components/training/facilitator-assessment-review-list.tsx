"use client";

import { useState } from "react";

type Attempt = {
  id: string;
  attemptNumber: number;
  score: number | null;
  submittedAt: string | null;
};

type Question = {
  id: string;
  prompt: string;
  questionType: string;
  points: number;
};

type Response = {
  questionId: string;
  response: Record<string, unknown>;
  awardedPoints: number | null;
};

type Item = {
  attempt: Attempt;
  assessment?: {
    id: string;
    slug: string;
    title: string;
    kind: string;
    passingScore: number;
  };
  cohort?: { id: string; name: string; inviteCode: string | null | undefined };
  participant?: { id: string; fullName: string; email: string };
  module?: { id: string; slug: string; title: string } | null;
  questions: Question[];
  responses: Response[];
};

type Props = {
  items: Item[];
};

export function FacilitatorAssessmentReviewList({ items }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const submit = async (attemptId: string, decision: "approved" | "changes_requested") => {
    setBusy(attemptId);
    try {
      const scoreText = scoreOverrides[attemptId];
      const scoreOverride = scoreText && scoreText.length > 0 ? Number(scoreText) : null;
      const passed = decision === "approved" ? (scoreOverride === null ? null : scoreOverride >= 0) : false;

      const response = await fetch("/api/training/facilitator/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          decision,
          feedback: feedbacks[attemptId] ?? null,
          scoreOverride,
          passed,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to record review.");
      }

      setMessages((current) => ({
        ...current,
        [attemptId]: decision === "approved" ? "Marked as approved." : "Returned to participant for changes.",
      }));
      setHidden((current) => {
        const next = new Set(current);
        next.add(attemptId);
        return next;
      });
    } catch (caught) {
      setMessages((current) => ({
        ...current,
        [attemptId]: caught instanceof Error ? caught.message : "Unable to record review.",
      }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {items
        .filter((item) => !hidden.has(item.attempt.id))
        .map((item) => {
          const attemptId = item.attempt.id;
          const responseByQuestion = new Map(item.responses.map((response) => [response.questionId, response]));
          const submittedLabel = item.attempt.submittedAt
            ? new Date(item.attempt.submittedAt).toLocaleString()
            : "Not submitted";
          return (
            <div key={attemptId} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    {item.assessment?.kind ?? "assessment"} - attempt {item.attempt.attemptNumber}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {item.assessment?.title ?? "Assessment"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {item.module?.title ?? "Module"} - {item.cohort?.name ?? "Cohort"} -{" "}
                    {item.participant?.fullName ?? "Participant"} ({item.participant?.email ?? "no email"})
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Submitted {submittedLabel}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                    Auto-graded score: {item.attempt.score?.toFixed(0) ?? "?"}%
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                    Pass: {item.assessment?.passingScore ?? "?"}%
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {item.questions.map((question) => {
                  const response = responseByQuestion.get(question.id);
                  const responseText =
                    response?.response &&
                    typeof response.response === "object" &&
                    response.response !== null
                      ? renderResponse(response.response as Record<string, unknown>)
                      : "(no response)";
                  return (
                    <div key={question.id} className="rounded-xl border border-white/8 bg-black/15 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                        {question.questionType} - {question.points} pt{question.points === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-white">{question.prompt}</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-zinc-200">{responseText}</p>
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Auto-awarded: {response?.awardedPoints ?? 0} / {question.points}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
                <textarea
                  value={feedbacks[attemptId] ?? ""}
                  onChange={(event) =>
                    setFeedbacks((current) => ({ ...current, [attemptId]: event.target.value }))
                  }
                  rows={4}
                  placeholder="Feedback for the participant"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
                />
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreOverrides[attemptId] ?? ""}
                    onChange={(event) =>
                      setScoreOverrides((current) => ({ ...current, [attemptId]: event.target.value }))
                    }
                    placeholder="Optional score override (0-100)"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400/40 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => submit(attemptId, "changes_requested")}
                      disabled={busy === attemptId}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
                    >
                      Return for changes
                    </button>
                    <button
                      type="button"
                      onClick={() => submit(attemptId, "approved")}
                      disabled={busy === attemptId}
                      className="rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                  {messages[attemptId] ? (
                    <p className="text-xs text-zinc-300">{messages[attemptId]}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function renderResponse(response: Record<string, unknown>): string {
  if (typeof response.text === "string" && response.text.trim().length > 0) return response.text;
  if (typeof response.code === "string" && response.code.trim().length > 0) return response.code;
  if (typeof response.fileUrl === "string" && response.fileUrl.trim().length > 0) return response.fileUrl;
  if (typeof response.selectedOptionId === "string") return `Selected option: ${response.selectedOptionId}`;
  if (Array.isArray(response.selectedOptionIds)) return `Selected: ${response.selectedOptionIds.join(", ")}`;
  return JSON.stringify(response);
}
