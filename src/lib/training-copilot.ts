import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PLATFORM_TRAINING_KEY,
  getTrainingModulesForProgramme,
  getTrainingParticipantByCheckInToken,
  getTrainingParticipantByInviteForAuthUser,
} from "@/lib/training-dal";
import { ajbTrainingProgramme } from "@/lib/training";
import { createClient } from "@/lib/supabase/server";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";

export type CopilotScope = "module" | "checkpoint" | "task" | "assessment_question" | "notebook";
export type CopilotIntent = "ask" | "compare" | "critique" | "explain";
export type CopilotSurface = "notebook" | "studio" | "workbook" | "facilitator";
export type CopilotStatus = "completed" | "failed" | "blocked";

const COPILOT_TIMEOUT_MS = 60_000;
const COPILOT_MAX_PROMPT_CHARS = 24_000;
const COPILOT_MAX_SYSTEM_CHARS = 8_000;
const COPILOT_MAX_OUTPUT_CHARS = 32_000;
const COPILOT_MAX_COMPARE_MODELS = 3;
const COPILOT_DEFAULT_TEMPERATURE = 0;
const COPILOT_DEFAULT_MAX_TOKENS = 1024;

// Per-module default model. Lab-heavy Python modules pin a fast, reliable
// paid model (gpt-4o-mini) so the coach feels snappy during live learning
// and is not throttled by free-tier rate caps. `openrouter/auto` and the
// `:free` Gemini Flash were both timing out or returning empty/throttled
// responses mid-conversation. Other modules continue to use `auto` since
// their coach traffic is lower-volume and tolerates more latency.
const MODULE_DEFAULT_MODEL: Record<string, string> = {
  "programme-orientation": "openrouter/auto",
  "python-for-data": "openrouter/openai/gpt-4o-mini",
  "machine-learning-training": "openrouter/openai/gpt-4o-mini",
  "neural-networks": "openrouter/openai/gpt-4o-mini",
  "business-applications-in-ai": "openrouter/auto",
  "automation-in-ai": "openrouter/auto",
  "advanced-data-visualization": "openrouter/auto",
  "ai-in-banking-and-finance": "openrouter/auto",
};

// Default cohort allowlist for participant-driven calls. Notebook prompts may
// only target one of these models, regardless of what they pass in. Anything
// else is blocked at the route boundary so we never leak high-cost models to
// participants by accident. Edit here, or wire it into org policy later.
const PARTICIPANT_ALLOWED_MODELS = new Set<string>([
  "openrouter/auto",
  "openrouter/meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/meta-llama/llama-3.1-8b-instruct:free",
  "openrouter/google/gemini-2.0-flash-exp:free",
  "openrouter/anthropic/claude-3.5-haiku",
  "openrouter/openai/gpt-4o-mini",
]);

const SYSTEM_PROMPT_PREFIX = `You are a SaintClaw training copilot for the AJB AI and Data Programme.
- Treat all banking content as illustrative; never invent real customer or account data.
- Show your reasoning in three short bullets before any recommendation.
- If the user pastes anything that looks like real PII or live account numbers, refuse and ask them to redact.
- Prefer concise, decision-ready answers over long essays.`;

export type CopilotSession = {
  participantId: string;
  cohortId: string;
  moduleId: string;
  orgId: string | null;
  inviteCode: string;
  moduleSlug: string;
  participantDisplayName: string;
};

export type CopilotResolveError = {
  ok: false;
  status: number;
  message: string;
};

export type CopilotResolveSuccess = {
  ok: true;
  session: CopilotSession;
};

