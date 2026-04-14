"use client";

import {
  getAutomationInAiFacilitatorNote,
  getAutomationInAiFacilitatorNoteBlocks,
  getAutomationInAiFacilitatorQuestions,
  getAutomationInAiFacilitatorSlideScript,
} from "@/lib/automation-in-ai-facilitator";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type AutomationInAiFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function AutomationInAiFacilitatorConsole({ cohortSnapshots }: AutomationInAiFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="automation-in-ai"
      moduleTitle="Automation in AI"
      deckHref="/automation-in-ai"
      deckTitle="Automation in AI facilitator deck"
      trackCheckpointCompletion={false}
      getNote={getAutomationInAiFacilitatorNote}
      getNoteBlocks={getAutomationInAiFacilitatorNoteBlocks}
      getSlideScript={getAutomationInAiFacilitatorSlideScript}
      getQuestions={getAutomationInAiFacilitatorQuestions}
    />
  );
}
