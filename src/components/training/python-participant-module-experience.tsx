"use client";

import { PythonLearningWorkspace } from "@/components/training/python-learning-workspace";
import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";

type NotebookPreview = {
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

type PythonParticipantModuleExperienceProps = {
  inviteCode: string;
  moduleSlug: string;
  deckHref: string;
  workbookHref: string;
  notebookPreviews: NotebookPreview[];
  resources: ResourceLink[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
  enableProgressTracking?: boolean;
};

export function PythonParticipantModuleExperience({
  inviteCode,
  moduleSlug,
  deckHref,
  workbookHref,
  notebookPreviews,
  resources,
  labCheckpoints,
  initialLabProgress,
  initialSubmissions,
  initialWorkspaces,
  deckState = null,
  facilitatorPrompt = null,
  enableProgressTracking = true,
}: PythonParticipantModuleExperienceProps) {
  return (
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
      enableProgressTracking={enableProgressTracking}
    />
  );
}
