"use client";

import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import { PythonLearningWorkspace } from "@/components/training/python-studio-workspace";
import { PythonParticipantModuleExperience } from "@/components/training/python-participant-module-experience";
import { TrainingParticipantCheckpointExperience } from "@/components/training/training-participant-checkpoint-experience";
import { CohortOrientationWorkbench } from "@/components/training/workbenches/cohort-orientation-workbench";
import { FlowDesignerWorkbench } from "@/components/training/workbenches/flow-designer-workbench";
import { MlLabWorkbench } from "@/components/training/workbenches/ml-lab-workbench";
import { NeuralLabWorkbench } from "@/components/training/workbenches/neural-lab-workbench";
import { PromptStudioWorkbench } from "@/components/training/workbenches/prompt-studio-workbench";
import { StrategyCanvasWorkbench } from "@/components/training/workbenches/strategy-canvas-workbench";
import { VizStudioWorkbench } from "@/components/training/workbenches/viz-studio-workbench";
import type { TrainingParticipantExperience } from "@/lib/training";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type PythonNotebookPreview = {
  slug: string;
  title: string;
  href: string;
  outputFolder: string;
  focus: string[];
  codeBlocks: Array<{
    label: string;
    code: string;
  }>;
  expectedSignals: string[];
};

type ResourceLink = {
  label: string;
  href: string;
  kind: string;
};

export type ParticipantWorkspaceRouterProps = {
  participantExperience: TrainingParticipantExperience;
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  workbookHref: string;
  notebookPreviews: PythonNotebookPreview[];
  resources: ResourceLink[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  deckState: ParticipantDeckState | null;
  facilitatorPrompt: string | null;
  variant?: "module" | "lab";
  initialCheckpointSlug?: string | null;
};

export const EXECUTABLE_WORKSPACE_EXPERIENCES: ReadonlyArray<TrainingParticipantExperience> = [
  "python-workspace",
  "ml-lab",
  "neural-lab",
  "viz-studio",
];

export function usesExecutableWorkspace(experience: TrainingParticipantExperience) {
  return EXECUTABLE_WORKSPACE_EXPERIENCES.includes(experience);
}

export function ParticipantWorkspaceRouter(props: ParticipantWorkspaceRouterProps) {
  const {
    participantExperience,
    inviteCode,
    moduleSlug,
    moduleTitle,
    deckHref,
    workbookHref,
    notebookPreviews,
    resources,
    labCheckpoints,
    initialLabProgress,
    initialSubmissions,
    initialWorkspaces,
    deckState,
    facilitatorPrompt,
    variant = "module",
    initialCheckpointSlug = null,
  } = props;

  const pythonWorkspace =
    variant === "lab" ? (
      <PythonLearningWorkspace
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        deckHref={deckHref}
        workbookHref={workbookHref}
        notebookPreviews={notebookPreviews}
        resources={resources}
        labCheckpoints={labCheckpoints}
        initialLabProgress={initialLabProgress}
        initialSubmissions={initialSubmissions}
        initialWorkspaces={initialWorkspaces}
        currentSlideIndex={deckState?.slideIndex ?? null}
        currentSlideTitle={deckState?.title ?? null}
        facilitatorPrompt={facilitatorPrompt}
        variant="lab"
        initialCheckpointSlug={initialCheckpointSlug}
      />
    ) : (
      <PythonParticipantModuleExperience
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        deckHref={deckHref}
        workbookHref={workbookHref}
        notebookPreviews={notebookPreviews}
        resources={resources}
        labCheckpoints={labCheckpoints}
        initialLabProgress={initialLabProgress}
        initialSubmissions={initialSubmissions}
        initialWorkspaces={initialWorkspaces}
        deckState={deckState}
        facilitatorPrompt={facilitatorPrompt}
      />
    );

  const checkpointWorkspace = (
    <TrainingParticipantCheckpointExperience
      inviteCode={inviteCode}
      moduleSlug={moduleSlug}
      moduleTitle={moduleTitle}
      labCheckpoints={labCheckpoints}
      initialLabProgress={initialLabProgress}
      deckState={deckState}
      facilitatorPrompt={facilitatorPrompt}
    />
  );

  switch (participantExperience) {
    case "python-workspace":
      return pythonWorkspace;
    case "ml-lab":
      return (
        <MlLabWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          deckHref={deckHref}
          workbookHref={workbookHref}
          notebookPreviews={notebookPreviews}
          resources={resources}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          initialWorkspaces={initialWorkspaces}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
          variant={variant}
          initialCheckpointSlug={initialCheckpointSlug}
        />
      );
    case "neural-lab":
      return (
        <NeuralLabWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          deckHref={deckHref}
          workbookHref={workbookHref}
          notebookPreviews={notebookPreviews}
          resources={resources}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          initialWorkspaces={initialWorkspaces}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
          variant={variant}
          initialCheckpointSlug={initialCheckpointSlug}
        />
      );
    case "viz-studio":
      return (
        <VizStudioWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          deckHref={deckHref}
          workbookHref={workbookHref}
          notebookPreviews={notebookPreviews}
          resources={resources}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          initialWorkspaces={initialWorkspaces}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
          variant={variant}
          initialCheckpointSlug={initialCheckpointSlug}
        />
      );
    case "cohort-orientation":
      return (
        <CohortOrientationWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
        />
      );
    case "flow-designer":
      return (
        <FlowDesignerWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
        />
      );
    case "strategy-canvas":
      return (
        <StrategyCanvasWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
        />
      );
    case "prompt-studio":
      return (
        <PromptStudioWorkbench
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleTitle={moduleTitle}
          labCheckpoints={labCheckpoints}
          initialLabProgress={initialLabProgress}
          initialSubmissions={initialSubmissions}
          deckState={deckState}
          facilitatorPrompt={facilitatorPrompt}
        />
      );
    case "checkpoint":
    case "deck":
    default:
      return checkpointWorkspace;
  }
}

export default ParticipantWorkspaceRouter;
