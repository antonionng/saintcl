import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORM_TRAINING_KEY } from "@/lib/training-dal";
import { resolveDefaultModelForModule } from "@/lib/training-copilot";

export type AiAssessmentScoreBand =
  | "proficient"
  | "developing"
  | "needs_retry"
  | "not_graded";

export type AiAssessmentRuleSignal = {
  taskId?: string | null;
  taskTitle?: string | null;
  state: "passed" | "retry_needed" | "guided_complete" | "not_started";
  message?: string | null;
};

export type AiAssessorTaskInput = {
  id?: string | null;
  title?: string | null;
  successCriteria?: string | string[] | null;
  rubric?: string | string[] | null;
  notebookSlug?: string | null;
};

export type AiAssessorCheckpointInput = {
  slug: string;
  title: string;
  description?: string | null;
  facilitatorPrompt?: string | null;
};

export type AiAssessorInput = {
  submissionId: string;
  participantId: string;
  moduleId: string;
  orgId: string | null;
  inviteCode: string;
  moduleSlug: string;
  checkpoint?: AiAssessorCheckpointInput | null;
  task?: AiAssessorTaskInput | null;
  ruleSignals?: AiAssessmentRuleSignal[];
  code?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  outputFiles?: string[];
  datasetName?: string | null;
  artifactUrl?: string | null;
  summary?: string | null;
};

export type AiAssessorCriterionScore = {
  criterion: string;
  score: AiAssessmentScoreBand;
  notes: string;
};

export type AiAssessorOutcome = {
  scoreBand: AiAssessmentScoreBand;
  criterionScores: AiAssessorCriterionScore[];
  summary: string;
  suggestedNextStep: string;
  ruleSignals: AiAssessmentRuleSignal[];
  model: string | null;
  status: "completed" | "failed" | "skipped";
  errorMessage?: string;
};

const ASSESSOR_TIMEOUT_MS = 45_000;
const ASSESSOR_MAX_OUTPUT_TOKENS = 1024;

const SYSTEM_PROMPT = `You are an AI assessor for the SaintClaw training programme.
- Grade the learner's submission against the task's success criteria.
- Use the rule-based check signals as one input, not the only source of truth.
- Be brief, direct, and constructive. Reward effort and progress.
- Always return valid JSON in the exact schema requested. No prose outside JSON.
- Banking content is illustrative; do not invent customer data.`;

function joinList(value: string | string[] | null | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n- ");
  return value;
}

function summariseRuleSignals(signals: AiAssessmentRuleSignal[]): string {
  if (signals.length === 0) return "(none)";
  return signals
    .map((signal) => {
      const label = signal.taskTitle ?? signal.taskId ?? "task";
      const message = signal.message ? ` - ${signal.message}` : "";
      return `- ${label}: ${signal.state}${message}`;
    })
    .join("\n");
}

function buildAssessorPrompt(input: AiAssessorInput): string {
  const successCriteria = joinList(input.task?.successCriteria);
  const rubric = joinList(input.task?.rubric);
  const codeSnippet = (input.code ?? "").slice(0, 8000);
  const stdoutSnippet = (input.stdout ?? "").slice(0, 4000);
  const stderrSnippet = (input.stderr ?? "").slice(0, 4000);
  const ruleSignalText = summariseRuleSignals(input.ruleSignals ?? []);
  const outputs =
    input.outputFiles && input.outputFiles.length > 0
      ? input.outputFiles.slice(0, 25).join(", ")
      : "(none)";

  return `Activity: ${input.checkpoint?.title ?? "(unspecified)"}
Activity description: ${input.checkpoint?.description ?? "(none)"}

Task: ${input.task?.title ?? "(unspecified)"}
Success criteria:
- ${successCriteria || "(none)"}
${rubric ? `Rubric:\n- ${rubric}\n` : ""}
Dataset: ${input.datasetName ?? "(not specified)"}
Output files: ${outputs}
Artifact URL: ${input.artifactUrl ?? "(none)"}
Learner summary: ${input.summary ?? "(none)"}

Rule-based check signals (informational, not authoritative):
${ruleSignalText}

Code submitted:
\`\`\`
${codeSnippet || "(no code submitted)"}
\`\`\`

Stdout (last):
\`\`\`
${stdoutSnippet || "(empty)"}
\`\`\`

Stderr (last):
\`\`\`
${stderrSnippet || "(empty)"}
\`\`\`

Return JSON in exactly this shape:
{
  "score_band": "proficient" | "developing" | "needs_retry",
  "summary": "1-2 sentence assessment of where this submission stands",
  "suggested_next_step": "single concrete next action for the learner",
  "criterion_scores": [
    { "criterion": "string", "score": "proficient" | "developing" | "needs_retry", "notes": "<= 2 sentences" }
  ]
}

Only output JSON. Do not wrap in code fences.`;
}

