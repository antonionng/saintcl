import { describe, expect, it } from "vitest";

import {
  getTrainingModuleDeck,
  getTrainingModuleEnhancement,
  getTrainingModuleFacilitatorHref,
  getTrainingModuleParticipantExperience,
  getTrainingModuleResources,
  getTrainingModuleWorkbookHref,
  getTrainingModules,
} from "./training";

describe("training module delivery registry", () => {
  it("provides deck, workbook, resources, and facilitator links for every module", () => {
    for (const trainingModule of getTrainingModules()) {
      expect(getTrainingModuleDeck(trainingModule.slug)?.href).toBeTruthy();
      expect(getTrainingModuleWorkbookHref(trainingModule.slug)).toBeTruthy();
      expect(getTrainingModuleFacilitatorHref(trainingModule.slug)).toBeTruthy();
      expect(getTrainingModuleResources(trainingModule.slug).length).toBeGreaterThan(0);
    }
  });

  it("keeps richer asset packs for machine learning and neural networks", () => {
    const machineLearningResources = getTrainingModuleResources("machine-learning-training");
    const neuralNetworkResources = getTrainingModuleResources("neural-networks");

    expect(machineLearningResources.some((resource) => resource.kind === "notebook")).toBe(true);
    expect(machineLearningResources.some((resource) => resource.kind === "dataset")).toBe(true);
    expect(machineLearningResources.some((resource) => resource.kind === "solution")).toBe(true);

    expect(neuralNetworkResources.some((resource) => resource.kind === "notebook")).toBe(true);
    expect(neuralNetworkResources.some((resource) => resource.kind === "dataset")).toBe(true);
    expect(neuralNetworkResources.some((resource) => resource.kind === "solution")).toBe(true);
  });

  it("routes technical modules into the executable workspace experience", () => {
    expect(getTrainingModuleParticipantExperience("machine-learning-training")).toBe("python-workspace");
    expect(getTrainingModuleParticipantExperience("neural-networks")).toBe("python-workspace");
    expect(getTrainingModuleParticipantExperience("advanced-data-visualization")).toBe("python-workspace");
  });

  it("keeps non-technical later modules on checkpoint delivery", () => {
    expect(getTrainingModuleParticipantExperience("business-applications-in-ai")).toBe("checkpoint");
    expect(getTrainingModuleParticipantExperience("automation-in-ai")).toBe("checkpoint");
    expect(getTrainingModuleParticipantExperience("ai-in-banking-and-finance")).toBe("checkpoint");
  });

  it("publishes pacing and learner-track guidance for every module", () => {
    for (const trainingModule of getTrainingModules()) {
      const enhancement = getTrainingModuleEnhancement(trainingModule.slug);
      expect(enhancement?.bankingContext.length).toBeGreaterThan(0);
      expect(enhancement?.pacingNotes.length).toBeGreaterThan(0);
      expect(enhancement?.engagementPrompts.length).toBeGreaterThan(0);
      expect(enhancement?.learnerTracks).toHaveLength(2);
    }
  });
});
