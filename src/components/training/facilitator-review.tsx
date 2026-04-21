"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TrainingModuleBlueprint } from "@/lib/training";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingParticipantRecord,
} from "@/types";

type CohortSnapshot = {
  cohort: TrainingCohortRecord;
  participants: TrainingParticipantRecord[];
  enrollments: TrainingEnrollmentRecord[];
  stats: {
    participantCount: number;
    activeParticipantCount: number;
    completedEnrollmentCount: number;
    activeEnrollmentCount: number;
    averageProgress: number;
  };
};

export type CohortReviewSummary = {
  inviteCode: string;
  participantLabCheckpoints: TrainingParticipantLabCheckpointRecord[];
  pendingAssessmentCount: number;
  submittedAssessmentCount: number;
  approvedAssessmentCount: number;
  totalAssessmentAttempts: number;
};

type FacilitatorReviewProps = {
  module: TrainingModuleBlueprint;
  labCheckpoints: TrainingLabCheckpoint[];
  cohortSnapshots: CohortSnapshot[];
  reviewByInvite: Record<string, CohortReviewSummary>;
  prepareHref: string;
  deliverHref: string;
  assessmentReviewHref: string;
};

function statusToTone(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100";
    case "active":
    case "launched":
      return "border-sky-400/30 bg-sky-400/[0.08] text-sky-100";
    case "invited":
      return "border-amber-400/30 bg-amber-400/[0.08] text-amber-100";
    default:
      return "border-white/10 bg-white/[0.04] text-zinc-300";
  }
}