function safeJsonParse(text: string): unknown {
  const trimmed = text.trim();
  // Handle accidental fenced output.
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // Try to recover the first JSON object in the text.
    const first = body.indexOf("{");
    const last = body.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(body.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normaliseScoreBand(value: unknown): AiAssessmentScoreBand {
  if (
    value === "proficient" ||
    value === "developing" ||
    value === "needs_retry"
  ) {
    return value;
  }
  return "not_graded";
}

function normaliseCriterionScores(
  raw: unknown,
): AiAssessorCriterionScore[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const criterion = typeof record.criterion === "string" ? record.criterion : "";
      const notes = typeof record.notes === "string" ? record.notes : "";
      if (!criterion) return null;
      return {
        criterion: criterion.slice(0, 400),
        score: normaliseScoreBand(record.score),
        notes: notes.slice(0, 1200),
      } satisfies AiAssessorCriterionScore;
    })
    .filter((item): item is AiAssessorCriterionScore => item !== null);
}

async function callOpenRouter(input: {
  prompt: string;
  model: string;
}): Promise<{ output: string; model: string } | { error: string }> {
  if (!env.openRouterApiKey) {
    return { error: "OpenRouter is not configured on this deployment." };
  }
  const openRouterModel = input.model.startsWith("openrouter/")
    ? input.model.slice("openrouter/".length)
    : input.model;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.appUrl,
        "X-Title": "SaintClaw AI Assessor",
      },
      body: JSON.stringify({
        model: openRouterModel,
        temperature: 0,
        max_tokens: ASSESSOR_MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input.prompt },
        ],
      }),
      signal: AbortSignal.timeout(ASSESSOR_TIMEOUT_MS),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        error: text.slice(0, 500) || `OpenRouter responded with ${response.status}.`,
      };
    }
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const output = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!output) {
      return { error: "OpenRouter returned no content." };
    }
    return { output, model: json.model ?? input.model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenRouter call failed.";
    return { error: message.slice(0, 500) };
  }
}

export async function runTrainingAiAssessor(
  input: AiAssessorInput,
): Promise<AiAssessorOutcome> {
  const ruleSignals = input.ruleSignals ?? [];
  if (!env.openRouterApiKey) {
    return {
      scoreBand: "not_graded",
      criterionScores: [],
      summary: "AI assessor unavailable (OpenRouter not configured).",
      suggestedNextStep: "Ask your facilitator to enable AI grading.",
      ruleSignals,
      model: null,
      status: "skipped",
    };
  }

  const model = resolveDefaultModelForModule(input.moduleSlug);
  const prompt = buildAssessorPrompt(input);
  const callResult = await callOpenRouter({ prompt, model });

  if ("error" in callResult) {
    return {
      scoreBand: "not_graded",
      criterionScores: [],
      summary: "AI assessor failed to grade this submission.",
      suggestedNextStep: callResult.error,
      ruleSignals,
      model,
      status: "failed",
      errorMessage: callResult.error,
    };
  }

  const parsed = safeJsonParse(callResult.output);
  if (!parsed || typeof parsed !== "object") {
    return {
      scoreBand: "not_graded",
      criterionScores: [],
      summary: "AI assessor returned an unparseable response.",
      suggestedNextStep:
        "Try submitting again, or ask the facilitator to review your work.",
      ruleSignals,
      model: callResult.model,
      status: "failed",
      errorMessage: "Unparseable assessor output.",
    };
  }

  const record = parsed as Record<string, unknown>;
  const scoreBand = normaliseScoreBand(record.score_band);
  const summary =
    typeof record.summary === "string" ? record.summary.slice(0, 1500) : "";
  const suggestedNextStep =
    typeof record.suggested_next_step === "string"
      ? record.suggested_next_step.slice(0, 1200)
      : "";
  const criterionScores = normaliseCriterionScores(record.criterion_scores);

  return {
    scoreBand,
    criterionScores,
    summary,
    suggestedNextStep,
    ruleSignals,
    model: callResult.model,
    status: "completed",
  };
}

