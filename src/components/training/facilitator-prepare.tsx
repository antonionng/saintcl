"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ModuleMap } from "@/components/training/module-map";
import type { TrainingModuleBlueprint } from "@/lib/training";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { ModuleScriptPack } from "@/lib/training-scripts/types";
import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
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

type FacilitatorPrepareProps = {
  module: TrainingModuleBlueprint;
  scriptPack: ModuleScriptPack | null;
  labCheckpoints: TrainingLabCheckpoint[];
  cohortSnapshots: CohortSnapshot[];
  deckHref: string;
  workbookHref: string | null;
  notebookPreviewPaths: string[];
  resources: Array<{ label: string; href: string; kind: string }>;
  deliverHref: string;
  reviewHref: string;
};

type UnlockState = {
  loading: boolean;
  unlocks: Record<string, boolean>;
  error: string | null;
};

export function FacilitatorPrepare({
  module,
  scriptPack,
  labCheckpoints,
  cohortSnapshots,
  deckHref,
  workbookHref,
  notebookPreviewPaths,
  resources,
  deliverHref,
  reviewHref,
}: FacilitatorPrepareProps) {
  const [selectedInviteCode, setSelectedInviteCode] = useState<string | null>(
    cohortSnapshots[0]?.cohort.inviteCode ?? null,
  );
  const [unlockStateByInvite, setUnlockStateByInvite] = useState<Record<string, UnlockState>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const requestedInvitesRef = useRef<Set<string>>(new Set());

  const selectedCohort = useMemo(
    () => cohortSnapshots.find((snapshot) => snapshot.cohort.inviteCode === selectedInviteCode) ?? null,
    [cohortSnapshots, selectedInviteCode],
  );

  useEffect(() => {
    const inviteCode = selectedCohort?.cohort.inviteCode;
    if (!inviteCode) return;
    if (requestedInvitesRef.current.has(inviteCode)) return;
    requestedInvitesRef.current.add(inviteCode);

    let cancelled = false;
    setUnlockStateByInvite((current) => ({
      ...current,
      [inviteCode]: { loading: true, unlocks: current[inviteCode]?.unlocks ?? {}, error: null },
    }));
    void (async () => {
      try {
        const response = await fetch(
          `/api/training/module-access?inviteCode=${encodeURIComponent(inviteCode)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error("Unable to load module access state.");
        }
        const payload = (await response.json()) as { data?: { unlocks?: Record<string, boolean> } };
        if (cancelled) return;
        setUnlockStateByInvite((current) => ({
          ...current,
          [inviteCode]: { loading: false, unlocks: payload.data?.unlocks ?? {}, error: null },
        }));
      } catch (error) {
        if (cancelled) return;
        requestedInvitesRef.current.delete(inviteCode);
        setUnlockStateByInvite((current) => ({
          ...current,
          [inviteCode]: {
            loading: false,
            unlocks: current[inviteCode]?.unlocks ?? {},
            error: error instanceof Error ? error.message : "Failed to load module access.",
          },
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCohort?.cohort.inviteCode]);

  const isUnlocked = selectedInviteCode
    ? unlockStateByInvite[selectedInviteCode]?.unlocks[module.slug] === true
    : false;

  async function toggleRelease(nextUnlocked: boolean) {
    if (!selectedInviteCode) return;
    const inviteCode = selectedInviteCode;
    const previous = unlockStateByInvite[inviteCode];
    setUnlockStateByInvite((current) => ({
      ...current,
      [inviteCode]: {
        loading: true,
        unlocks: { ...(previous?.unlocks ?? {}), [module.slug]: nextUnlocked },
        error: null,
      },
    }));
    try {
      const response = await fetch("/api/training/module-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug: module.slug,
          unlocked: nextUnlocked,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to update module access.");
      }
      setUnlockStateByInvite((current) => ({
        ...current,
        [inviteCode]: {
          loading: false,
          unlocks: { ...(previous?.unlocks ?? {}), [module.slug]: nextUnlocked },
          error: null,
        },
      }));
      setStatusMessage(
        nextUnlocked ? "Module released for this cohort." : "Module locked back to scheduled release.",
      );
    } catch (error) {
      setUnlockStateByInvite((current) => ({
        ...current,
        [inviteCode]: {
          loading: false,
          unlocks: previous?.unlocks ?? {},
          error: error instanceof Error ? error.message : "Failed to update module access.",
        },
      }));
    }
  }

  const totalSlides = scriptPack?.totalSlides ?? 0;
  const segments = scriptPack?.segments ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        {scriptPack ? (
          <ModuleMap
            moduleTitle={module.title}
            totalSlides={totalSlides}
            segments={segments}
            labCheckpoints={labCheckpoints}
          />
        ) : (
          <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5 text-sm text-zinc-400">
            Module map will appear here once a script pack is registered for this module.
          </section>
        )}

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Lab checkpoints</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {labCheckpoints.length} checkpoint{labCheckpoints.length === 1 ? "" : "s"} configured
              </h2>
            </div>
          </header>
          {labCheckpoints.length > 0 ? (
            <ul className="space-y-2">
              {labCheckpoints.map((checkpoint) => (
                <li
                  key={checkpoint.slug}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-white">{checkpoint.title}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Slides {checkpoint.startSlide} - {checkpoint.endSlide}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{checkpoint.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">
              No lab checkpoints are configured for this module.
            </p>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Resources</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Materials and references</h2>
          </header>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={deckHref}
              className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Deck</p>
              <p className="mt-1 font-medium">Open facilitator deck preview</p>
            </Link>
            {workbookHref ? (
              <Link
                href={workbookHref}
                className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Workbook</p>
                <p className="mt-1 font-medium">Participant workbook</p>
              </Link>
            ) : null}
            {notebookPreviewPaths.map((path) => (
              <Link
                key={path}
                href={path}
                className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Notebook</p>
                <p className="mt-1 font-medium">{path.split("/").pop() ?? path}</p>
              </Link>
            ))}
            {resources.map((resource) => (
              <Link
                key={`${resource.kind}-${resource.href}`}
                href={resource.href}
                className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{resource.kind}</p>
                <p className="mt-1 font-medium">{resource.label}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Module overview</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{module.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{module.summary}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {module.durationDays} {module.durationDays === 1 ? "day" : "days"} · {module.hoursPerDay}h per day · {module.dates.startsOn} to {module.dates.endsOn}
            </p>
          </header>
          <ul className="space-y-1 text-sm text-zinc-300">
            {module.learningObjectives.slice(0, 4).map((objective) => (
              <li key={objective} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-300/80" aria-hidden />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={deliverHref}
              className="inline-flex rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-1.5 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20"
            >
              Start delivering
            </Link>
            <Link
              href={reviewHref}
              className="inline-flex rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-sm text-white transition hover:bg-white/[0.06]"
            >
              Review past sessions
            </Link>
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 p-5">
          <header className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Module release</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Cohort access controls</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Participants can only open this module after the previous one is completed unless you release it early.
            </p>
          </header>

          {cohortSnapshots.length === 0 ? (
            <p className="text-sm text-zinc-400">No cohorts are currently provisioned.</p>
          ) : (
            <>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Cohort</span>
                <select
                  value={selectedInviteCode ?? ""}
                  onChange={(event) => {
                    setSelectedInviteCode(event.target.value || null);
                    setStatusMessage(null);
                  }}
                  className="mt-1 w-full rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                >
                  {cohortSnapshots.map((snapshot) => (
                    <option key={snapshot.cohort.id} value={snapshot.cohort.inviteCode ?? ""}>
                      {snapshot.cohort.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCohort ? (
                <div className="mt-3 space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
                  <p>
                    {selectedCohort.stats.participantCount} participants ·{" "}
                    {selectedCohort.stats.activeParticipantCount} active ·{" "}
                    {selectedCohort.stats.averageProgress.toFixed(0)}% average progress
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {module.title}
                      </p>
                      <p className="text-sm text-white">
                        {isUnlocked ? "Released for early access" : "Locked to scheduled release"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRelease(!isUnlocked)}
                      disabled={!selectedInviteCode}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        isUnlocked
                          ? "border border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                          : "border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20"
                      }`}
                    >
                      {isUnlocked ? "Lock module" : "Release module"}
                    </button>
                  </div>
                  {statusMessage ? (
                    <p className="text-xs text-zinc-400">{statusMessage}</p>
                  ) : null}
                  {selectedInviteCode && unlockStateByInvite[selectedInviteCode]?.error ? (
                    <p className="text-xs text-amber-300">
                      {unlockStateByInvite[selectedInviteCode]?.error}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
