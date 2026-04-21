import { describe, expect, it } from "vitest";

import { ajbTrainingProgramme } from "./training";
import {
  blueprintToStoredQuestion,
  gradeAssessmentResponse,
  type CompletedLabSnapshot,
  type StoredQuestionShape,
} from "./training-assessment-grader";
import {
  getAssessmentBlueprintsForModule,
  getModuleTestForModule,
  listAllAssessmentBlueprints,
  type AssessmentQuestionBlueprint,
} from "./training-assessments";

describe("training assessment blueprints", () => {
  it("provides assessments for every module in the programme", () => {
    for (const trainingModule of ajbTrainingProgramme.modules) {
      const blueprints = getAssessmentBlueprintsForModule(trainingModule.slug);
      expect(blueprints.length, `module ${trainingModule.slug} has assessments`).toBeGreaterThan(0);
    }
  });

  it("includes a passing module test for every module", () => {
    for (const trainingModule of ajbTrainingProgramme.modules) {
      const test = getModuleTestForModule(trainingModule.slug);
      expect(test, `module ${trainingModule.slug} has a module_test`).not.toBeNull();
      expect(test?.kind).toBe("module_test");
      expect(test?.questions.length, `module ${trainingModule.slug} test has questions`).toBeGreaterThan(0);
      const passing = test?.passingScore ?? 0;
      expect(passing).toBeGreaterThanOrEqual(60);
      expect(passing).toBeLessThanOrEqual(100);
    }
  });

  it("uses unique assessment slugs across the programme", () => {
    const seen = new Set<string>();
    for (const blueprint of listAllAssessmentBlueprints()) {
      const composite = `${blueprint.moduleSlug}::${blueprint.slug}`;
      expect(seen.has(composite), `duplicate assessment slug ${composite}`).toBe(false);
      seen.add(composite);
    }
  });

  it("uses unique question slugs within each assessment", () => {
    for (const blueprint of listAllAssessmentBlueprints()) {
      const seen = new Set<string>();
      for (const question of blueprint.questions) {
        expect(
          seen.has(question.slug),
          `duplicate question slug ${question.slug} in ${blueprint.moduleSlug}/${blueprint.slug}`,
        ).toBe(false);
        seen.add(question.slug);
      }
    }
  });

  it("ensures multi-choice and multi-select questions reference real options", () => {
    for (const blueprint of listAllAssessmentBlueprints()) {
      for (const question of blueprint.questions) {
        if (question.questionType === "multiple_choice") {
          expect(question.options?.length, `${question.slug} has options`).toBeGreaterThan(0);
          expect(typeof question.correctAnswer).toBe("string");
          const optionIds = new Set(question.options?.map((option) => option.id));
          expect(optionIds.has(String(question.correctAnswer))).toBe(true);
        } else if (question.questionType === "multi_select") {
          expect(question.options?.length, `${question.slug} has options`).toBeGreaterThan(0);
          expect(Array.isArray(question.correctAnswer)).toBe(true);
          const optionIds = new Set(question.options?.map((option) => option.id));
          for (const expected of (question.correctAnswer ?? []) as string[]) {
            expect(optionIds.has(expected), `option ${expected} exists in ${question.slug}`).toBe(true);
          }
        }
      }
    }
  });
});

function findQuestionWith(predicate: (question: AssessmentQuestionBlueprint) => boolean) {
  for (const blueprint of listAllAssessmentBlueprints()) {
    for (const question of blueprint.questions) {
      if (predicate(question)) {
        return question;
      }
    }
  }
  return null;
}

