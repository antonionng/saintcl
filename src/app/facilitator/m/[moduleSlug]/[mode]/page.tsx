import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FacilitatorPrepare } from "@/components/training/facilitator-prepare";
import {
  FacilitatorReview,
  type CohortReviewSummary,
} from "@/components/training/facilitator-review";
import { getFacilitatorConsoleEntry } from "@/components/training/facilitator-console-registry";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import {
  ajbTrainingProgramme,
  getTrainingModuleDelivery,
  getTrainingModuleDeck,
  getTrainingModuleResources,
  getTrainingModuleNotebookPreviewPaths,
  getTrainingModuleWorkbookHref,
} from "@/lib/training";
import {
  getTrainingCohortSnapshots,
  getTrainingParticipantLabCheckpointProgressByInvite,
  listAssessmentAttemptsForCohort,
  getAssessmentsForModule,
  getTrainingProgrammeBySlug,
  getTrainingModulesForProgramme,
} from "@/lib/training-dal";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";
import { getModuleScriptPack } from "@/lib/training-scripts/registry";

const VALID_MODES = ["prepare", "deliver", "review"] as const;
type FacilitatorMode = (typeof VALID_MODES)[number];

type PageProps = {
  params: Promise<{ moduleSlug: string; mode: string }>;
};

function isFacilitatorMode(value: string): value is FacilitatorMode {
  return (VALID_MODES as readonly string[]).includes(value);
}

function modeLabel(mode: FacilitatorMode) {
  switch (mode) {
    case "prepare":
      return "Prepare";
    case "deliver":
      return "Deliver";
    case "review":
      return "Review";
    default:
      return mode;
  }
}

function modeDescription(mode: FacilitatorMode) {
  switch (mode) {
    case "prepare":
      return "Get the module ready: scan the slide map, scope lab checkpoints, and release the module to your cohort.";
    case "deliver":
      return "Live delivery: present slides, watch the cohort drift, and run lab checkpoints in real time.";
    case "review":
      return "After class: review participant progress, lab completion, and pending assessments.";
    default:
      return "";
  }
}

function buildModeHref(moduleSlug: string, mode: FacilitatorMode) {
  return `/facilitator/m/${moduleSlug}/${mode}`;
}

export default async function FacilitatorModulePage({ params }: PageProps) {
  const { moduleSlug, mode } = await params;

  if (!isFacilitatorMode(mode)) {
    redirect(`/facilitator/m/${moduleSlug}/prepare`);
  }

  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.canManagePlatformTraining) {
    redirect("/dashboard");
  }

  const module = ajbTrainingProgramme.modules.find((entry) => entry.slug === moduleSlug);
  if (!module) {
    notFound();
  }

  const consoleEntry = getFacilitatorConsoleEntry(moduleSlug);
  if (!consoleEntry) {
    notFound();
  }

  const cohortSnapshots = await getTrainingCohortSnapshots();
  const labCheckpoints = resolveTrainingLabCheckpoints(moduleSlug);
  const scriptPack = getModuleScriptPack(moduleSlug);
  const delivery = getTrainingModuleDelivery(moduleSlug);
  const deck = getTrainingModuleDeck(moduleSlug);
  const workbookHref = getTrainingModuleWorkbookHref(moduleSlug);
  const notebookPreviewPaths = getTrainingModuleNotebookPreviewPaths(moduleSlug);
  const resources = getTrainingModuleResources(moduleSlug);

  const prepareHref = buildModeHref(moduleSlug, "prepare");
  const deliverHref = buildModeHref(moduleSlug, "deliver");
  const reviewHref = buildModeHref(moduleSlug, "review");

  const ConsoleComponent = consoleEntry.Component;

  let reviewByInvite: Record<string, CohortReviewSummary> = {};
  if (mode === "review") {
    const programme = await getTrainingProgrammeBySlug(ajbTrainingProgramme.slug);
    let assessmentIds: string[] = [];
    if (programme) {
      const modules = await getTrainingModulesForProgramme(programme.id);
      const persistedModule = modules.find((entry) => entry.slug === moduleSlug);
      if (persistedModule) {
        const { assessments } = await getAssessmentsForModule(persistedModule.id);
        assessmentIds = assessments.map((assessment) => assessment.id);
      }
    }

    const summaries = await Promise.all(
      cohortSnapshots.map(async (snapshot) => {
        if (!snapshot.cohort.inviteCode) return null;
        const inviteCode = snapshot.cohort.inviteCode;
        const [participantLabCheckpoints, attempts] = await Promise.all([
          getTrainingParticipantLabCheckpointProgressByInvite({
            inviteCode,
            moduleSlug,
          }),
          listAssessmentAttemptsForCohort({ cohortId: snapshot.cohort.id }),
        ]);
        const moduleAttempts = attempts.filter((attempt) =>
          assessmentIds.length === 0 ? true : assessmentIds.includes(attempt.assessmentId),
        );
        const summary: CohortReviewSummary = {
          inviteCode,
          participantLabCheckpoints,
          totalAssessmentAttempts: moduleAttempts.length,
          submittedAssessmentCount: moduleAttempts.filter((attempt) => attempt.status === "submitted").length,
          approvedAssessmentCount: moduleAttempts.filter((attempt) => attempt.facilitatorReviewStatus === "approved").length,
          pendingAssessmentCount: moduleAttempts.filter((attempt) => attempt.facilitatorReviewStatus === "pending").length,
        };
        return summary;
      }),
    );

    for (const summary of summaries) {
      if (summary) {
        reviewByInvite[summary.inviteCode] = summary;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              <Link href="/facilitator" className="hover:text-zinc-300">
                Facilitator hub
              </Link>
              <span className="mx-2 text-zinc-600">/</span>
              {module.title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {module.title} · {modeLabel(mode)}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{modeDescription(mode)}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Facilitator mode">
            {VALID_MODES.map((option) => {
              const isActive = option === mode;
              return (
                <Link
                  key={option}
                  href={buildModeHref(moduleSlug, option)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    isActive
                      ? "border border-sky-400/40 bg-sky-400/10 text-sky-100"
                      : "border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {modeLabel(option)}
                </Link>
              );
            })}
          </nav>
        </header>

        {mode === "prepare" ? (
          <FacilitatorPrepare
            module={module}
            scriptPack={scriptPack}
            labCheckpoints={labCheckpoints}
            cohortSnapshots={cohortSnapshots}
            deckHref={deck?.href ?? consoleEntry.deckHref}
            workbookHref={workbookHref}
            notebookPreviewPaths={notebookPreviewPaths}
            resources={resources}
            deliverHref={deliverHref}
            reviewHref={reviewHref}
          />
        ) : null}

        {mode === "deliver" ? <ConsoleComponent cohortSnapshots={cohortSnapshots} /> : null}

        {mode === "review" ? (
          <FacilitatorReview
            module={module}
            labCheckpoints={labCheckpoints}
            cohortSnapshots={cohortSnapshots}
            reviewByInvite={reviewByInvite}
            prepareHref={prepareHref}
            deliverHref={deliverHref}
            assessmentReviewHref="/facilitator/assessments"
          />
        ) : null}
      </div>
    </div>
  );
}
