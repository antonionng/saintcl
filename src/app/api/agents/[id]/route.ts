import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { resolveAgentWorkspaceFromConfig } from "@/lib/openclaw/agent-terminal";
import { injectAgentContext } from "@/lib/openclaw/context-injection";
import { assertModelSelectionAllowed, getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { RuntimeRateLimitError } from "@/lib/openclaw/client";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { createAdminClient } from "@/lib/supabase/admin";

const patchAgentSchema = z.object({
  model: z.string().min(3).max(255).optional(),
  persona: z.string().min(3).max(8000).optional(),
  avatarInitials: z.string().trim().max(3).nullable().optional(),
  avatarTheme: z.number().int().min(0).max(32).nullable().optional(),
}).refine((data) => data.model || data.persona || data.avatarInitials !== undefined || data.avatarTheme !== undefined, {
  message: "At least one editable agent field is required.",
});

function getModelUpdateErrorStatus(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("not authenticated")) return 401;
  if (normalized.includes("not found")) return 404;
  if (normalized.includes("not approved")) return 403;
  if (normalized.includes("disabled by organization policy")) return 403;
  if (normalized.includes("requires additional approval")) return 403;
  if (normalized.includes("paid models are locked")) return 402;
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
      getOrgModelCatalogState(session.org.id, {
        trialStatus: session.org.trial_status,
        trialEndsAt: session.org.trial_ends_at,
        isSuperAdmin: session.isSuperAdmin,
      }),
      Promise.resolve(createAdminClient()),
    ]);
    if (!admin) {
      return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
    }

    const resolvedModel = payload.model ?? agent.model;

    if (payload.model) {
      const nextModel = payload.model;

      await assertModelSelectionAllowed({
        orgId: session.org.id,
        userId: session.userId,
        isSuperAdmin: session.isSuperAdmin,
        trialStatus: session.org.trial_status,
        trialEndsAt: session.org.trial_ends_at,
        model: nextModel,
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
      await client.withSession(async (rpc) => {
        const currentSnapshot = await client.getConfigSnapshot(rpc);
        await client.applyModelGovernance(
          {
            defaultModel: snapshot.defaultModel,
            approvedModels: snapshot.approvedModels.map((entry) => ({
              id: entry.id,
              label: entry.label,
            })),
          },
          rpc,
          { currentSnapshot },
        );
        await client.updateAgentModel(
          {
            agentId: agent.openclaw_agent_id,
            workspace,
            model: nextModel,
            name: agent.name,
            avatar: normalizeAgentAvatarConfig((agent.config as Record<string, unknown> | null | undefined)?.agentAvatar),
          },
          rpc,
          { currentSnapshot },
        );
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
    if (payload.avatarInitials !== undefined || payload.avatarTheme !== undefined) {
      const currentAvatar =
        configUpdate.agentAvatar && typeof configUpdate.agentAvatar === "object" && !Array.isArray(configUpdate.agentAvatar)
          ? (configUpdate.agentAvatar as Record<string, unknown>)
          : {};
      configUpdate.agentAvatar = {
        ...currentAvatar,
        ...(payload.avatarInitials !== undefined ? { initials: payload.avatarInitials?.trim().toUpperCase() || null } : {}),
        ...(payload.avatarTheme !== undefined ? { theme: payload.avatarTheme } : {}),
      };
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
      await injectAgentContext(
        {
          id: agent.id,
          org_id: session.org.id,
          user_id: agent.user_id ?? null,
          openclaw_agent_id: agent.openclaw_agent_id,
          name: agent.name,
          model: resolvedModel,
          config: { ...(agent.config ?? {}), persona: payload.persona },
          assignment: agent.assignment ?? null,
        },
        {
          persona: payload.persona,
          org: {
            name: session.org.name,
            website: session.org.website,
            companySummary: session.org.company_summary,
            agentBrief: session.org.agent_brief,
          },
          syncKnowledge: false,
          applySafeMemoryConfig: false,
          writeHeartbeat: false,
        },
      ).catch(() => null);
    }

    if (payload.avatarInitials !== undefined || payload.avatarTheme !== undefined) {
      const avatarConfig = normalizeAgentAvatarConfig(configUpdate.agentAvatar);
      if (!avatarConfig.imagePath) {
        await getTenantOpenClawClient(session.org.id, { orgId: session.org.id })
          .then(({ client }) =>
            client.updateAgentIdentity({
              agentId: agent.openclaw_agent_id,
              name: agent.name,
              avatar: avatarConfig,
            }),
          )
          .catch(() => null);
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof RuntimeRateLimitError) {
      const retryAfterSeconds = Math.max(1, Math.ceil(error.retryAfterMs / 1000));
      return NextResponse.json(
        {
          error: {
            message: `Too many setup changes in the last minute. Please try again in ${retryAfterSeconds} seconds.`,
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }
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
      const message = error instanceof Error ? error.message : "Unable to delete agent from the runtime.";
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