describe("assessment grader", () => {
  it("auto-grades a correct multiple choice response", () => {
    const question = findQuestionWith((candidate) => candidate.questionType === "multiple_choice");
    expect(question).not.toBeNull();
    if (!question) return;

    const stored = blueprintToStoredQuestion(question);
    const result = gradeAssessmentResponse({
      question: stored,
      response: { selectedOptionId: String(question.correctAnswer) },
    });
    expect(result.signal).toBe("auto_correct");
    expect(result.isCorrect).toBe(true);
    expect(result.awardedPoints).toBe(stored.points);
    expect(result.requiresFacilitatorReview).toBe(false);
  });

  it("flags an incorrect multiple choice response", () => {
    const question = findQuestionWith((candidate) => {
      if (candidate.questionType !== "multiple_choice") return false;
      return (candidate.options?.length ?? 0) > 1;
    });
    expect(question).not.toBeNull();
    if (!question) return;

    const stored = blueprintToStoredQuestion(question);
    const wrongOption = question.options?.find((option) => option.id !== String(question.correctAnswer));
    expect(wrongOption).toBeDefined();

    const result = gradeAssessmentResponse({
      question: stored,
      response: { selectedOptionId: wrongOption?.id ?? "" },
    });
    expect(result.signal).toBe("auto_incorrect");
    expect(result.awardedPoints).toBe(0);
  });

  it("requires every expected option for multi-select to be considered correct", () => {
    const question = findQuestionWith((candidate) => candidate.questionType === "multi_select");
    if (!question) {
      return;
    }

    const stored = blueprintToStoredQuestion(question);
    const expected = (question.correctAnswer ?? []) as string[];

    const correct = gradeAssessmentResponse({
      question: stored,
      response: { selectedOptionIds: [...expected] },
    });
    expect(correct.signal).toBe("auto_correct");

    if (expected.length > 0) {
      const partial = gradeAssessmentResponse({
        question: stored,
        response: { selectedOptionIds: expected.slice(1) },
      });
      expect(partial.signal).toBe("auto_incorrect");
    }
  });

  it("marks short-answer questions with rubrics for facilitator review", () => {
    const stored: StoredQuestionShape = {
      slug: "demo-short-answer",
      questionType: "short_answer",
      points: 4,
      options: null,
      correctAnswer: null,
      validators: [{ kind: "facilitator_review", rubricKey: "demo" }],
    };

    const result = gradeAssessmentResponse({
      question: stored,
      response: { text: "Some thoughtful answer." },
    });
    expect(result.requiresFacilitatorReview).toBe(true);
    expect(result.signal).toBe("needs_review");
  });

  it("auto-grades exact-match short answers", () => {
    const stored: StoredQuestionShape = {
      slug: "demo-exact",
      questionType: "short_answer",
      points: 1,
      options: null,
      correctAnswer: "pandas",
      validators: [{ kind: "exact_match" }],
    };

    expect(
      gradeAssessmentResponse({
        question: stored,
        response: { text: " pandas " },
      }).signal,
    ).toBe("auto_correct");

    expect(
      gradeAssessmentResponse({
        question: stored,
        response: { text: "numpy" },
      }).signal,
    ).toBe("auto_incorrect");
  });

  it("validates contains-token rubrics with all/any semantics", () => {
    const requireAll: StoredQuestionShape = {
      slug: "demo-contains-all",
      questionType: "long_answer",
      points: 2,
      options: null,
      correctAnswer: null,
      validators: [{ kind: "contains", tokens: ["mean", "median"], requireAll: true }],
    };

    expect(
      gradeAssessmentResponse({
        question: requireAll,
        response: { text: "I would compute the mean and the median to compare central tendency." },
      }).signal,
    ).toBe("auto_correct");

    expect(
      gradeAssessmentResponse({
        question: requireAll,
        response: { text: "I would compute the mean only." },
      }).signal,
    ).toBe("auto_incorrect");
  });

  it("evaluates numeric answers with min and max bounds", () => {
    const stored: StoredQuestionShape = {
      slug: "demo-numeric",
      questionType: "short_answer",
      points: 1,
      options: null,
      correctAnswer: null,
      validators: [{ kind: "numeric", min: 0.7, max: 0.9, tolerance: 0.01 }],
    };

    expect(
      gradeAssessmentResponse({ question: stored, response: { text: "0.82" } }).signal,
    ).toBe("auto_correct");

    expect(
      gradeAssessmentResponse({ question: stored, response: { text: "0.5" } }).signal,
    ).toBe("auto_incorrect");

    expect(
      gradeAssessmentResponse({ question: stored, response: { text: "not a number" } }).signal,
    ).toBe("auto_incorrect");
  });

  it("uses python_check validators against the lab snapshot", () => {
    const stored: StoredQuestionShape = {
      slug: "demo-python",
      questionType: "notebook_task",
      points: 3,
      options: null,
      correctAnswer: null,
      validators: [{ kind: "python_check", taskCheckId: "task-load-data" }],
    };

    const completed: CompletedLabSnapshot = {
      taskCheckIds: new Set(["task-load-data"]),
      labSlugsCompleted: new Set(),
    };
    expect(
      gradeAssessmentResponse({ question: stored, response: {}, completedLabs: completed }).signal,
    ).toBe("auto_correct");

    const empty: CompletedLabSnapshot = {
      taskCheckIds: new Set(),
      labSlugsCompleted: new Set(),
    };
    expect(
      gradeAssessmentResponse({ question: stored, response: {}, completedLabs: empty }).signal,
    ).toBe("auto_incorrect");
  });
});
