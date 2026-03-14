import { NextResponse } from "next/server";

import { getAgents, getCurrentOrg } from "@/lib/dal";
import { env, isOpenClawConfigured } from "@/lib/env";
import { OpenClawClient } from "@/lib/openclaw/client";
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
  const model = env.openClawDefaultModel;
  const persona =
    "You are my work copilot. Help me move faster while respecting company mission, policy, and approval guardrails.";

  try {
    const client = new OpenClawClient();
    await client.provisionAgent({
      agentId: slug,
      workspace: `workspaces/${slug}`,
      model,
    });

    const row = await insertAgentMetadata({
      orgId,
      userId: session.userId,
      name: agentName,
      slug,
      model,
      persona,
      workspacePath: `workspaces/${slug}`,
      metadata: {
        scope: "employee",
        assignee: session.userId,
        bootstrap: "auto",
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

