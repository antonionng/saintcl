import { NextResponse } from "next/server";
import { z } from "zod";

import {
  COPILOT_LIMITS,
  listParticipantAllowedModels,
  resolveCopilotSession,
  resolveDefaultModelForModule,
  runCopilotCall,
  type CopilotCallInput,
  type CopilotCallResult,
  type CopilotIntent,
  type CopilotScope,
  type CopilotSurface,
} from "@/lib/training-copilot";
import {
  buildLabPersonaSystemPrompt,
  getLabCoachPersona,
  type LabBeat,
} from "@/lib/training-lab-personas";
import { labContextSchema } from "@/lib/training-copilot-schema";

const FALLBACK_MODEL = "openrouter/auto";

function shouldFallback(result: CopilotCallResult): boolean {
  if (result.status !== "failed") return false;
  const code = result.errorCode ?? "";
  if (
    code === "openrouter_429" ||
    code === "openrouter_500" ||
    code === "openrouter_502" ||
    code === "openrouter_503" ||
    code === "openrouter_504" ||
    code === "network_error" ||
    code === "empty_response"
  ) {
    return true;
  }
  const message = (result.errorMessage ?? "").toLowerCase();
  return (
    message.includes("rate-limit") ||
    message.includes("rate limit") ||
    message.includes("temporarily") ||
    message.includes("upstream") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborted")
  );
}

async function runCopilotCallWithFallback(
  input: CopilotCallInput,
): Promise<CopilotCallResult> {
  const primary = await runCopilotCall(input);
  if (!shouldFallback(primary)) return primary;
  const requestedModel = (input.model ?? "").trim();
  if (requestedModel === FALLBACK_MODEL || requestedModel === "auto") {
    return primary;
  }
  const fallback = await runCopilotCall({
    ...input,
    model: FALLBACK_MODEL,
    requestId: undefined,
  });
  return fallback.status === "completed" ? fallback : primary;
}

const scopeSchema = z.enum(["module", "checkpoint", "task", "assessment_question", "notebook"]);
const intentSchema = z.enum(["ask", "compare", "critique", "explain"]);
const surfaceSchema = z.enum(["notebook", "studio", "workbook", "facilitator"]);

const copilotRequestSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  prompt: z.string().min(1, "Prompt is required.").max(COPILOT_LIMITS.maxPromptChars),
  system: z.string().max(COPILOT_LIMITS.maxSystemChars).optional().nullable(),
  model: z.string().trim().min(2).max(200).optional().nullable(),
  models: z
    .array(z.string().trim().min(2).max(200))
    .min(1)
    .max(COPILOT_LIMITS.maxCompareModels)
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(32).max(4096).optional(),
  intent: intentSchema.optional(),
  surface: surfaceSchema.optional(),
  scope: scopeSchema.optional(),
  scopeId: z.string().trim().max(200).optional().nullable(),
  exerciseId: z.string().trim().max(200).optional().nullable(),
  labContext: labContextSchema.optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Hard rules about the lab surface itself. These are prepended to every
// lab-scoped coach call so the model never tells the learner to "open a
// Python workspace", "switch to the IDE", or "run this in your terminal" —
// the chat thread IS the workspace, and every fenced python block the coach
// emits gets a Run button rendered inline by the chat UI.
const LAB_SURFACE_RULES = `Lab surface rules (do not break these):
- The chat thread IS the Python workspace. There is no separate notebook, IDE, terminal, or "Python workspace" tab.
- Any python code block you produce is rendered as a card with a Run button. The learner clicks Run and the output appears below it in the same thread.
- Never instruct the learner to "open Python", "switch to your workspace", "paste this into your editor", "run this in your terminal", "verify the output in the workspace", or anything similar. Just say "click Run on the block below" or "run the snippet below".
- Datasets the learner has attached are mounted at /workspace/data/<filename>.csv. Read them with pandas as if they exist on disk.
- When you provide a starter snippet, output exactly one runnable \`\`\`python fenced block, kept short (under ~25 lines) and self-contained.
- Prose first (1-3 short bullets), then the code block. After the code block, one short sentence about what success will look like.`;

