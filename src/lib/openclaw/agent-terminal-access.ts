import { randomUUID } from "node:crypto";

import { getAgentTerminalRepoAllowlists, getAgentTerminalRuns, getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import {
  getAgentTerminalConfig,
  normalizeAgentTerminalRepoPaths,
  resolveAgentWorkspaceFromConfig,
} from "@/lib/openclaw/agent-terminal";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export async function resolveAgentTerminalAccess(agentId: string) {
  const session = await getCurrentOrg();
  if (!session) {
    throw new Error("Not authenticated");
  }
  if (!session.capabilities.canManageAdminTools) {
    throw new Error("Admin access required.");
  }

  const agent = await getVisibleAgentForSession(agentId, session);
  if (!agent) {
    throw new Error("Agent not found.");
  }

  const terminal = getAgentTerminalConfig(agent.config);
  if (!terminal.enabled) {
    throw new Error("Terminal access is not enabled for this agent.");
  }

  const allowlists = await getAgentTerminalRepoAllowlists(agent.id, session.org.id);
  const repoPaths = normalizeAgentTerminalRepoPaths(
    allowlists
      .map((entry) => ("repo_path" in entry && typeof entry.repo_path === "string" ? entry.repo_path : ""))
      .filter(Boolean),
  );
  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    throw new Error("OpenClaw gateway is not configured.");
  }

  return {
    session,
    agent,
    target,
    repoPaths,
    workspacePath: resolveAgentWorkspaceFromConfig({
      orgId: session.org.id,
      openClawAgentId: agent.openclaw_agent_id,
      config: agent.config,
      source: target.source,
    }),
  };
}

export async function getAgentTerminalView(agentId: string) {
  const access = await resolveAgentTerminalAccess(agentId);
  const runs = await getAgentTerminalRuns(access.agent.id, access.session.org.id, 20);

  return {
    ...access,
    runs,
  };
}

export function buildAgentTerminalSocketPath(agentId: string, sessionId = randomUUID()) {
  return `/api/agents/${agentId}/terminal/socket?sessionId=${encodeURIComponent(sessionId)}`;
}
