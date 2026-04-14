"use client";

import {
  getAiInBankingAndFinanceFacilitatorNote,
  getAiInBankingAndFinanceFacilitatorNoteBlocks,
  getAiInBankingAndFinanceFacilitatorQuestions,
  getAiInBankingAndFinanceFacilitatorSlideScript,
} from "@/lib/ai-in-banking-and-finance-facilitator";

import { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type AiInBankingAndFinanceFacilitatorConsoleProps = {
  cohortSnapshots: Parameters<typeof TrainingFacilitatorConsole>[0]["cohortSnapshots"];
};

export function AiInBankingAndFinanceFacilitatorConsole({
  cohortSnapshots,
}: AiInBankingAndFinanceFacilitatorConsoleProps) {
  return (
    <TrainingFacilitatorConsole
      cohortSnapshots={cohortSnapshots}
      moduleSlug="ai-in-banking-and-finance"
      moduleTitle="AI in Banking and Finance"
      deckHref="/ai-in-banking-and-finance"
      deckTitle="AI in Banking and Finance facilitator deck"
      trackCheckpointCompletion={false}
      getNote={getAiInBankingAndFinanceFacilitatorNote}
      getNoteBlocks={getAiInBankingAndFinanceFacilitatorNoteBlocks}
      getSlideScript={getAiInBankingAndFinanceFacilitatorSlideScript}
      getQuestions={getAiInBankingAndFinanceFacilitatorQuestions}
    />
  );
}
