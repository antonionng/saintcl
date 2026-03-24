import { NextResponse } from "next/server";

import { getAgents, getCurrentOrg, loadCurrentUserProfile } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { syncKnowledgeToAgent } from "@/lib/openclaw/knowledge-sync";
import { getAgentWorkspacePath } from "@/lib/openclaw/paths";
import { resolveModelSelection } from "@/lib/openclaw/model-governance";
import { appendOrgContextToPersona, appendProfileContextToPersona, writeAgentBootstrapFiles } from "@/lib/openclaw/profile-context";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { insertAgentMetadata, upsertAgentAssignment } from "@/lib/openclaw/runtime-store";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured for this environment." } },
      { status: 503 },
    );
  }

  const orgId = session.org.id;
  const existingAgents = await getAgents(orgId);
  if (existingAgents.length > 0) {
    return NextResponse.json({ data: { created: false, reason: "already_bootstrapped" } });
  }

  const agentName = "My Agent";
  const slug = slugify(`${session.userId.slice(0, 8)}-my-agent`);
  const profile = await loadCurrentUserProfile();
  const persona = appendProfileContextToPersona(
    appendOrgContextToPersona(
      "You are my work copilot. Help me move faster while respecting company mission, policy, and approval guardrails.\n\nKnowledge scope:\n- You can rely on company knowledge plus my personal knowledge when relevant.\n- Use memory search before guessing when a document-backed answer may exist.",
      {
        name: session.org.name,
        website: session.org.website,
        companySummary: session.org.company_summary,
        agentBrief: session.org.agent_brief,
      },
    ),
    profile,
  );

  try {
    const { model, snapshot } = await resolveModelSelection({
      orgId,
      userId: session.userId,
      context: "agent",
    });
    const { client, source } = await getTenantOpenClawClient(orgId, {
      orgId,
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label,
      })),
    });
    const workspacePath = getAgentWorkspacePath(orgId, slug, { source });
    await client.applyModelGovernance({
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label,
      })),
    });
    await client.provisionAgent({
      agentId: slug,
      workspace: workspacePath,
      model,
    });
    await writeAgentBootstrapFiles({
      orgId,
      agentId: slug,
      name: agentName,
      model,
      persona,
    });

    const row = await insertAgentMetadata({
      orgId,
      userId: session.userId,
      name: agentName,
      slug,
      model,
      persona,
      workspacePath,
      metadata: {
        scope: "employee",
        assignee: session.userId,
        bootstrap: "auto",
        terminal: {
          enabled: false,
        },
      },
    });

    if (row?.id) {
      await upsertAgentAssignment({
        orgId,
        agentId: row.id,
        assigneeType: "employee",
        assigneeRef: session.userId,
        createdBy: session.userId,
      });
      await syncKnowledgeToAgent({
        ...row,
        assignment: {
          assignee_type: "employee",
          assignee_ref: session.userId,
        },
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
    const message = error instanceof Error ? error.message : "Bootstrap failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

