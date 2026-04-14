"use client";

import {
  getBusinessApplicationsInAiFacilitatorNote,
  getBusinessApplicationsInAiFacilitatorNoteBlocks,
  getBusinessApplicationsInAiFacilitatorQuestions,
  getBusinessApplicationsInAiFacilitatorSlideScript,
} from "@/lib/business-applications-in-ai-facilitator";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type BusinessApplicationsInAiFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function BusinessApplicationsInAiFacilitatorConsole({
  cohortSnapshots,
}: BusinessApplicationsInAiFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="business-applications-in-ai"
      moduleTitle="Business Applications in AI"
      deckHref="/business-applications-in-ai"
      deckTitle="Business Applications in AI facilitator deck"
      trackCheckpointCompletion={false}
      getNote={getBusinessApplicationsInAiFacilitatorNote}
      getNoteBlocks={getBusinessApplicationsInAiFacilitatorNoteBlocks}
      getSlideScript={getBusinessApplicationsInAiFacilitatorSlideScript}
      getQuestions={getBusinessApplicationsInAiFacilitatorQuestions}
    />
  );
}