export async function resolveCopilotSession(input: {
  inviteCode: string;
  moduleSlug: string;
  bearerToken?: string | null;
}): Promise<CopilotResolveSuccess | CopilotResolveError> {
  if (!isModuleInProgramme(input.moduleSlug)) {
    return { ok: false, status: 404, message: "Training module not found." };
  }

  const session = await locateParticipantSession({
    inviteCode: input.inviteCode,
    bearerToken: input.bearerToken ?? null,
  });

  if (!session?.cohort) {
    return {
      ok: false,
      status: 401,
      message: "Participant session is not active. Sign in to the academy first.",
    };
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === input.moduleSlug);
  if (!trainingModule) {
    return { ok: false, status: 404, message: "Training module not found for this cohort." };
  }

  return {
    ok: true,
    session: {
      participantId: session.participant.id,
      cohortId: session.cohort.id,
      moduleId: trainingModule.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      inviteCode: input.inviteCode,
      moduleSlug: input.moduleSlug,
      participantDisplayName:
        session.participant.displayName ?? session.participant.fullName ?? session.participant.email,
    },
  };
}

async function locateParticipantSession(input: {
  inviteCode: string;
  bearerToken: string | null;
}) {
  // 1. Bearer token from notebook helper or scripted clients.
  if (input.bearerToken) {
    const tokenSession = await getTrainingParticipantByCheckInToken(input.bearerToken);
    if (tokenSession?.cohort && tokenSession.cohort.inviteCode === input.inviteCode) {
      return tokenSession;
    }
  }

  // 2. Browser cookie set after academy sign-in.
  const checkInToken = await getTrainingParticipantCheckInToken();
  if (checkInToken) {
    const cookieSession = await getTrainingParticipantByCheckInToken(checkInToken);
    if (cookieSession?.cohort && cookieSession.cohort.inviteCode === input.inviteCode) {
      return cookieSession;
    }
  }

  // 3. Fall back to a Saint account session linked to this invite.
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user?.id) return null;

  return getTrainingParticipantByInviteForAuthUser({
    inviteCode: input.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
}

function isModuleInProgramme(slug: string) {
  return ajbTrainingProgramme.modules.some((module) => module.slug === slug);
}

export function resolveDefaultModelForModule(moduleSlug: string) {
  return MODULE_DEFAULT_MODEL[moduleSlug] ?? env.openClawDefaultModel;
}

export function isParticipantModelAllowed(modelId: string) {
  return PARTICIPANT_ALLOWED_MODELS.has(normalizeModelId(modelId));
}

export function listParticipantAllowedModels() {
  return [...PARTICIPANT_ALLOWED_MODELS];
}

function normalizeModelId(modelId: string) {
  const trimmed = modelId.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("openrouter/") ? trimmed : `openrouter/${trimmed}`;
}

export type RedactionReport = {
  text: string;
  redactions: number;
  redacted: boolean;
};

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Long digit sequences (account numbers, card numbers, IDs).
  { pattern: /\b\d{9,}\b/g, replacement: "[REDACTED-NUMBER]" },
  // Card-like 4-4-4-4 groupings.
  { pattern: /\b(?:\d[ -]?){13,19}\b/g, replacement: "[REDACTED-CARD]" },
  // IBAN-style strings (loose match, AJB-relevant locales).
  { pattern: /\b(?:SA|AE|BH|KW|QA|OM|GB|US)\d{2}[A-Z0-9]{10,30}\b/gi, replacement: "[REDACTED-IBAN]" },
  // Email addresses.
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: "[REDACTED-EMAIL]" },
];

export function redactPii(text: string): RedactionReport {
  let updated = text;
  let count = 0;
  for (const { pattern, replacement } of PII_PATTERNS) {
    const matches = updated.match(pattern);
    if (matches) {
      count += matches.length;
      updated = updated.replace(pattern, replacement);
    }
  }
  return { text: updated, redactions: count, redacted: count > 0 };
}

export type CopilotCallInput = {
  session: CopilotSession;
  prompt: string;
  systemPrompt?: string | null;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  scope?: CopilotScope;
  scopeId?: string | null;
  exerciseId?: string | null;
  intent: CopilotIntent;
  surface: CopilotSurface;
  metadata?: Record<string, unknown>;
  requestId?: string;
};

