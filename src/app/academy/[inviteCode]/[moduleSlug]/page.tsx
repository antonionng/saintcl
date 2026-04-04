import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { marked } from "marked";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleLearningShell } from "@/components/training/module-learning-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";
import { createClient } from "@/lib/supabase/server";
import { buildParticipantModuleAccessState } from "@/lib/training-access";
import {
  ajbTrainingProgramme,
  getTrainingModuleDeck,
  getTrainingModuleParticipantExperience,
  getTrainingModuleResources,
  getTrainingModuleWorkbookHref,
} from "@/lib/training";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";
import {
  getTrainingCohortByInviteCode,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantLabCheckpointProgressByCheckInToken,
  getTrainingModuleUnlockMapByInvite,
  getTrainingModulesForProgramme,
  getTrainingParticipantByCheckInToken,
} from "@/lib/training-dal";

type NotebookFileCell = {
  cell_type?: string;
  source?: string[] | string;
};

type NotebookFileShape = {
  cells?: NotebookFileCell[];
};

type RenderedNotebookCell = {
  id: string;
  type: "markdown" | "code";
  html?: string;
  source: string;
};

type RenderedNotebookPreview = {
  title: string;
  href: string;
  cells: RenderedNotebookCell[];
};

function isRenderedNotebookPreview(
  notebook: RenderedNotebookPreview | null,
): notebook is RenderedNotebookPreview {
  return notebook !== null;
}

function joinNotebookCellSource(source?: string[] | string) {
  if (Array.isArray(source)) return source.join("");
  if (typeof source === "string") return source;
  return "";
}

function resolveContentPathFromHref(href: string) {
  return resolve(process.cwd(), href.replace(/^\/+/, ""));
}

