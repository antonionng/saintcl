import { redirect } from "next/navigation";

import { LabMode } from "@/components/training/lab-mode";
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
  getTrainingModuleUnlockMapByInvite,
  getTrainingModulesForProgramme,
  getTrainingParticipantByCheckInToken,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantLabCheckpointProgressByCheckInToken,
} from "@/lib/training-dal";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type NotebookFileCell = {
  cell_type?: string;
  source?: string[] | string;
};

type NotebookFileShape = {
  cells?: NotebookFileCell[];
};

function joinNotebookCellSource(source?: string[] | string) {
  if (Array.isArray(source)) return source.join("");
  if (typeof source === "string") return source;
  return "";
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
    codeBlocks:
      codeBlocks.length > 0
        ? codeBlocks
        : [{ label: "Setup block", code: codeSource.trim() }],
  };
}

function inferNotebookSlug(href: string, index: number) {
  const basename =
    href.split("/").pop()?.replace(/\.ipynb$/i, "") ?? `notebook-${index + 1}`;
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
  return Promise.all(
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
}

export default async function AcademyLabPage({
  params,
}: {
  params: Promise<{ inviteCode: string; moduleSlug: string; activitySlug: string }>;
}) {
  const { inviteCode, moduleSlug, activitySlug } = await params;
  const moduleBackHref = `/academy/${inviteCode}/${moduleSlug}`;

  const trainingModule = ajbTrainingProgramme.modules.find(
    (candidate) => candidate.slug === moduleSlug,
  );
  if (!trainingModule) {
    redirect(`/academy/${inviteCode}`);
  }

  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  if (!cohort) {
    redirect(`/academy/${inviteCode}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieParticipantSession = checkInToken
    ? await getTrainingParticipantByCheckInToken(checkInToken)
    : null;
  const authParticipantSession = user
    ? await getTrainingParticipantByInviteForAuthUser({
        inviteCode,
        authUserId: user.id,
        email: user.email ?? null,
      })
    : null;
  const participantSession =
    cookieParticipantSession?.cohort?.id === cohort.id
      ? cookieParticipantSession
      : authParticipantSession;

  if (!participantSession || participantSession.cohort?.id !== cohort.id) {
    redirect(`/academy/${inviteCode}`);
  }

  const [syncedModules, facilitatorUnlocks] = await Promise.all([
    getTrainingModulesForProgramme(cohort.programmeId),
    getTrainingModuleUnlockMapByInvite(inviteCode),
  ]);
  const moduleAccessStates = buildParticipantModuleAccessState({
    modules: ajbTrainingProgramme.modules,
    syncedModules,
    enrollments: participantSession?.enrollments ?? [],
    facilitatorUnlocks,
  });
  const currentAccess = moduleAccessStates.find((item) => item.moduleSlug === moduleSlug);
  if (!currentAccess?.canOpen) {
    redirect(`/academy/${inviteCode}`);
  }

  const moduleLabCheckpoints = resolveTrainingLabCheckpoints(moduleSlug);
  const activeCheckpoint = moduleLabCheckpoints.find(
    (item) => item.slug === activitySlug,
  );
  if (!activeCheckpoint) {
    redirect(moduleBackHref);
  }

  const moduleResources = getTrainingModuleResources(moduleSlug);
  const moduleDeck = getTrainingModuleDeck(moduleSlug);
  const moduleWorkbookHref = getTrainingModuleWorkbookHref(moduleSlug) ?? "#";
  const participantExperience = getTrainingModuleParticipantExperience(moduleSlug);
  const executableNotebookResources = moduleResources.filter(
    (resource) => resource.kind === "notebook",
  );
  const experiencesWithExecutableNotebooks: Array<typeof participantExperience> = [
    "python-workspace",
    "ml-lab",
    "neural-lab",
    "viz-studio",
  ];
  const wantsExecutableNotebooks =
    experiencesWithExecutableNotebooks.includes(participantExperience);
  const pythonWorkspacePreviews = wantsExecutableNotebooks
    ? await getExecutableWorkspacePreviews({
        notebookResources: executableNotebookResources.map((resource) => ({
          label: resource.label,
          href: resource.href,
        })),
        successSignals: trainingModule.labs.map((lab) => lab.successSignal),
      })
    : [];

  const initialLabProgress = checkInToken
    ? await getTrainingParticipantLabCheckpointProgressByCheckInToken({
        checkInToken,
        moduleSlug,
      })
    : [];

  const syncedTrainingModule = syncedModules.find(
    (candidate) => candidate.slug === moduleSlug,
  );
  const initialSubmissions =
    syncedTrainingModule && participantSession
      ? participantSession.submissions.filter(
          (submission) => submission.moduleId === syncedTrainingModule.id,
        )
      : [];
  const initialWorkspaces =
    syncedTrainingModule && participantSession
      ? participantSession.workspaces.filter(
          (workspace) => workspace.moduleId === syncedTrainingModule.id,
        )
      : [];

  return (
    <LabMode
      inviteCode={inviteCode}
      moduleSlug={trainingModule.slug}
      moduleTitle={trainingModule.title}
      deckHref={moduleDeck?.href ?? moduleBackHref}
      deckBackHref={moduleBackHref}
      workbookHref={moduleWorkbookHref}
      participantExperience={participantExperience}
      resources={moduleResources}
      pythonNotebookPreviews={pythonWorkspacePreviews}
      labCheckpoints={moduleLabCheckpoints}
      activeCheckpointSlug={activeCheckpoint.slug}
      initialLabProgress={initialLabProgress}
      initialSubmissions={initialSubmissions}
      initialWorkspaces={initialWorkspaces}
    />
  );
}
