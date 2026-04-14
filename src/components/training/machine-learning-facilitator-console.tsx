"use client";

import {
  getMachineLearningFacilitatorNote,
  getMachineLearningFacilitatorNoteBlocks,
  getMachineLearningFacilitatorQuestions,
  getMachineLearningFacilitatorSlideScript,
} from "@/lib/machine-learning-facilitator";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type MachineLearningFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function MachineLearningFacilitatorConsole({ cohortSnapshots }: MachineLearningFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="machine-learning-training"
      moduleTitle="Machine Learning Training"
      deckHref="/machine-learning-training"
      deckTitle="Machine Learning Training facilitator deck"
      labCheckpoints={resolveTrainingLabCheckpoints("machine-learning-training")}
      getNote={getMachineLearningFacilitatorNote}
      getNoteBlocks={getMachineLearningFacilitatorNoteBlocks}
      getSlideScript={getMachineLearningFacilitatorSlideScript}
      getQuestions={getMachineLearningFacilitatorQuestions}
    />
  );
}
