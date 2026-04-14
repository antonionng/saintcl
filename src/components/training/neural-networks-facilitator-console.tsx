"use client";

import {
  getNeuralNetworksFacilitatorNote,
  getNeuralNetworksFacilitatorNoteBlocks,
  getNeuralNetworksFacilitatorQuestions,
  getNeuralNetworksFacilitatorSlideScript,
} from "@/lib/neural-networks-facilitator";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type NeuralNetworksFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function NeuralNetworksFacilitatorConsole({ cohortSnapshots }: NeuralNetworksFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="neural-networks"
      moduleTitle="Neural Networks"
      deckHref="/neural-networks"
      deckTitle="Neural Networks facilitator deck"
      labCheckpoints={resolveTrainingLabCheckpoints("neural-networks")}
      getNote={getNeuralNetworksFacilitatorNote}
      getNoteBlocks={getNeuralNetworksFacilitatorNoteBlocks}
      getSlideScript={getNeuralNetworksFacilitatorSlideScript}
      getQuestions={getNeuralNetworksFacilitatorQuestions}
    />
  );
}
