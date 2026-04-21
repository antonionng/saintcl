"use client";

import {
  getProgrammeOrientationNote,
  getProgrammeOrientationNoteBlocks,
  getProgrammeOrientationQuestions,
  getProgrammeOrientationSlideScript,
} from "@/lib/programme-orientation-facilitator";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type ProgrammeOrientationFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function ProgrammeOrientationFacilitatorConsole({
  cohortSnapshots,
}: ProgrammeOrientationFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="programme-orientation"
      moduleTitle="Programme Orientation"
      deckHref="/programme-orientation"
      deckTitle="Programme Orientation facilitator deck"
      labCheckpoints={resolveTrainingLabCheckpoints("programme-orientation")}
      getNote={getProgrammeOrientationNote}
      getNoteBlocks={getProgrammeOrientationNoteBlocks}
      getSlideScript={getProgrammeOrientationSlideScript}
      getQuestions={getProgrammeOrientationQuestions}
    />
  );
}