export function FacilitatorReview({
  module,
  labCheckpoints,
  cohortSnapshots,
  reviewByInvite,
  prepareHref,
  deliverHref,
  assessmentReviewHref,
}: FacilitatorReviewProps) {
  const [selectedInviteCode, setSelectedInviteCode] = useState<string | null>(
    cohortSnapshots[0]?.cohort.inviteCode ?? null,
  );

  const selectedCohort = useMemo(
    () => cohortSnapshots.find((snapshot) => snapshot.cohort.inviteCode === selectedInviteCode) ?? null,
    [cohortSnapshots, selectedInviteCode],
  );

  const review = selectedInviteCode ? reviewByInvite[selectedInviteCode] ?? null : null;

  const participantRows = useMemo(() => {
    if (!selectedCohort) return [];
    const moduleEnrollments = selectedCohort.enrollments.filter((enrollment) => {
      return true;
    });
    return selectedCohort.participants.map((participant) => {
      const enrollment = moduleEnrollments.find((item) => item.participantId === participant.id);
      const checkpointRecords = (review?.participantLabCheckpoints ?? []).filter(
        (item) => item.participant.id === participant.id,
      );
      const completedCount = checkpointRecords.filter((item) => item.status === "completed").length;
      const activeCount = checkpointRecords.filter((item) => item.status === "launched").length;
      return {
        participant,
        enrollment,
        completedCount,
        activeCount,
        totalCheckpoints: labCheckpoints.length,
      };
    });
  }, [labCheckpoints.length, review?.participantLabCheckpoints, selectedCohort]);

  const completionRate = selectedCohort
    ? selectedCohort.stats.participantCount > 0
      ? (selectedCohort.stats.completedEnrollmentCount / selectedCohort.stats.participantCount) * 100
      : 0
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Cohort review</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Participant outcomes</h2>
            </div>
            {cohortSnapshots.length > 1 ? (
              <select
                value={selectedInviteCode ?? ""}
                onChange={(event) => setSelectedInviteCode(event.target.value || null)}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
              >
                {cohortSnapshots.map((snapshot) => (
                  <option key={snapshot.cohort.id} value={snapshot.cohort.inviteCode ?? ""}>
                    {snapshot.cohort.name}
                  </option>
                ))}
              </select>
            ) : selectedCohort ? (
              <p className="text-sm text-zinc-400">{selectedCohort.cohort.name}</p>
            ) : null}
          </header>

          {!selectedCohort ? (
            <p className="text-sm text-zinc-400">No cohorts available for review.</p>
          ) : participantRows.length === 0 ? (
            <p className="text-sm text-zinc-400">No participants have checked in yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-3 font-normal">Participant</th>
                    <th className="pb-2 pr-3 font-normal">Status</th>
                    <th className="pb-2 pr-3 font-normal">Module progress</th>
                    <th className="pb-2 font-normal">Lab checkpoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {participantRows.map((row) => (
                    <tr key={row.participant.id} className="align-top">
                      <td className="py-2 pr-3">
                        <p className="font-medium text-white">{row.participant.fullName}</p>
                        <p className="text-xs text-zinc-500">{row.participant.email}</p>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusToTone(
                            row.participant.status,
                          )}`}
                        >
                          {row.participant.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {row.enrollment ? (
                          <div>
                            <p className="text-white">{row.enrollment.progressPercent.toFixed(0)}%</p>
                            <p className="text-xs text-zinc-500 capitalize">{row.enrollment.status}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">No activity</span>
                        )}
                      </td>
                      <td className="py-2">
                        <p className="text-white">
                          {row.completedCount}/{row.totalCheckpoints} completed
                        </p>
                        {row.activeCount > 0 ? (
                          <p className="text-xs text-zinc-500">{row.activeCount} in progress</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Lab checkpoint health</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Where the cohort got stuck</h2>
          </header>
          {labCheckpoints.length === 0 || !review ? (
            <p className="text-sm text-zinc-400">No lab checkpoint data available yet.</p>
          ) : (
            <ul className="space-y-2">
              {labCheckpoints.map((checkpoint) => {
                const matching = (review.participantLabCheckpoints ?? []).filter(
                  (item) => item.labSlug === checkpoint.slug,
                );
                const completed = matching.filter((item) => item.status === "completed").length;
                const launched = matching.filter((item) => item.status === "launched").length;
                const total = selectedCohort?.stats.participantCount ?? matching.length;
                const completionPercent = total > 0 ? (completed / total) * 100 : 0;
                return (
                  <li
                    key={checkpoint.slug}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-white">{checkpoint.title}</p>
                      <p className="text-xs text-zinc-400">
                        {completed}/{total} completed{launched > 0 ? ` · ${launched} active` : ""}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-emerald-400/60"
                        style={{ width: `${Math.min(100, completionPercent)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Cohort summary</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{module.title}</h2>
          </header>
          {selectedCohort ? (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Participants</span>
                <span className="text-white">{selectedCohort.stats.participantCount}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Active</span>
                <span className="text-white">{selectedCohort.stats.activeParticipantCount}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Completed</span>
                <span className="text-white">{selectedCohort.stats.completedEnrollmentCount}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Completion rate</span>
                <span className="text-white">{completionRate.toFixed(0)}%</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Average progress</span>
                <span className="text-white">{selectedCohort.stats.averageProgress.toFixed(0)}%</span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Select a cohort to see its summary.</p>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Assessments</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Review queue</h2>
          </header>
          {review ? (
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Total attempts</span>
                <span className="text-white">{review.totalAssessmentAttempts}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Submitted</span>
                <span className="text-white">{review.submittedAssessmentCount}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Approved</span>
                <span className="text-white">{review.approvedAssessmentCount}</span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-zinc-500">Pending facilitator review</span>
                <span className={`font-medium ${review.pendingAssessmentCount > 0 ? "text-amber-200" : "text-white"}`}>
                  {review.pendingAssessmentCount}
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">No assessment activity yet.</p>
          )}
          <Link
            href={assessmentReviewHref}
            className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.06]"
          >
            Open review queue
          </Link>
        </section>

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Quick actions</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Jump back in</h2>
          </header>
          <div className="flex flex-wrap gap-2">
            <Link
              href={prepareHref}
              className="inline-flex rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.06]"
            >
              Prepare next session
            </Link>
            <Link
              href={deliverHref}
              className="inline-flex rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:bg-sky-400/20"
            >
              Open delivery console
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
