import { describe, expect, it } from "vitest";

import { resolveTrainingLabCheckpoints } from "./training-lab-checkpoints";

describe("python-for-data lab checkpoints", () => {
  const labs = resolveTrainingLabCheckpoints("python-for-data");

  it("ships exactly four python labs (A, B, C, D)", () => {
    expect(labs.map((lab) => lab.slug)).toEqual([
      "lab-a-triage",
      "lab-b-kpi",
      "lab-c-pack",
      "lab-d-handoff",
    ]);
  });

  it("sets a leadership question on every python lab so the brief beat has something to restate", () => {
    for (const lab of labs) {
      expect(lab.leadershipQuestion, `${lab.slug} should set leadershipQuestion`).toBeTruthy();
      expect((lab.leadershipQuestion ?? "").length).toBeGreaterThan(40);
    }
  });

  it("provides at least one challenge question per python lab so the defend beat can resolve", () => {
    for (const lab of labs) {
      expect(lab.challengeQuestions ?? [], `${lab.slug} challengeQuestions`).not.toHaveLength(0);
    }
  });
});