async function readMaybeFile(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

async function renderWorkbookHtmlFromHref(workbookHref: string) {
  const raw = await readMaybeFile(resolveContentPathFromHref(workbookHref));
  if (!raw) return null;
  return await marked.parse(raw);
}

async function readRenderedNotebookFromHref(input: {
  href: string;
  fallbackTitle: string;
}): Promise<RenderedNotebookPreview | null> {
  const raw = await readMaybeFile(resolveContentPathFromHref(input.href));
  if (!raw) return null;

  const notebook = JSON.parse(raw) as NotebookFileShape;
  const notebookCells = notebook.cells ?? [];
  const firstMarkdownSource = joinNotebookCellSource(
    notebookCells.find((cell) => cell.cell_type === "markdown")?.source,
  );
  const title =
    firstMarkdownSource
      .split("\n")
      .find((line) => line.trim().startsWith("# "))
      ?.replace(/^# /, "")
      .trim() ?? input.fallbackTitle;

  const renderedCells = await Promise.all(
    notebookCells.map(async (cell, index) => {
      const source = joinNotebookCellSource(cell.source).trim();
      if (!source) return null;
      if (cell.cell_type === "markdown") {
        return {
          id: `markdown-${index}`,
          type: "markdown" as const,
          html: await marked.parse(source),
          source,
        };
      }
      if (cell.cell_type === "code") {
        return {
          id: `code-${index}`,
          type: "code" as const,
          source,
        };
      }
      return null;
    }),
  );
  const cells: RenderedNotebookCell[] = renderedCells.flatMap((cell) => (cell ? [cell] : []));

  return {
    title,
    href: input.href,
    cells,
  };
}

async function readNotebookPreview(relativePath: string) {
  const filePath = resolve(process.cwd(), relativePath);
  const raw = await readFile(filePath, "utf8");
  const notebook = JSON.parse(raw) as NotebookFileShape;
  const cells = notebook.cells ?? [];
  const markdownCell = cells.find((cell) => cell.cell_type === "markdown");
  const codeCell = cells.find((cell) => cell.cell_type === "code");

  const markdownSource = joinNotebookCellSource(markdownCell?.source);
  const codeSource = joinNotebookCellSource(codeCell?.source);
  const codeBlocks = cells
    .filter((cell) => cell.cell_type === "code")
    .slice(0, 3)
    .map((cell, index) => ({
      label: index === 0 ? "Setup block" : `Notebook block ${index + 1}`,
      code: joinNotebookCellSource(cell.source),
    }))
    .filter((block) => block.code.trim().length > 0);

  const title =
    markdownSource
      .split("\n")
      .find((line) => line.trim().startsWith("# "))
      ?.replace(/^# /, "")
      .trim() ?? relativePath;

  const focus = markdownSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, "").trim())
    .slice(0, 5);

  return {
    title,
    focus,
    codeBlocks: codeBlocks.length > 0 ? codeBlocks : [{ label: "Setup block", code: codeSource.trim() }],
  };
}

function inferNotebookSlug(href: string, index: number) {
  const basename = href.split("/").pop()?.replace(/\.ipynb$/i, "") ?? `notebook-${index + 1}`;
  const dayMatch = basename.match(/^(day\d+)/i);
  if (dayMatch) {
    return dayMatch[1].toLowerCase();
  }

  return basename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getExecutableWorkspacePreviews(input: {
  notebookResources: Array<{ label: string; href: string }>;
  successSignals: string[];
}) {
  const previews = await Promise.all(
    input.notebookResources.map(async (resource, index) => {
      const relativePath = resource.href.replace(/^\/+/, "");
      const preview = await readNotebookPreview(relativePath);
      const notebookSlug = inferNotebookSlug(resource.href, index);

      return {
        slug: notebookSlug,
        title: preview.title,
        href: resource.href,
        outputFolder: `outputs/${notebookSlug}`,
        focus: preview.focus,
        codeBlocks: preview.codeBlocks,
        expectedSignals:
          input.successSignals.length > 0
            ? input.successSignals.slice(0, 3)
            : [
                "The notebook runs without import or path errors.",
                "Data loads correctly and produces visible output.",
                "Outputs can be saved and reviewed from the workspace file area.",
              ],
      };
    }),
  );

  return previews;
}

export default async function AcademyModulePage({
  params,
}: {
  params: Promise<{ inviteCode: string; moduleSlug: string }>;
}) {
  const { inviteCode, moduleSlug } = await params;
  const trainingModule = ajbTrainingProgramme.modules.find((candidate) => candidate.slug === moduleSlug);
  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieParticipantSession = checkInToken ? await getTrainingParticipantByCheckInToken(checkInToken) : null;
  const authParticipantSession =
    user && cohort
      ? await getTrainingParticipantByInviteForAuthUser({
          inviteCode,
          authUserId: user.id,
          email: user.email ?? null,
        })
      : null;
  const participantSession =
    cookieParticipantSession?.cohort?.id === cohort?.id ? cookieParticipantSession : authParticipantSession;
  const isReviewPreview = !cohort;
  const isPublicReview = isReviewPreview || (Boolean(cohort) && !participantSession);
  const cohortLabel = cohort?.name ?? "AJB review preview";
  const moduleResources = getTrainingModuleResources(moduleSlug);
  const moduleDeck = getTrainingModuleDeck(moduleSlug);
  const moduleWorkbookHref = getTrainingModuleWorkbookHref(moduleSlug) ?? "#";
  const participantExperience = getTrainingModuleParticipantExperience(moduleSlug);
  const executableNotebookResources = moduleResources.filter((resource) => resource.kind === "notebook");
  const pythonWorkspacePreviews =
    participantExperience === "python-workspace"
      ? await getExecutableWorkspacePreviews({
          notebookResources: executableNotebookResources.map((resource) => ({
            label: resource.label,
            href: resource.href,
          })),
          successSignals: trainingModule?.labs.map((lab) => lab.successSignal) ?? [],
        })
      : [];
  const checkpointNotebookResources =
    participantExperience === "checkpoint" ? moduleResources.filter((resource) => resource.kind === "notebook") : [];
  const [workbookHtml, renderedNotebookPreviews] = await Promise.all([
    moduleWorkbookHref !== "#" ? renderWorkbookHtmlFromHref(moduleWorkbookHref) : Promise.resolve(null),
    participantExperience === "checkpoint"
      ? Promise.all(
          checkpointNotebookResources.map((resource) =>
            readRenderedNotebookFromHref({
              href: resource.href,
              fallbackTitle: resource.label,
            }),
          ),
        ).then((items) => items.filter(isRenderedNotebookPreview))
      : Promise.resolve([]),
  ]);
  const moduleLabCheckpoints = resolveTrainingLabCheckpoints(moduleSlug);
  const initialLabProgress =
    moduleLabCheckpoints.length > 0 && checkInToken
      ? await getTrainingParticipantLabCheckpointProgressByCheckInToken({
          checkInToken,
          moduleSlug,
        })
      : [];

  if (!trainingModule) {
    redirect(`/academy/${inviteCode}`);
  }

  const [syncedModules, facilitatorUnlocks] = cohort
    ? await Promise.all([
        getTrainingModulesForProgramme(cohort.programmeId),
        getTrainingModuleUnlockMapByInvite(inviteCode),
      ])
    : [[], {}];
  const moduleAccessStates = buildParticipantModuleAccessState({
    modules: ajbTrainingProgramme.modules,
    syncedModules,
    enrollments: participantSession?.enrollments ?? [],
    facilitatorUnlocks,
  });
  const syncedTrainingModule = syncedModules.find((candidate) => candidate.slug === moduleSlug) ?? null;
  const initialSubmissions =
    syncedTrainingModule && participantSession
      ? participantSession.submissions.filter((submission) => submission.moduleId === syncedTrainingModule.id)
      : [];
  const initialWorkspaces =
    syncedTrainingModule && participantSession
      ? participantSession.workspaces.filter((workspace) => workspace.moduleId === syncedTrainingModule.id)
      : [];
  const currentAccess = moduleAccessStates.find((item) => item.moduleSlug === moduleSlug);

  if (!isPublicReview && !currentAccess?.canOpen) {
    redirect(`/academy/${inviteCode}`);
  }

  const moduleIndex = ajbTrainingProgramme.modules.findIndex((m) => m.slug === moduleSlug);
  const nextModule = moduleIndex < ajbTrainingProgramme.modules.length - 1
    ? ajbTrainingProgramme.modules[moduleIndex + 1]
    : null;
  const prevModule = moduleIndex > 0
    ? ajbTrainingProgramme.modules[moduleIndex - 1]
    : null;
  const moduleJourneySteps = trainingModule.contentModel.sections;
  const moduleDeliverables = [...trainingModule.coreOutputs, ...trainingModule.labs.map((lab) => lab.deliverable)];
  const validationSignals = [
    `${moduleLabCheckpoints.length || trainingModule.labs.length} guided checkpoints`,
    ...trainingModule.labs.map((lab) => lab.successSignal),
  ];
  const moduleConnectionCopy = prevModule
    ? `This module builds on ${prevModule.title} and prepares you for ${nextModule?.title ?? "the programme close"}.`
    : `This is the foundation module for the full programme and sets up ${nextModule?.title ?? "the next stage"}.`;
  const defaultModuleTab = currentAccess?.enrollmentStatus === "in_progress" ? "workspace" : "overview";
  const progressLabel = isPublicReview
    ? "Review mode"
    : currentAccess?.enrollmentStatus === "completed"
      ? "Completed"
      : currentAccess?.enrollmentStatus === "in_progress"
        ? `${Math.round(currentAccess?.progressPercent ?? 0)}% complete`
        : "Ready to start";
  const shellParticipantExperience =
    participantExperience === "python-workspace" ? "python-workspace" : "checkpoint";

  const navBar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href={`/academy/${inviteCode}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Programme overview
      </Link>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span>Module {trainingModule.sequence} of {ajbTrainingProgramme.modules.length}</span>
        {prevModule ? (
          <>
            <span className="text-white/10">|</span>
            <Link href={`/academy/${inviteCode}/${prevModule.slug}`} className="text-zinc-400 transition hover:text-white">
              Previous
            </Link>
          </>
        ) : null}
        {nextModule ? (
          <>
            <span className="text-white/10">|</span>
            <Link href={`/academy/${inviteCode}/${nextModule.slug}`} className="text-zinc-400 transition hover:text-white">
              Next: {nextModule.title}
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );

  const moduleBrief = (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Why this module matters</CardTitle>
            <CardDescription>{trainingModule.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
              Audience: {trainingModule.audience}
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
              {moduleConnectionCopy}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>How you will know you are done</CardTitle>
            <CardDescription>Validation is visible. You should know what good looks like before you start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {validationSignals.slice(0, 4).map((signal) => (
              <div key={signal} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {signal}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/8 bg-black/10">
        <CardHeader className="pb-3">
          <CardTitle>Your learning journey</CardTitle>
          <CardDescription>Every module follows the same arc so the programme feels cumulative, not fragmented.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
            {moduleJourneySteps.map((section, index) => (
              <div key={section.id} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Step {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-white">{section.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{section.slideCount} slides</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>What you will produce</CardTitle>
            <CardDescription>Concrete outputs help make the learning feel real and useful.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {moduleDeliverables.slice(0, 6).map((deliverable) => (
              <div key={deliverable} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {deliverable}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>What good looks like</CardTitle>
            <CardDescription>These are the signals a learner should be aiming for in this module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {trainingModule.labs.map((lab) => (
              <div key={lab.slug} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <p className="font-medium text-white">{lab.title}</p>
                <p className="mt-1 text-zinc-400">{lab.successSignal}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (moduleDeck && (participantExperience === "python-workspace" || moduleLabCheckpoints.length > 0)) {
    return (
      <div className="flex flex-col gap-6">
        {navBar}
        <ModuleLearningShell
          inviteCode={inviteCode}
          moduleSlug={trainingModule.slug}
          moduleTitle={trainingModule.title}
          moduleSequence={trainingModule.sequence}
          totalModules={ajbTrainingProgramme.modules.length}
          deckHref={moduleDeck.href}
          deckTitle={moduleDeck.title}
          overviewContent={
            <div className="space-y-4">
              {isPublicReview ? (
                <Card className="border-amber-400/20 bg-amber-400/[0.04]">
                  <CardContent className="px-5 py-4 text-sm text-amber-100">
                    This module is open in review mode. Anyone with the link can view the full learning flow. Progress tracking is disabled for anonymous reviewers.
                  </CardContent>
                </Card>
              ) : null}
              {moduleBrief}
            </div>
          }
          progressLabel={progressLabel}
          defaultTab={defaultModuleTab}
          workbookHref={moduleWorkbookHref}
          workbookHtml={workbookHtml}
          resources={moduleResources}
          participantExperience={shellParticipantExperience}
          pythonNotebookPreviews={pythonWorkspacePreviews}
          renderedNotebookPreviews={renderedNotebookPreviews}
          labCheckpoints={moduleLabCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          initialWorkspaces={initialWorkspaces}
          enableProgressTracking={!isPublicReview}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {navBar}
      <PageHeader
        eyebrow={`Module ${trainingModule.sequence} of ${ajbTrainingProgramme.modules.length}`}
        title={trainingModule.title}
          description={`${cohortLabel}. ${trainingModule.summary}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Learning objectives</CardTitle>
          <CardDescription>{trainingModule.durationDays} {trainingModule.durationDays === 1 ? "day" : "days"}, {trainingModule.hoursPerDay} hours per day. Topics: {trainingModule.keyThemes.join(", ")}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {trainingModule.learningObjectives.map((objective) => (
            <div key={objective} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
              {objective}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
