"use client";

import {
  getAdvancedDataVisualizationFacilitatorNote,
  getAdvancedDataVisualizationFacilitatorNoteBlocks,
  getAdvancedDataVisualizationFacilitatorQuestions,
  getAdvancedDataVisualizationFacilitatorSlideScript,
} from "@/lib/advanced-data-visualization-facilitator";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type AdvancedDataVisualizationFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function AdvancedDataVisualizationFacilitatorConsole({
  cohortSnapshots,
}: AdvancedDataVisualizationFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="advanced-data-visualization"
      moduleTitle="Advanced Data Visualization"
      deckHref="/advanced-data-visualization"
      deckTitle="Advanced Data Visualization facilitator deck"
      trackCheckpointCompletion={false}
      getNote={getAdvancedDataVisualizationFacilitatorNote}
      getNoteBlocks={getAdvancedDataVisualizationFacilitatorNoteBlocks}
      getSlideScript={getAdvancedDataVisualizationFacilitatorSlideScript}
      getQuestions={getAdvancedDataVisualizationFacilitatorQuestions}
    />
  );
}
