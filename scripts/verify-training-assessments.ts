#!/usr/bin/env -S npx tsx
import { ajbTrainingProgramme } from "../src/lib/training";
import {
  blueprintToStoredQuestion,
  gradeAssessmentResponse,
  type CompletedLabSnapshot,
  type ResponsePayload,
} from "../src/lib/training-assessment-grader";
import {
  getAssessmentBlueprintsForModule,
  type AssessmentQuestionBlueprint,
} from "../src/lib/training-assessments";

type Outcome = {
  module: string;
  assessment: string;
  question: string;
  scenario: string;
  expectedSignal: "auto_correct" | "auto_incorrect" | "needs_review";
  actualSignal: string;
  awardedPoints: number;
  maxPoints: number;
  ok: boolean;
};

function buildCorrectResponse(question: AssessmentQuestionBlueprint): ResponsePayload {
  switch (question.questionType) {
    case "multiple_choice":
      return { selectedOptionId: String(question.correctAnswer ?? question.options?.[0]?.id ?? "") };
    case "multi_select":
      return {
        selectedOptionIds: Array.isArray(question.correctAnswer)
          ? (question.correctAnswer as string[])
          : (question.options ?? []).map((option) => option.id),
      };
    case "short_answer":
    case "long_answer":
      if (question.validators?.some((validator) => validator.kind === "exact_match")) {
        return { text: String(question.correctAnswer ?? "") };
      }
      if (question.validators?.some((validator) => validator.kind === "contains")) {
        const tokens = question.validators
          .filter((validator) => validator.kind === "contains")
          .flatMap((validator) =>
            "tokens" in validator ? validator.tokens : [],
          );
        return { text: tokens.join(" ") };
      }
      if (question.validators?.some((validator) => validator.kind === "numeric")) {
        const numeric = question.validators.find((validator) => validator.kind === "numeric");
        if (numeric && numeric.kind === "numeric") {
          const min = numeric.min ?? 0;
          const max = numeric.max ?? min + 1;
          return { text: String((min + max) / 2) };
        }
      }
      return { text: "Detailed thoughtful response covering banking, modelling, governance, and stakeholder communication considerations." };
    case "code":
    case "notebook_task":
      return { code: "print('done')", taskCheckId: question.validators?.find((v) => v.kind === "python_check")?.kind === "python_check" ? (question.validators.find((v) => v.kind === "python_check") as { taskCheckId: string }).taskCheckId : null };
    case "file_upload":
      return { fileUrl: "https://example.com/uploaded-file.pdf" };
    default:
      return {};
  }
}

function buildIncorrectResponse(question: AssessmentQuestionBlueprint): ResponsePayload {
  switch (question.questionType) {
    case "multiple_choice": {
      const wrong = question.options?.find((option) => option.id !== String(question.correctAnswer));
      return { selectedOptionId: wrong?.id ?? null };
    }
    case "multi_select":
      return { selectedOptionIds: [] };
    case "short_answer":
    case "long_answer":
      return { text: "n/a" };
    case "code":
    case "notebook_task":
      return { code: "" };
    case "file_upload":
      return {};
    default:
      return {};
  }
}

function snapshotForCorrect(question: AssessmentQuestionBlueprint): CompletedLabSnapshot {
  const taskCheckIds = new Set<string>();
  for (const validator of question.validators ?? []) {
    if (validator.kind === "python_check") {
      taskCheckIds.add(validator.taskCheckId);
    }
  }
  return { taskCheckIds, labSlugsCompleted: new Set() };
}

function summarise(outcomes: Outcome[]) {
  const byModule = new Map<string, { passed: number; failed: number }>();
  for (const outcome of outcomes) {
    const bucket = byModule.get(outcome.module) ?? { passed: 0, failed: 0 };
    if (outcome.ok) {
      bucket.passed += 1;
    } else {
      bucket.failed += 1;
    }
    byModule.set(outcome.module, bucket);
  }
  return byModule;
}

function main() {
  const outcomes: Outcome[] = [];

  for (const trainingModule of ajbTrainingProgramme.modules) {
    const blueprints = getAssessmentBlueprintsForModule(trainingModule.slug);
    for (const blueprint of blueprints) {
      for (const question of blueprint.questions) {
        const stored = blueprintToStoredQuestion(question);
        const reviewOnly = (question.validators ?? []).some(
          (validator) => validator.kind === "facilitator_review",
        );

        const correctResponse = buildCorrectResponse(question);
        const correctResult = gradeAssessmentResponse({
          question: stored,
          response: correctResponse,
          completedLabs: snapshotForCorrect(question),
        });

        const validators = question.validators ?? [];
        const hasRegexValidator = validators.some((validator) => validator.kind === "regex");
        const codeWithRegex =
          (question.questionType === "code" || question.questionType === "notebook_task") &&
          hasRegexValidator;

        const expectedCorrectSignal = reviewOnly
          ? "needs_review"
          : question.questionType === "file_upload"
            ? "needs_review"
            : codeWithRegex
              ? "auto_incorrect"
              : "auto_correct";

        outcomes.push({
          module: trainingModule.slug,
          assessment: blueprint.slug,
          question: question.slug,
          scenario: codeWithRegex ? "stub code response" : "correct response",
          expectedSignal: expectedCorrectSignal,
          actualSignal: correctResult.signal,
          awardedPoints: correctResult.awardedPoints,
          maxPoints: correctResult.maxPoints,
          ok: correctResult.signal === expectedCorrectSignal,
        });

        if (!reviewOnly && (question.questionType === "multiple_choice" || question.questionType === "multi_select")) {
          const incorrect = gradeAssessmentResponse({
            question: stored,
            response: buildIncorrectResponse(question),
          });
          outcomes.push({
            module: trainingModule.slug,
            assessment: blueprint.slug,
            question: question.slug,
            scenario: "incorrect response",
            expectedSignal: "auto_incorrect",
            actualSignal: incorrect.signal,
            awardedPoints: incorrect.awardedPoints,
            maxPoints: incorrect.maxPoints,
            ok: incorrect.signal === "auto_incorrect",
          });
        }
      }
    }
  }

  const failures = outcomes.filter((outcome) => !outcome.ok);
  const summary = summarise(outcomes);

  console.log("Training assessment grading verification");
  console.log("=========================================");
  for (const [module, stats] of summary.entries()) {
    console.log(`- ${module}: ${stats.passed} passed, ${stats.failed} failed`);
  }
  console.log("");
  console.log(`Total scenarios: ${outcomes.length}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log("");
    console.log("Failure details (first 20):");
    for (const failure of failures.slice(0, 20)) {
      console.log(
        `  [${failure.module}/${failure.assessment}/${failure.question}] ${failure.scenario}: expected ${failure.expectedSignal}, got ${failure.actualSignal}`,
      );
    }
    process.exitCode = 1;
  } else {
    console.log("All scenarios produced the expected grading signal.");
  }
}

main();
