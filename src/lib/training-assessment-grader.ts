import type {
  AssessmentValidator,
  AssessmentQuestionBlueprint,
  AssessmentQuestionType,
} from "@/lib/training-assessments";

export type GradedAnswerSignal = "auto_correct" | "auto_incorrect" | "needs_review";

export type GradeResult = {
  signal: GradedAnswerSignal;
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean | null;
  requiresFacilitatorReview: boolean;
  summary: {
    validatorResults: Array<{
      kind: AssessmentValidator["kind"] | "auto";
      passed: boolean | null;
      message?: string;
    }>;
    rationale: string;
  };
};

export type StoredQuestionShape = {
  slug: string;
  questionType: AssessmentQuestionType;
  points: number;
  options: Array<{ id: string; label: string }> | null;
  correctAnswer: unknown;
  validators: AssessmentValidator[];
};

export type CompletedLabSnapshot = {
  taskCheckIds: Set<string>;
  labSlugsCompleted: Set<string>;
};

export type ResponsePayload = {
  selectedOptionId?: string | null;
  selectedOptionIds?: string[] | null;
  text?: string | null;
  code?: string | null;
  fileUrl?: string | null;
  taskCheckId?: string | null;
};

function clampPoints(value: number, max: number) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

function evaluateExactMatch(
  validator: Extract<AssessmentValidator, { kind: "exact_match" }>,
  text: string | null | undefined,
  expected: unknown,
) {
  if (typeof text !== "string" || expected === null || expected === undefined) {
    return { passed: false, message: "No text response provided." };
  }
  const left = validator.trim === false ? text : text.trim();
  const right = String(expected);
  const normalisedLeft = validator.caseSensitive ? left : left.toLowerCase();
  const normalisedRight = validator.caseSensitive ? right : right.toLowerCase();
  return {
    passed: normalisedLeft === normalisedRight,
    message: normalisedLeft === normalisedRight ? "Exact match." : "Did not match the expected text.",
  };
}

function evaluateContains(
  validator: Extract<AssessmentValidator, { kind: "contains" }>,
  text: string | null | undefined,
) {
  if (typeof text !== "string" || text.length === 0) {
    return { passed: false, message: "Empty response." };
  }
  const haystack = validator.caseSensitive ? text : text.toLowerCase();
  const tokens = validator.caseSensitive
    ? validator.tokens
    : validator.tokens.map((token) => token.toLowerCase());
  const matches = tokens.map((token) => haystack.includes(token));
  const requireAll = validator.requireAll ?? false;
  const passed = requireAll ? matches.every(Boolean) : matches.some(Boolean);
  return {
    passed,
    message: passed
      ? `Matched ${matches.filter(Boolean).length} of ${tokens.length} expected tokens.`
      : `Missing tokens: ${tokens.filter((_, index) => !matches[index]).join(", ")}.`,
  };
}

function evaluateRegex(
  validator: Extract<AssessmentValidator, { kind: "regex" }>,
  text: string | null | undefined,
) {
  if (typeof text !== "string" || text.length === 0) {
    return { passed: false, message: "Empty response." };
  }
  try {
    const regex = new RegExp(validator.pattern, validator.flags ?? "");
    const passed = regex.test(text);
    return { passed, message: passed ? "Pattern matched." : "Pattern did not match." };
  } catch (error) {
    return {
      passed: false,
      message: `Invalid regex pattern: ${error instanceof Error ? error.message : "unknown"}`,
    };
  }
}

function evaluateNumeric(
  validator: Extract<AssessmentValidator, { kind: "numeric" }>,
  text: string | null | undefined,
) {
  if (typeof text !== "string") {
    return { passed: false, message: "Empty response." };
  }
  const parsed = Number(text.trim());
  if (Number.isNaN(parsed)) {
    return { passed: false, message: "Response is not numeric." };
  }
  if (validator.min !== undefined && parsed < validator.min - (validator.tolerance ?? 0)) {
    return { passed: false, message: `Below minimum ${validator.min}.` };
  }
  if (validator.max !== undefined && parsed > validator.max + (validator.tolerance ?? 0)) {
    return { passed: false, message: `Above maximum ${validator.max}.` };
  }
  return { passed: true, message: "Within accepted numeric range." };
}

function evaluatePythonCheck(
  validator: Extract<AssessmentValidator, { kind: "python_check" }>,
  completedLabs: CompletedLabSnapshot,
) {
  const passed = completedLabs.taskCheckIds.has(validator.taskCheckId);
  return {
    passed,
    message: passed
      ? `Task check '${validator.taskCheckId}' was completed in the notebook.`
      : `Task check '${validator.taskCheckId}' has not been recorded as completed yet. Run and record the lab checkpoint.`,
  };
}

function evaluateMultipleChoice(question: StoredQuestionShape, response: ResponsePayload) {
  const expected = question.correctAnswer;
  if (typeof expected !== "string") {
    return { passed: null as boolean | null, message: "No correct answer configured." };
  }
  if (!response.selectedOptionId) {
    return { passed: false, message: "No option selected." };
  }
  return {
    passed: response.selectedOptionId === expected,
    message: response.selectedOptionId === expected ? "Correct option selected." : "Selected option is incorrect.",
  };
}

