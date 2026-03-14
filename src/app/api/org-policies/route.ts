import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const policySchema = z.object({
  mission: z.string().max(4000).default(""),
  reasonForAgents: z.string().max(4000).default(""),
  defaultModel: z.string().max(255).optional().nullable(),
  requireApprovalOnSpend: z.boolean().default(false),
  guardrails: z.record(z.string(), z.unknown()).default({}),
});

export async function PATCH(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const payload = policySchema.parse(await request.json());
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const { data, error } = await admin
    .from("org_policies")
    .upsert({
      org_id: session.org.id,
      mission: payload.mission,
      reason_for_agents: payload.reasonForAgents,
      default_model: payload.defaultModel ?? null,
      require_approval_on_spend: payload.requireApprovalOnSpend,
      guardrails: payload.guardrails,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data });
}

