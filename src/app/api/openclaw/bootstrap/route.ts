import { NextResponse } from "next/server";

import { getAgents, getCurrentOrg, loadCurrentUserProfile } from "@/lib/dal";
import { sendAgentIntroductionEmail } from "@/lib/email/service";
import { isOpenClawConfigured } from "@/lib/env";
import { injectAgentContext } from "@/lib/openclaw/context-injection";
import { getAgentWorkspacePath } from "@/lib/openclaw/paths";
import { resolveModelSelection } from "@/lib/openclaw/model-governance";
import { RuntimeRateLimitError } from "@/lib/openclaw/client";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { insertAgentMetadata, upsertAgentAssignment, upsertRuntimeMetadata } from "@/lib/openclaw/runtime-store";
import { createClient } from "@/lib/supabase/server";
import { getAgentTemplate } from "@/lib/agent-templates";
import { getBuiltInPersonaById } from "@/lib/personas";
import { getPersonaForUseCase, getUseCase } from "@/lib/use-cases";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const FALLBACK_PERSONA =
  "You are my work copilot. Help me move faster while respecting company mission, policy, and approval guardrails.\n\nKnowledge scope:\n- You can rely on company knowledge plus my personal knowledge when relevant.\n- Use memory search before guessing when a document-backed answer may exist.";

async function resolveBootstrapTemplate(): Promise<{
  agentName: string;
  persona: string;
  useCaseId: string | null;
}> {
  try {
    const supabase = await createClient();
    if (!supabase) return { agentName: "My Agent", persona: FALLBACK_PERSONA, useCaseId: null };
    const { data } = await supabase.auth.getUser();
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const templateId = typeof meta.template_id === "string" ? meta.template_id : null;
    const template = getAgentTemplate(templateId);
    const useCaseId = typeof meta.use_case === "string" ? meta.use_case : null;
    const useCase = getUseCase(useCaseId);

    const personaSeed = template
      ? getBuiltInPersonaById(template.personaId)
      : getPersonaForUseCase(useCaseId);
    const personaInstructions = personaSeed?.instructions?.trim();
    const persona = personaInstructions
      ? `${personaInstructions}\n\nKnowledge scope:\n- You can rely on company knowledge plus my personal knowledge when relevant.\n- Use memory search before guessing when a document-backed answer may exist.`
      : FALLBACK_PERSONA;
    return {
      agentName: template?.agentName ?? useCase?.agentName ?? "My Agent",
      persona,
      useCaseId,
    };
  } catch {
    return { agentName: "My Agent", persona: FALLBACK_PERSONA, useCaseId: null };
  }
}

export async function POST() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageAgents) {
    return NextResponse.json(
      { error: { message: "Agent creation requires admin access." } },
      { status: 403 },
    );
  }

  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "Agent runtime is not configured for this environment." } },
      { status: 503 },
    );
  }

  const orgId = session.org.id;
  const existingAgents = await getAgents(orgId);
  if (existingAgents.length > 0) {
    return NextResponse.json({ data: { created: false, reason: "already_bootstrapped" } });
  }

  const { agentName, persona, useCaseId } = await resolveBootstrapTemplate();
  const slug = slugify(`${session.userId.slice(0, 8)}-${agentName}`);
  const profile = await loadCurrentUserProfile();

  try {
    const { model, snapshot } = await resolveModelSelection({
      orgId,
      userId: session.userId,
      isSuperAdmin: session.isSuperAdmin,
      trialStatus: session.org.trial_status,
      trialEndsAt: session.org.trial_ends_at,
      context: "agent",
    });
    const { client, runtime, source } = await getTenantOpenClawClient(orgId, {
      orgId,
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label,
      })),
    });
    const runtimeMetadata = runtime ? await upsertRuntimeMetadata(runtime) : null;
    const workspacePath = getAgentWorkspacePath(orgId, slug, { source });
    await client.withSession(async (rpc) => {
      // Fetch the gateway snapshot exactly once per bootstrap session and pass
      // it to both governance and provisioning helpers. They each use it to
      // skip their `config.patch` when the desired state is already in place,
      // which keeps us under the gateway's 3-per-60s control-plane write cap
      // when users retry the create-agent button.
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
      await client.provisionAgent(
        {
          agentId: slug,
          workspace: workspacePath,
          model,
          name: agentName,
        },
        rpc,
        { currentSnapshot },
      );
    });
    let row: Awaited<ReturnType<typeof insertAgentMetadata>>;
    try {
      // Workspace files only at this stage. Knowledge mirroring + memorySearch
      // happen after the assignment is upserted below so the scope is known.
      await injectAgentContext(
        {
          id: slug,
          org_id: orgId,
          user_id: session.userId,
          openclaw_agent_id: slug,
          name: agentName,
          model,
          config: { persona },
          assignment: null,
        },
        {
          client,
          persona,
          org: {
            name: session.org.name,
            website: session.org.website,
            companySummary: session.org.company_summary,
            agentBrief: session.org.agent_brief,
          },
          profile: profile
            ? {
                displayName: profile.displayName,
                email: profile.email,
                role: profile.role,
                whatIDo: profile.whatIDo,
                agentBrief: profile.agentBrief,
              }
            : null,
          syncKnowledge: false,
          applySafeMemoryConfig: false,
          writeHeartbeat: true,
        },
      );

      row = await insertAgentMetadata({
        orgId,
        userId: session.userId,
        runtimeDbId: runtimeMetadata?.id,
        name: agentName,
        slug,
        model,
        persona,
        workspacePath,
        metadata: {
          scope: "employee",
          assignee: session.userId,
          bootstrap: "auto",
          useCase: useCaseId ?? undefined,
          runtimeSource: source,
          terminal: {
            enabled: false,
          },
        },
      });
    } catch (error) {
      await client.deleteAgent({ agentId: slug, deleteFiles: true }).catch(() => null);
      throw error;
    }

    if (row?.id) {
      await upsertAgentAssignment({
        orgId,
        agentId: row.id,
        assigneeType: "employee",
        assigneeRef: session.userId,
        createdBy: session.userId,
      });
      await injectAgentContext(
        {
          id: row.id,
          org_id: orgId,
          user_id: session.userId,
          openclaw_agent_id: slug,
          name: agentName,
          model,
          config: { persona },
          assignment: {
            assignee_type: "employee",
            assignee_ref: session.userId,
          },
        },
        {
          client,
          persona,
          org: {
            name: session.org.name,
            website: session.org.website,
            companySummary: session.org.company_summary,
            agentBrief: session.org.agent_brief,
          },
          profile: profile
            ? {
                displayName: profile.displayName,
                email: profile.email,
                role: profile.role,
                whatIDo: profile.whatIDo,
                agentBrief: profile.agentBrief,
              }
            : null,
          syncKnowledge: true,
          applySafeMemoryConfig: true,
          writeHeartbeat: false,
        },
      ).catch(() => null);

      sendAgentIntroductionEmail({
        orgId,
        orgName: session.org.name,
        orgWebsite: session.org.website ?? null,
        orgLogoUrl: session.org.logoUrl ?? null,
        agentId: row.id,
        agentName: agentName,
        agentScope: "employee",
        agentModel: model,
        agentPersona: persona,
        recipientUserId: session.userId,
        assignerName: session.email ?? null,
        trigger: "bootstrap",
      }).catch(() => null);
    }

    return NextResponse.json({
      data: {
        created: true,
        id: row?.id ?? slug,
        openclawAgentId: slug,
      },
    });
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
    const message = error instanceof Error ? error.message : "Bootstrap failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

