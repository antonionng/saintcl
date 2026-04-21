import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { resolveAgentWorkspaceFromConfig } from "@/lib/openclaw/agent-terminal";
import { assertModelSelectionAllowed, getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { writeAgentBootstrapFiles } from "@/lib/openclaw/profile-context";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { createAdminClient } from "@/lib/supabase/admin";

const patchAgentSchema = z.object({
  model: z.string().min(3).max(255).optional(),
  persona: z.string().min(3).max(8000).optional(),
}).refine((data) => data.model || data.persona, {
  message: "At least one of model or persona is required.",
});

function getModelUpdateErrorStatus(message: string) {
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

function getAgentDeleteErrorStatus(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("not authenticated")) return 401;
  if (normalized.includes("not found")) return 404;
  if (normalized.includes("cannot be deleted")) return 400;
  if (normalized.includes("invalid")) return 400;
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
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Agent management requires admin access." } }, { status: 403 });
  }

  const { id } = await context.params;
  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    return NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 });
  }

  let payload: z.infer<typeof patchAgentSchema>;
  try {
    payload = patchAgentSchema.parse(await request.json());
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

    const resolvedModel = payload.model ?? agent.model;

    if (payload.model) {
      await assertModelSelectionAllowed({
        orgId: session.org.id,
        userId: session.userId,
        isSuperAdmin: session.isSuperAdmin,
        model: payload.model,
        context: "agent",
      });

      const workspace = resolveAgentWorkspaceFromConfig({
        orgId: session.org.id,
        openClawAgentId: agent.openclaw_agent_id,
        config: agent.config,
      });

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
      await client.updateAgentModel({
        agentId: agent.openclaw_agent_id,
        workspace,
        model: payload.model,
      });
    }

    const configUpdate: Record<string, unknown> = {
      ...(agent.config ?? {}),
    };
    if (payload.model) {
      configUpdate.lastModelUpdateAt = new Date().toISOString();
    }
    if (payload.persona) {
      configUpdate.persona = payload.persona;
    }

    const dbUpdate: Record<string, unknown> = { config: configUpdate };
    if (payload.model) {
      dbUpdate.model = payload.model;
    }

    const { data, error } = await admin
      .from("agents")
      .update(dbUpdate)
      .eq("id", agent.id)
      .eq("org_id", session.org.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (payload.persona) {
      await writeAgentBootstrapFiles({
        orgId: session.org.id,
        agentId: agent.openclaw_agent_id,
        name: agent.name,
        model: resolvedModel,
        persona: payload.persona,
        org: {
          name: session.org.name,
          website: session.org.website,
          companySummary: session.org.company_summary,
          agentBrief: session.org.agent_brief,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update agent.";
    return NextResponse.json({ error: { message } }, { status: getModelUpdateErrorStatus(message) });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Agent management requires admin access." } }, { status: 403 });
  }

  const { id } = await context.params;
  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    return NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  try {
    let gatewayDeleted = false;
    try {
      const { client } = await getTenantOpenClawClient(session.org.id, { orgId: session.org.id });
      await client.deleteAgent({
        agentId: agent.openclaw_agent_id,
        deleteFiles: true,
      });
      gatewayDeleted = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete agent from OpenClaw.";
      if (!message.toLowerCase().includes("not found")) {
        throw error;
      }
    }

    const { data, error } = await admin
      .from("agents")
      .delete()
      .eq("id", agent.id)
      .eq("org_id", session.org.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: { ...data, gatewayDeleted } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete agent.";
    return NextResponse.json({ error: { message } }, { status: getAgentDeleteErrorStatus(message) });
  }
}
