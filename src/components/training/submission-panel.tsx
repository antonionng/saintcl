"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrainingSubmissionRecord } from "@/types";

type SubmissionPanelProps = {
  submissions: TrainingSubmissionRecord[];
  activeNotebookSlug: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
};

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

export function SubmissionPanel({
  submissions,
  activeNotebookSlug,
  canSubmit,
  isSubmitting,
  onSubmit,
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
                    <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusTone(submission.status)}`}>
                      {submission.status}
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2 border-t border-white/8 px-3 py-3 text-xs text-zinc-300">
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
