"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  TrainingAiAssessmentRecord,
  TrainingAiAssessmentScoreBand,
  TrainingSubmissionRecord,
} from "@/types";

type SubmissionPanelProps = {
  submissions: TrainingSubmissionRecord[];
  activeNotebookSlug: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  /**
   * AI assessor results keyed by submission id. Submissions without an entry
   * either predate the assessor or are still processing.
   */
  aiAssessments?: Record<string, TrainingAiAssessmentRecord | null | undefined>;
  /**
   * When true (facilitator surface), expose an override action so reviewers can
   * adjust the AI score band. Defaults to false on the participant lab.
   */
  canFacilitatorOverride?: boolean;
  onFacilitatorOverride?: (input: {
    submissionId: string;
    scoreBand: TrainingAiAssessmentScoreBand;
  }) => void | Promise<void>;
};

const SCORE_BAND_LABELS: Record<TrainingAiAssessmentScoreBand, string> = {
  proficient: "Proficient",
  developing: "Developing",
  needs_retry: "Needs retry",
  not_graded: "Not graded",
};

const SCORE_BAND_TONES: Record<TrainingAiAssessmentScoreBand, string> = {
  proficient: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  developing: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  needs_retry: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  not_graded: "border-white/10 bg-white/[0.04] text-zinc-300",
};

const FACILITATOR_OVERRIDE_OPTIONS: TrainingAiAssessmentScoreBand[] = [
  "proficient",
  "developing",
  "needs_retry",
];

function formatTimestamp(value?: string | null) {
  if (!value) return "Not submitted yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status: TrainingSubmissionRecord["status"]) {
  if (status === "reviewed") return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100";
  if (status === "submitted") return "border-sky-400/20 bg-sky-400/[0.08] text-sky-100";
  return "border-white/10 bg-white/[0.03] text-zinc-300";
}

