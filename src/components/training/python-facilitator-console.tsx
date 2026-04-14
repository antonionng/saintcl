"use client";

import {
  getPythonFacilitatorNote,
  getPythonFacilitatorNoteBlocks,
  getPythonFacilitatorQuestions,
  getPythonFacilitatorSlideScript,
} from "@/lib/python-training-facilitator";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type PythonFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function PythonFacilitatorConsole({ cohortSnapshots }: PythonFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="python-for-data"
      moduleTitle="Python for Data"
      deckHref="/python-training"
      deckTitle="Python for Data facilitator deck"
      labCheckpoints={resolveTrainingLabCheckpoints("python-for-data")}
      getNote={getPythonFacilitatorNote}
      getNoteBlocks={getPythonFacilitatorNoteBlocks}
      getSlideScript={getPythonFacilitatorSlideScript}
      getQuestions={getPythonFacilitatorQuestions}
    />
  );
}
