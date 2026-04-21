import type { ComponentType } from "react";

import { AdvancedDataVisualizationFacilitatorConsole } from "@/components/training/advanced-data-visualization-facilitator-console";
import { AiInBankingAndFinanceFacilitatorConsole } from "@/components/training/ai-in-banking-and-finance-facilitator-console";
import { AutomationInAiFacilitatorConsole } from "@/components/training/automation-in-ai-facilitator-console";
import { BusinessApplicationsInAiFacilitatorConsole } from "@/components/training/business-applications-in-ai-facilitator-console";
import { MachineLearningFacilitatorConsole } from "@/components/training/machine-learning-facilitator-console";
import { NeuralNetworksFacilitatorConsole } from "@/components/training/neural-networks-facilitator-console";
import { ProgrammeOrientationFacilitatorConsole } from "@/components/training/programme-orientation-facilitator-console";
import { PythonFacilitatorConsole } from "@/components/training/python-facilitator-console";
import type { TrainingFacilitatorConsole } from "@/components/training/training-facilitator-console";

type ConsoleProps = Pick<Parameters<typeof TrainingFacilitatorConsole>[0], "cohortSnapshots">;

type ConsoleEntry = {
  Component: ComponentType<ConsoleProps>;
  deckHref: string;
  deckTitle: string;
};

export const facilitatorConsoleRegistry: Record<string, ConsoleEntry> = {
  "programme-orientation": {
    Component: ProgrammeOrientationFacilitatorConsole,
    deckHref: "/programme-orientation",
    deckTitle: "Programme Orientation facilitator deck",
  },
  "python-for-data": {
    Component: PythonFacilitatorConsole,
    deckHref: "/python-training",
    deckTitle: "Python for Data facilitator deck",
  },
  "machine-learning-training": {
    Component: MachineLearningFacilitatorConsole,
    deckHref: "/machine-learning-training",
    deckTitle: "Machine Learning Training facilitator deck",
  },
  "neural-networks": {
    Component: NeuralNetworksFacilitatorConsole,
    deckHref: "/neural-networks",
    deckTitle: "Neural Networks facilitator deck",
  },
  "business-applications-in-ai": {
    Component: BusinessApplicationsInAiFacilitatorConsole,
    deckHref: "/business-applications-in-ai",
    deckTitle: "Business Applications in AI facilitator deck",
  },
  "automation-in-ai": {
    Component: AutomationInAiFacilitatorConsole,
    deckHref: "/automation-in-ai",
    deckTitle: "Automation in AI facilitator deck",
  },
  "advanced-data-visualization": {
    Component: AdvancedDataVisualizationFacilitatorConsole,
    deckHref: "/advanced-data-visualization",
    deckTitle: "Advanced Data Visualization facilitator deck",
  },
  "ai-in-banking-and-finance": {
    Component: AiInBankingAndFinanceFacilitatorConsole,
    deckHref: "/ai-in-banking-and-finance",
    deckTitle: "AI in Banking and Finance facilitator deck",
  },
};

export function getFacilitatorConsoleEntry(moduleSlug: string): ConsoleEntry | null {
  return facilitatorConsoleRegistry[moduleSlug] ?? null;
}