function buildLabContextSystem(
  context: z.infer<typeof labContextSchema> | null | undefined,
): string | null {
  if (!context) return LAB_SURFACE_RULES;
  const lines: string[] = [LAB_SURFACE_RULES, "", "Lab context for this learner:"];
  if (context.checkpoint) {
    lines.push(`- Activity: ${context.checkpoint.title}`);
    if (context.checkpoint.description) {
      lines.push(`  Description: ${context.checkpoint.description}`);
    }
    if (context.checkpoint.leadershipQuestion) {
      lines.push(
        `  LEADERSHIP QUESTION (the actual ask, in their voice — quote it back when the learner needs the brief): "${context.checkpoint.leadershipQuestion}"`,
      );
    }
    if (context.checkpoint.facilitatorPrompt) {
      lines.push(`  Facilitator prompt: ${context.checkpoint.facilitatorPrompt}`);
    }
    if (context.checkpoint.dataPosture) {
      lines.push(`  Data posture: ${context.checkpoint.dataPosture}`);
    }
  }
  if (context.task?.title) {
    const taskKindLabel = context.task.kind === "workbench" ? "Workbench task" : "Task";
    lines.push(`- ${taskKindLabel}: ${context.task.title}`);
    if (context.task.prompt) {
      lines.push(`  Prompt: ${context.task.prompt}`);
    }
    if (context.task.successCriteria) {
      lines.push(`  Success criteria: ${context.task.successCriteria}`);
    }
    if (context.task.inputHint) {
      lines.push(
        `  Canonical input hint (use these variable names where suggested so the auto-checker recognises the work): ${context.task.inputHint}`,
      );
    }
  }
  if (context.currentBeat) {
    lines.push(`- Current beat in the four-step loop: ${context.currentBeat.toUpperCase()}`);
  }
  if (context.challengeQuestion) {
    lines.push(`- Defend challenge question: ${context.challengeQuestion.prompt}`);
    if (context.challengeQuestion.rubric) {
      lines.push(`  Rubric: ${context.challengeQuestion.rubric}`);
    }
  }
  if (context.datasetName) {
    lines.push(`- Dataset in use: ${context.datasetName} (mounted at /workspace/data/)`);
  }
  if (context.code) {
    const snippet = context.code.slice(0, 6000);
    lines.push("- Current code buffer:\n```\n" + snippet + "\n```");
  }
  if (context.stdout) {
    const snippet = context.stdout.slice(0, 2000);
    lines.push("- Last stdout:\n```\n" + snippet + "\n```");
  }
  if (context.stderr) {
    const snippet = context.stderr.slice(0, 2000);
    lines.push("- Last stderr:\n```\n" + snippet + "\n```");
  }
  if (context.priorConversation) {
    lines.push(`- Earlier conversation:\n${context.priorConversation}`);
  }
  lines.push(
    "Use this context to answer precisely. If something is missing, ask for it rather than guessing.",
  );
  return lines.join("\n");
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON body." } }, { status: 400 });
  }

  const parsed = copilotRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid copilot request." } },
      { status: 400 },
    );
  }

  const sessionResult = await resolveCopilotSession({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
    bearerToken: readBearerToken(request),
  });

  if (!sessionResult.ok) {
    return NextResponse.json(
      { error: { message: sessionResult.message } },
      { status: sessionResult.status },
    );
  }

  const { session } = sessionResult;
  const intent: CopilotIntent =
    parsed.data.intent ?? (parsed.data.models && parsed.data.models.length > 1 ? "compare" : "ask");
  const surface: CopilotSurface = parsed.data.surface ?? "notebook";
  const scope: CopilotScope = parsed.data.scope ?? "notebook";
  const requestedModels =
    parsed.data.models && parsed.data.models.length > 0
      ? parsed.data.models
      : [parsed.data.model ?? resolveDefaultModelForModule(parsed.data.moduleSlug)];

  const labContext = parsed.data.labContext ?? null;
  const labContextSystem = buildLabContextSystem(labContext);

  // Resolve a per-lab persona when the call is scoped to a specific
  // checkpoint. One persona per lab; no sub-agent orchestration. The persona
  // overrides any client-supplied `system` for python labs so the voice stays
  // consistent across the four-step loop. Other lab modules fall back to the
  // existing system prompt.
  const checkpointSlugForPersona =
    labContext?.checkpoint?.slug ??
    (parsed.data.scope === "checkpoint" ? parsed.data.scopeId ?? null : null);
  const persona = getLabCoachPersona(parsed.data.moduleSlug, checkpointSlugForPersona);
  const personaSystem = persona
    ? buildLabPersonaSystemPrompt(persona, (labContext?.currentBeat as LabBeat | null) ?? null)
    : null;

  const combinedSystemPrompt = [
    personaSystem,
    persona ? null : parsed.data.system ?? null,
    labContextSystem,
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join("\n\n")
    .trim() || null;

  const isCompare = requestedModels.length > 1;
  const callRunner = isCompare ? runCopilotCall : runCopilotCallWithFallback;

  const results = await Promise.all(
    requestedModels.map((model) =>
      callRunner({
        session,
        prompt: parsed.data.prompt,
        systemPrompt: combinedSystemPrompt,
        model,
        temperature: parsed.data.temperature,
        maxTokens: parsed.data.maxTokens,
        scope,
        scopeId: parsed.data.scopeId ?? null,
        exerciseId: parsed.data.exerciseId ?? null,
        intent,
        surface,
        metadata: parsed.data.metadata,
      }),
    ),
  );

  const blockedResult = results.find((result) => result.status === "blocked");
  if (blockedResult && results.every((result) => result.status === "blocked")) {
    return NextResponse.json(
      {
        error: { message: blockedResult.errorMessage ?? "Copilot call was blocked." },
        data: {
          requestId: blockedResult.requestId,
          allowedModels: listParticipantAllowedModels(),
          defaultModel: resolveDefaultModelForModule(parsed.data.moduleSlug),
          results,
        },
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    data: {
      requestId: results[0]?.requestId ?? null,
      defaultModel: resolveDefaultModelForModule(parsed.data.moduleSlug),
      allowedModels: listParticipantAllowedModels(),
      intent,
      results,
    },
  });
}

export async function GET() {
  return NextResponse.json({
    data: {
      allowedModels: listParticipantAllowedModels(),
      limits: COPILOT_LIMITS,
    },
  });
}