export async function persistTrainingAiAssessment(input: {
  submissionId: string;
  participantId: string;
  moduleId: string;
  orgId: string | null;
  taskId?: string | null;
  checkpointSlug?: string | null;
  outcome: AiAssessorOutcome;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("training_ai_assessments").insert({
    submission_id: input.submissionId,
    participant_id: input.participantId,
    module_id: input.moduleId,
    org_id: input.orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    task_id: input.taskId ?? null,
    checkpoint_slug: input.checkpointSlug ?? null,
    score_band: input.outcome.scoreBand,
    criterion_scores: input.outcome.criterionScores,
    summary: input.outcome.summary,
    suggested_next_step: input.outcome.suggestedNextStep,
    rule_signals: input.outcome.ruleSignals,
    model: input.outcome.model,
    status: input.outcome.status,
  });
}

export function aiAssessorInputFromSubmission(input: {
  submissionId: string;
  participantId: string;
  moduleId: string;
  orgId: string | null;
  scope: string;
  scopeId: string | null;
  metadata: Record<string, unknown>;
  inviteCode: string;
  moduleSlug: string;
  artifactUrl: string | null;
  summary: string | null;
}): AiAssessorInput {
  const labContext = (input.metadata?.labContext as Record<string, unknown> | undefined) ?? {};
  const checkpoint = labContext.checkpoint as
    | {
        slug?: string;
        title?: string;
        description?: string;
        facilitatorPrompt?: string;
      }
    | undefined;
  const task = labContext.task as
    | {
        id?: string;
        title?: string;
        successCriteria?: string | string[];
        rubric?: string | string[];
        notebookSlug?: string;
      }
    | undefined;
  const ruleSignals = (labContext.ruleSignals as AiAssessmentRuleSignal[] | undefined) ?? [];
  const code = typeof labContext.code === "string" ? labContext.code : null;
  const stdout = typeof labContext.stdout === "string" ? labContext.stdout : null;
  const stderr = typeof labContext.stderr === "string" ? labContext.stderr : null;
  const outputFiles = Array.isArray(labContext.outputFiles)
    ? (labContext.outputFiles as string[])
    : [];
  const datasetName =
    typeof labContext.datasetName === "string" ? labContext.datasetName : null;

  return {
    submissionId: input.submissionId,
    participantId: input.participantId,
    moduleId: input.moduleId,
    orgId: input.orgId,
    inviteCode: input.inviteCode,
    moduleSlug: input.moduleSlug,
    checkpoint: checkpoint?.slug
      ? {
          slug: checkpoint.slug,
          title: checkpoint.title ?? checkpoint.slug,
          description: checkpoint.description ?? null,
          facilitatorPrompt: checkpoint.facilitatorPrompt ?? null,
        }
      : input.scopeId && input.scope === "checkpoint"
        ? { slug: input.scopeId, title: input.scopeId }
        : null,
    task: task
      ? {
          id: task.id ?? null,
          title: task.title ?? null,
          successCriteria: task.successCriteria ?? null,
          rubric: task.rubric ?? null,
          notebookSlug: task.notebookSlug ?? null,
        }
      : null,
    ruleSignals,
    code,
    stdout,
    stderr,
    outputFiles,
    datasetName,
    artifactUrl: input.artifactUrl,
    summary: input.summary,
  };
}
