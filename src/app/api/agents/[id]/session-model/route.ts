import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { assertModelSelectionAllowed, getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { buildAgentSessionKey, parseProviderFromModelRef } from "@/lib/openclaw/session-keys";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSessionModelSchema = z.object({
  model: z.string().min(3).max(255),
  sessionKey: z.string().min(3).max(255).optional(),
});

function getSessionModelErrorStatus(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("not authenticated")) return 401;
  if (normalized.includes("not found")) return 404;
  if (normalized.includes("not approved")) return 403;
  if (normalized.includes("disabled by organization policy")) return 403;
  if (normalized.includes("requires additional approval")) return 403;
  if (normalized.includes("insufficient wallet balance")) return 402;
  if (normalized.includes("hard spend limit")) return 402;
  return 500;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const { id } = await context.params;
  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    return NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 });
  }

  let payload: z.infer<typeof patchSessionModelSchema>;
  try {
    payload = patchSessionModelSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  try {
    const [{ snapshot }, admin] = await Promise.all([
      getOrgModelCatalogState(session.org.id),
      Promise.resolve(createAdminClient()),
    ]);
    if (!admin) {
      return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
    }

    await assertModelSelectionAllowed({
      orgId: session.org.id,
      userId: session.userId,
      isSuperAdmin: session.isSuperAdmin,
      model: payload.model,
      context: "session",
    });

    const sessionKey = payload.sessionKey?.trim() || buildAgentSessionKey(agent.openclaw_agent_id);
    const { client } = await getTenantOpenClawClient(session.org.id, {
      orgId: session.org.id,
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label,
      })),
    });
    await client.applyModelGovernance({
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label,
      })),
    });

    const result = await client.patchSession({
      key: sessionKey,
      model: payload.model,
    });

    await admin.from("session_model_overrides").insert({
      org_id: session.org.id,
      agent_id: agent.id,
      session_key: sessionKey,
      model: payload.model,
      provider: parseProviderFromModelRef(payload.model),
      changed_by: session.userId,
      metadata: {
        resolved: result.resolved ?? null,
      },
    });

    return NextResponse.json({
      data: {
        sessionKey,
        model: payload.model,
        resolved: result.resolved ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update session model.";
    return NextResponse.json({ error: { message } }, { status: getSessionModelErrorStatus(message) });
  }
}
