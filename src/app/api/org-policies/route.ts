import { NextResponse } from "next/server";
import { z } from "zod";

import { isOpenClawConfigured } from "@/lib/env";
import { getCurrentOrg } from "@/lib/dal";
import { buildModelCatalogSnapshot } from "@/lib/openclaw/model-catalog";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { createAdminClient } from "@/lib/supabase/admin";

const approvedModelSchema = z.object({
  id: z.string().min(3).max(255),
  label: z.string().max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  contextWindow: z.number().int().positive().optional().nullable(),
  inputCostPerMillionCents: z.number().int().nonnegative().optional().nullable(),
  outputCostPerMillionCents: z.number().int().nonnegative().optional().nullable(),
  isFree: z.boolean().optional(),
});

const modelGuardrailsSchema = z.object({
  allowAgentOverride: z.boolean().default(true),
  allowSessionOverride: z.boolean().default(true),
  requireApprovalForPremiumModels: z.boolean().default(false),
  premiumInputCostPerMillionCents: z.number().int().nonnegative().optional().nullable(),
  premiumOutputCostPerMillionCents: z.number().int().nonnegative().optional().nullable(),
});

const policySchema = z.object({
  mission: z.string().max(4000).default(""),
  reasonForAgents: z.string().max(4000).default(""),
  defaultModel: z.string().max(255).optional().nullable(),
  requireApprovalOnSpend: z.boolean().default(false),
  guardrails: z.record(z.string(), z.unknown()).default({}),
  approvedModels: z.array(approvedModelSchema).default([]),
  blockedModels: z.array(z.string().min(3).max(255)).default([]),
  modelGuardrails: modelGuardrailsSchema.default({
    allowAgentOverride: true,
    allowSessionOverride: true,
    requireApprovalForPremiumModels: false,
  }),
});

function isMissingPolicySchemaError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("org_policies") &&
    (normalized.includes("schema cache") ||
      normalized.includes("does not exist") ||
      normalized.includes("relation"))
  );
}

export async function PATCH(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  let payload: z.infer<typeof policySchema>;
  try {
    payload = policySchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
  if (payload.defaultModel && payload.blockedModels.includes(payload.defaultModel)) {
    return NextResponse.json(
      { error: { message: "The default model cannot also be blocked." } },
      { status: 400 },
    );
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const enrichedSnapshot = await buildModelCatalogSnapshot({
    default_model: payload.defaultModel ?? null,
    approved_models: payload.approvedModels,
    blocked_models: payload.blockedModels,
    model_guardrails: payload.modelGuardrails,
  });
  const enrichedApprovedModels =
    payload.approvedModels.length > 0 || payload.defaultModel
      ? enrichedSnapshot.approvedModels.map((entry) => ({
          id: entry.id,
          label: entry.label,
          description: entry.description ?? null,
          contextWindow: entry.contextWindow ?? null,
          inputCostPerMillionCents: entry.inputCostPerMillionCents ?? null,
          outputCostPerMillionCents: entry.outputCostPerMillionCents ?? null,
          isFree: entry.isFree ?? false,
        }))
      : [];

  const { data, error } = await admin
    .from("org_policies")
    .upsert({
      org_id: session.org.id,
      mission: payload.mission,
      reason_for_agents: payload.reasonForAgents,
      default_model: payload.defaultModel ?? null,
      require_approval_on_spend: payload.requireApprovalOnSpend,
      guardrails: payload.guardrails,
      approved_models: enrichedApprovedModels,
      blocked_models: payload.blockedModels,
      model_guardrails: payload.modelGuardrails,
    })
    .select()
    .single();

  if (error) {
    if (isMissingPolicySchemaError(error.message)) {
      return NextResponse.json(
        {
          error: {
            message:
              "Policy storage is not set up in Supabase yet. Apply the pending governance migrations, then refresh and try saving again.",
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  let runtimeSync: {
    attempted: boolean;
    applied: boolean;
    message?: string;
  } = {
    attempted: false,
    applied: false,
  };

  if (isOpenClawConfigured()) {
    runtimeSync = {
      attempted: true,
      applied: false,
    };

    try {
      const { client } = await getTenantOpenClawClient(session.org.id, {
        orgId: session.org.id,
        defaultModel: enrichedSnapshot.defaultModel,
        approvedModels: enrichedSnapshot.approvedModels.map((entry) => ({
          id: entry.id,
          label: entry.label,
        })),
      });
      await client.applyModelGovernance({
        defaultModel: enrichedSnapshot.defaultModel,
        approvedModels: enrichedSnapshot.approvedModels.map((entry) => ({
          id: entry.id,
          label: entry.label,
        })),
      });
      runtimeSync = {
        attempted: true,
        applied: true,
      };
    } catch {
      runtimeSync = {
        attempted: true,
        applied: false,
        message: "Policies were saved, but the runtime sync is still pending because OpenClaw is offline.",
      };
    }
  }

  return NextResponse.json({ data, runtimeSync });
}