function evaluateMultiSelect(question: StoredQuestionShape, response: ResponsePayload) {
  const expectedRaw = question.correctAnswer;
  const expected = Array.isArray(expectedRaw) ? expectedRaw.map(String) : null;
  if (!expected) {
    return { passed: null as boolean | null, message: "No correct answer configured." };
  }
  const selected = response.selectedOptionIds ?? [];
  const expectedSet = new Set(expected);
  const selectedSet = new Set(selected);
  const correct = expectedSet.size === selectedSet.size && expected.every((id) => selectedSet.has(id));
  const missing = expected.filter((id) => !selectedSet.has(id));
  const extra = selected.filter((id) => !expectedSet.has(id));
  return {
    passed: correct,
    message: correct
      ? "All correct options selected."
      : `Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`,
  };
}

export function gradeAssessmentResponse(input: {
  question: StoredQuestionShape;
  response: ResponsePayload;
  completedLabs?: CompletedLabSnapshot;
}): GradeResult {
  const { question, response } = input;
  const completedLabs: CompletedLabSnapshot = input.completedLabs ?? {
    taskCheckIds: new Set<string>(),
    labSlugsCompleted: new Set<string>(),
  };
  const maxPoints = question.points ?? 1;
  const validatorResults: GradeResult["summary"]["validatorResults"] = [];

  const referenceText = (response.text ?? response.code ?? "")?.toString() ?? "";

  let autoBaseline: { passed: boolean | null; message: string } = {
    passed: null,
    message: "Question type is not auto-graded.",
  };

  if (question.questionType === "multiple_choice") {
    autoBaseline = evaluateMultipleChoice(question, response);
    validatorResults.push({ kind: "auto", passed: autoBaseline.passed, message: autoBaseline.message });
  } else if (question.questionType === "multi_select") {
    autoBaseline = evaluateMultiSelect(question, response);
    validatorResults.push({ kind: "auto", passed: autoBaseline.passed, message: autoBaseline.message });
  }

  let needsReview = false;
  let validatorPassed: boolean | null = null;

  for (const validator of question.validators ?? []) {
    if (validator.kind === "facilitator_review") {
      needsReview = true;
      validatorResults.push({
        kind: "facilitator_review",
        passed: null,
        message: "Awaiting facilitator review.",
      });
      continue;
    }

    let evaluated: { passed: boolean; message: string };
    if (validator.kind === "exact_match") {
      evaluated = evaluateExactMatch(validator, referenceText, question.correctAnswer);
    } else if (validator.kind === "contains") {
      evaluated = evaluateContains(validator, referenceText);
    } else if (validator.kind === "regex") {
      evaluated = evaluateRegex(validator, referenceText);
    } else if (validator.kind === "numeric") {
      evaluated = evaluateNumeric(validator, referenceText);
    } else if (validator.kind === "python_check") {
      evaluated = evaluatePythonCheck(validator, completedLabs);
    } else {
      evaluated = { passed: false, message: "Unsupported validator." };
    }

    validatorResults.push({ kind: validator.kind, passed: evaluated.passed, message: evaluated.message });
    if (validatorPassed === null) {
      validatorPassed = evaluated.passed;
    } else {
      validatorPassed = validatorPassed && evaluated.passed;
    }
  }

  let isCorrect: boolean | null;
  if (autoBaseline.passed === null && validatorPassed === null) {
    isCorrect = null;
  } else if (autoBaseline.passed === null) {
    isCorrect = validatorPassed;
  } else if (validatorPassed === null) {
    isCorrect = autoBaseline.passed;
  } else {
    isCorrect = autoBaseline.passed && validatorPassed;
  }

  let signal: GradedAnswerSignal;
  let awardedPoints = 0;

  if (needsReview) {
    signal = "needs_review";
    awardedPoints = isCorrect === true ? maxPoints : 0;
  } else if (isCorrect === null) {
    signal = "needs_review";
    awardedPoints = 0;
  } else if (isCorrect) {
    signal = "auto_correct";
    awardedPoints = maxPoints;
  } else {
    signal = "auto_incorrect";
    awardedPoints = 0;
  }

  return {
    signal,
    awardedPoints: clampPoints(awardedPoints, maxPoints),
    maxPoints,
    isCorrect,
    requiresFacilitatorReview: needsReview,
    summary: {
      validatorResults,
      rationale:
        signal === "auto_correct"
          ? "All auto-graded validators passed."
          : signal === "auto_incorrect"
            ? "One or more validators failed."
            : needsReview
              ? "Facilitator review required before final grade."
              : "Insufficient information to grade automatically.",
    },
  };
}

export function blueprintToStoredQuestion(blueprint: AssessmentQuestionBlueprint): StoredQuestionShape {
  return {
    slug: blueprint.slug,
    questionType: blueprint.questionType,
    points: blueprint.points ?? 1,
    options: blueprint.options ?? null,
    correctAnswer: blueprint.correctAnswer ?? null,
    validators: blueprint.validators ?? [],
  };
}
