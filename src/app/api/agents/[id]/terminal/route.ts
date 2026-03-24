import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAgentTerminalRepoAllowlists,
  getAgentTerminalRuns,
  getCurrentOrg,
  getVisibleAgentForSession,
} from "@/lib/dal";
import {
  buildAgentTerminalSocketPath,
  resolveAgentTerminalAccess,
} from "@/lib/openclaw/agent-terminal-access";
import {
  getAgentTerminalConfig,
  mergeAgentTerminalConfig,
  normalizeAgentTerminalRepoPaths,
  resolveAgentWorkspaceFromConfig,
} from "@/lib/openclaw/agent-terminal";
import { replaceAgentTerminalRepoAllowlists } from "@/lib/openclaw/runtime-store";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";
import { createAdminClient } from "@/lib/supabase/admin";

const updateAgentTerminalSchema = z.object({
  enabled: z.boolean(),
  repoPaths: z.array(z.string().trim().min(1).max(255)).max(24),
});

async function resolveAdminAgent(agentId: string) {
  const session = await getCurrentOrg();
  if (!session) {
    return { error: NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 }) };
  }
  if (!session.capabilities.canManageAdminTools) {
    return { error: NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 }) };
  }

  const agent = await getVisibleAgentForSession(agentId, session);
  if (!agent) {
    return { error: NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 }) };
  }

  return { session, agent };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveAdminAgent(id);
  if ("error" in resolved) {
    return resolved.error;
  }

  const [allowlists, runs, target] = await Promise.all([
    getAgentTerminalRepoAllowlists(resolved.agent.id, resolved.session.org.id),
    getAgentTerminalRuns(resolved.agent.id, resolved.session.org.id, 20),
    resolveTenantGatewayTarget(resolved.session.org.id),
  ]);
  const repoPaths = normalizeAgentTerminalRepoPaths(
    allowlists
      .map((entry) => ("repo_path" in entry && typeof entry.repo_path === "string" ? entry.repo_path : ""))
      .filter(Boolean),
  );

  return NextResponse.json({
    data: {
      enabled: getAgentTerminalConfig(resolved.agent.config).enabled,
      repoPaths,
      workspacePath: resolveAgentWorkspaceFromConfig({
        orgId: resolved.session.org.id,
        openClawAgentId: resolved.agent.openclaw_agent_id,
        config: resolved.agent.config,
        source: target?.source,
      }),
      runs,
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveAdminAgent(id);
  if ("error" in resolved) {
    return resolved.error;
  }

  let payload: z.infer<typeof updateAgentTerminalSchema>;
  try {
    payload = updateAgentTerminalSchema.parse(await request.json());
    payload = {
      enabled: payload.enabled,
      repoPaths: normalizeAgentTerminalRepoPaths(payload.repoPaths),
    };
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  try {
    const { data, error } = await admin
      .from("agents")
      .update({
        config: mergeAgentTerminalConfig(resolved.agent.config, payload),
      })
      .eq("id", resolved.agent.id)
      .eq("org_id", resolved.session.org.id)
      .select("config")
      .single();

    if (error) {
      throw error;
    }

    await replaceAgentTerminalRepoAllowlists({
      orgId: resolved.session.org.id,
      agentId: resolved.agent.id,
      repoPaths: payload.repoPaths,
      createdBy: resolved.session.userId,
    });

    return NextResponse.json({
      data: {
        enabled: getAgentTerminalConfig(data?.config).enabled,
        repoPaths: payload.repoPaths,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update terminal policy.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const access = await resolveAgentTerminalAccess(id);
    const socketPath = buildAgentTerminalSocketPath(id);

    return NextResponse.json({
      data: {
        sessionId: socketPath.split("sessionId=")[1],
        socketPath,
        workspacePath: access.workspacePath,
        repoPaths: access.repoPaths,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start terminal session.";
    const status =
      message === "Not authenticated"
        ? 401
        : message === "Admin access required."
          ? 403
          : message === "Agent not found."
            ? 404
            : message === "Terminal access is not enabled for this agent."
              ? 403
              : 503;
    return NextResponse.json({ error: { message } }, { status });
  }
}