function AssessmentBlock({
  assessment,
  submissionId,
  canFacilitatorOverride,
  onFacilitatorOverride,
}: {
  assessment: TrainingAiAssessmentRecord;
  submissionId: string;
  canFacilitatorOverride: boolean;
  onFacilitatorOverride?: (input: {
    submissionId: string;
    scoreBand: TrainingAiAssessmentScoreBand;
  }) => void | Promise<void>;
}) {
  const effectiveBand =
    assessment.facilitatorOverride?.scoreBand ?? assessment.scoreBand;
  const overridden = Boolean(assessment.facilitatorOverride?.scoreBand);
  return (
    <div className="space-y-2 rounded-xl border border-white/8 bg-[#070b13] px-3 py-3 text-xs text-zinc-300">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          AI assessor
        </p>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${SCORE_BAND_TONES[effectiveBand]}`}
        >
          {SCORE_BAND_LABELS[effectiveBand]}
          {overridden ? " (facilitator)" : ""}
        </span>
      </div>
      {assessment.status === "failed" || assessment.status === "skipped" ? (
        <p className="text-[11px] leading-5 text-amber-200">
          {assessment.summary || "AI feedback unavailable for this submission."}
        </p>
      ) : (
        <>
          {assessment.summary ? (
            <p className="leading-5 text-zinc-200">{assessment.summary}</p>
          ) : null}
          {assessment.suggestedNextStep ? (
            <p className="leading-5 text-zinc-400">
              <span className="font-medium text-zinc-200">Next step:</span>{" "}
              {assessment.suggestedNextStep}
            </p>
          ) : null}
          {assessment.criterionScores.length > 0 ? (
            <ul className="space-y-1.5 pt-1">
              {assessment.criterionScores.map((entry, index) => (
                <li
                  key={`${submissionId}-criterion-${index}`}
                  className="flex items-start gap-2"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${SCORE_BAND_TONES[entry.score]}`}
                  >
                    {SCORE_BAND_LABELS[entry.score]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-zinc-200">{entry.criterion}</p>
                    {entry.notes ? (
                      <p className="text-zinc-500">{entry.notes}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      {assessment.facilitatorOverride?.notes ? (
        <p className="rounded-lg border border-white/8 bg-white/[0.02] px-2 py-2 text-[11px] text-zinc-300">
          <span className="font-medium text-zinc-100">Facilitator note:</span>{" "}
          {assessment.facilitatorOverride.notes}
        </p>
      ) : null}
      {canFacilitatorOverride && onFacilitatorOverride ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">
            Override
          </span>
          {FACILITATOR_OVERRIDE_OPTIONS.map((band) => (
            <button
              key={band}
              type="button"
              onClick={() =>
                void onFacilitatorOverride({ submissionId, scoreBand: band })
              }
              className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                effectiveBand === band
                  ? SCORE_BAND_TONES[band]
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              {SCORE_BAND_LABELS[band]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionPanel({
  submissions,
  activeNotebookSlug,
  canSubmit,
  isSubmitting,
  onSubmit,
  aiAssessments,
  canFacilitatorOverride = false,
  onFacilitatorOverride,
}: SubmissionPanelProps) {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(submissions[0]?.id ?? null);

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [submissions]);

  return (
    <Card className="border-white/8 bg-black/15">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Submissions</CardTitle>
            <CardDescription>
              Capture the current notebook state, console output, chart previews, and generated files for review.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void onSubmit()}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit snapshot"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3 text-xs text-zinc-400">
          Active notebook: <span className="font-mono text-zinc-200">{activeNotebookSlug ?? "None"}</span>
        </div>

        {sortedSubmissions.length > 0 ? (
          <div className="space-y-2">
            {sortedSubmissions.map((submission) => {
              const isExpanded = expandedSubmissionId === submission.id;
              const snapshot =
                submission.metadata && typeof submission.metadata === "object"
                  ? (submission.metadata as {
                      notebookSlug?: string;
                      outputFileNames?: string[];
                      stdout?: string;
                      stderr?: string;
                    })
                  : {};
              const assessment = aiAssessments?.[submission.id] ?? null;

              return (
                <div key={submission.id} className="rounded-xl border border-white/8 bg-white/[0.02]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                    onClick={() => setExpandedSubmissionId((current) => (current === submission.id ? null : submission.id))}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{submission.summary ?? "Notebook snapshot"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{formatTimestamp(submission.submittedAt ?? submission.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {assessment ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SCORE_BAND_TONES[assessment.facilitatorOverride?.scoreBand ?? assessment.scoreBand]}`}
                        >
                          {
                            SCORE_BAND_LABELS[
                              assessment.facilitatorOverride?.scoreBand ?? assessment.scoreBand
                            ]
                          }
                        </span>
                      ) : null}
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusTone(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2 border-t border-white/8 px-3 py-3 text-xs text-zinc-300">
                      {assessment ? (
                        <AssessmentBlock
                          assessment={assessment}
                          submissionId={submission.id}
                          canFacilitatorOverride={canFacilitatorOverride}
                          onFacilitatorOverride={onFacilitatorOverride}
                        />
                      ) : null}
                      <p>
                        Notebook: <span className="font-mono text-zinc-100">{snapshot.notebookSlug ?? "unknown"}</span>
                      </p>
                      <p>
                        Output files:{" "}
                        <span className="text-zinc-100">
                          {snapshot.outputFileNames?.length ? snapshot.outputFileNames.join(", ") : "None"}
                        </span>
                      </p>
                      {submission.scoreBand ? (
                        <p>
                          Review band: <span className="text-zinc-100">{submission.scoreBand}</span>
                        </p>
                      ) : null}
                      {snapshot.stderr ? (
                        <pre className="overflow-auto rounded-xl border border-white/8 bg-[#05080d] px-3 py-3 text-[11px] leading-5 text-rose-200">
                          <code>{snapshot.stderr}</code>
                        </pre>
                      ) : snapshot.stdout ? (
                        <pre className="overflow-auto rounded-xl border border-white/8 bg-[#05080d] px-3 py-3 text-[11px] leading-5 text-zinc-300">
                          <code>{snapshot.stdout}</code>
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-3 text-xs text-zinc-500">
            No submissions yet. Run the notebook, then submit a snapshot for review.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