export type CopilotCallResult = {
  requestId: string;
  model: string;
  defaultModel: string;
  output: string;
  status: CopilotStatus;
  errorMessage?: string;
  errorCode?: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  promptRedacted: boolean;
  redactions: number;
};

export async function runCopilotCall(input: CopilotCallInput): Promise<CopilotCallResult> {
  const requestId = input.requestId ?? randomUUID();
  const defaultModel = resolveDefaultModelForModule(input.session.moduleSlug);
  const requestedModel = input.model ?? defaultModel;
  const model = normalizeModelId(requestedModel);

  if (!isParticipantModelAllowed(model)) {
    const result: CopilotCallResult = {
      requestId,
      model,
      defaultModel,
      output: "",
      status: "blocked",
      errorCode: "model_not_allowed",
      errorMessage: "This model is not on the participant allowlist.",
      latencyMs: 0,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      costUsd: null,
      promptRedacted: false,
      redactions: 0,
    };
    await logCopilotCall({ input, result, requestedModel, prompt: "", systemPrompt: null });
    return result;
  }

  const trimmedPrompt = input.prompt.trim().slice(0, COPILOT_MAX_PROMPT_CHARS);
  if (!trimmedPrompt) {
    const result: CopilotCallResult = {
      requestId,
      model,
      defaultModel,
      output: "",
      status: "blocked",
      errorCode: "empty_prompt",
      errorMessage: "Prompt is empty.",
      latencyMs: 0,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      costUsd: null,
      promptRedacted: false,
      redactions: 0,
    };
    await logCopilotCall({ input, result, requestedModel, prompt: "", systemPrompt: null });
    return result;
  }

  const redaction = redactPii(trimmedPrompt);
  const safePrompt = redaction.text;

  const customSystem = (input.systemPrompt ?? "").trim().slice(0, COPILOT_MAX_SYSTEM_CHARS);
  const systemPrompt = customSystem
    ? `${SYSTEM_PROMPT_PREFIX}\n\n${customSystem}`
    : SYSTEM_PROMPT_PREFIX;

  if (!env.openRouterApiKey) {
    const result: CopilotCallResult = {
      requestId,
      model,
      defaultModel,
      output: "",
      status: "failed",
      errorCode: "openrouter_unconfigured",
      errorMessage: "OpenRouter is not configured on this deployment.",
      latencyMs: 0,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      costUsd: null,
      promptRedacted: redaction.redacted,
      redactions: redaction.redactions,
    };
    await logCopilotCall({ input, result, requestedModel, prompt: safePrompt, systemPrompt });
    return result;
  }

  const openRouterModel = model.startsWith("openrouter/") ? model.slice("openrouter/".length) : model;
  const startedAt = Date.now();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.appUrl,
        "X-Title": "SaintClaw Training Copilot",
      },
      body: JSON.stringify({
        model: openRouterModel,
        temperature:
          typeof input.temperature === "number" && Number.isFinite(input.temperature)
            ? clamp(input.temperature, 0, 2)
            : COPILOT_DEFAULT_TEMPERATURE,
        max_tokens:
          typeof input.maxTokens === "number" && Number.isFinite(input.maxTokens)
            ? clamp(Math.round(input.maxTokens), 32, 4096)
            : COPILOT_DEFAULT_MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: safePrompt },
        ],
      }),
      signal: AbortSignal.timeout(COPILOT_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const result: CopilotCallResult = {
        requestId,
        model,
        defaultModel,
        output: "",
        status: "failed",
        errorCode: `openrouter_${response.status}`,
        errorMessage: text.slice(0, 500) || `OpenRouter responded with ${response.status}.`,
        latencyMs,
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        costUsd: null,
        promptRedacted: redaction.redacted,
        redactions: redaction.redactions,
      };
      await logCopilotCall({ input, result, requestedModel, prompt: safePrompt, systemPrompt });
      return result;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        total_cost?: number;
      };
      model?: string;
    };

    const output = (json.choices?.[0]?.message?.content ?? "").slice(0, COPILOT_MAX_OUTPUT_CHARS);
    const inputTokens = parseTokenCount(json.usage?.prompt_tokens);
    const outputTokens = parseTokenCount(json.usage?.completion_tokens);
    const totalTokens = parseTokenCount(json.usage?.total_tokens);
    const costUsd =
      typeof json.usage?.total_cost === "number" && Number.isFinite(json.usage.total_cost)
        ? json.usage.total_cost
        : null;

    const result: CopilotCallResult = {
      requestId,
      model,
      defaultModel,
      output,
      status: output ? "completed" : "failed",
      errorCode: output ? undefined : "empty_response",
      errorMessage: output ? undefined : "OpenRouter returned no content.",
      latencyMs,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      promptRedacted: redaction.redacted,
      redactions: redaction.redactions,
    };
    await logCopilotCall({ input, result, requestedModel, prompt: safePrompt, systemPrompt });
    return result;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "OpenRouter call failed.";
    const result: CopilotCallResult = {
      requestId,
      model,
      defaultModel,
      output: "",
      status: "failed",
      errorCode: "network_error",
      errorMessage: message.slice(0, 500),
      latencyMs,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      costUsd: null,
      promptRedacted: redaction.redacted,
      redactions: redaction.redactions,
    };
    await logCopilotCall({ input, result, requestedModel, prompt: safePrompt, systemPrompt });
    return result;
  }
}

export const COPILOT_LIMITS = {
  maxPromptChars: COPILOT_MAX_PROMPT_CHARS,
  maxSystemChars: COPILOT_MAX_SYSTEM_CHARS,
  maxOutputChars: COPILOT_MAX_OUTPUT_CHARS,
  maxCompareModels: COPILOT_MAX_COMPARE_MODELS,
  defaultTemperature: COPILOT_DEFAULT_TEMPERATURE,
  defaultMaxTokens: COPILOT_DEFAULT_MAX_TOKENS,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseTokenCount(raw: unknown) {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

async function logCopilotCall(input: {
  input: CopilotCallInput;
  result: CopilotCallResult;
  requestedModel: string;
  prompt: string;
  systemPrompt: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  const metadata: Record<string, unknown> = {
    ...(input.input.metadata ?? {}),
    surface: input.input.surface,
    intent: input.input.intent,
    inviteCode: input.input.session.inviteCode,
    moduleSlug: input.input.session.moduleSlug,
    participantDisplayName: input.input.session.participantDisplayName,
  };

  await admin.from("training_copilot_calls").insert({
    org_id: input.input.session.orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    cohort_id: input.input.session.cohortId,
    participant_id: input.input.session.participantId,
    module_id: input.input.session.moduleId,
    request_id: input.result.requestId,
    scope: input.input.scope ?? "notebook",
    scope_id: input.input.scopeId ?? null,
    exercise_id: input.input.exerciseId ?? null,
    surface: input.input.surface,
    intent: input.input.intent,
    model: input.result.model,
    default_model: input.result.defaultModel,
    requested_model: input.requestedModel,
    system_prompt: input.systemPrompt,
    prompt_chars: input.prompt.length,
    output_chars: input.result.output.length,
    prompt_redacted: input.result.promptRedacted,
    redactions: input.result.redactions,
    temperature: input.input.temperature ?? COPILOT_DEFAULT_TEMPERATURE,
    max_tokens: input.input.maxTokens ?? COPILOT_DEFAULT_MAX_TOKENS,
    input_tokens: input.result.inputTokens,
    output_tokens: input.result.outputTokens,
    total_tokens: input.result.totalTokens,
    cost_usd: input.result.costUsd,
    latency_ms: input.result.latencyMs,
    status: input.result.status,
    error_code: input.result.errorCode ?? null,
    error_message: input.result.errorMessage ?? null,
    metadata,
  });
}
