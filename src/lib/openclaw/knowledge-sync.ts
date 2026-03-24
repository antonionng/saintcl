import { getAgents, getKnowledgeDocsForAgentScope } from "@/lib/dal";
import { renderKnowledgeWorkspaceFile } from "@/lib/knowledge";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";

function resolveKnowledgeDirectories(scope: "org" | "team" | "employee") {
  if (scope === "org") {
    return ["knowledge/company"];
  }

  if (scope === "team") {
    return ["knowledge/company", "knowledge/team"];
  }

  return ["knowledge/company", "knowledge/personal"];
}

function resolveAgentScope(agent: {
  org_id: string;
  user_id?: string | null;
  openclaw_agent_id: string;
  name: string;
  model: string;
  config?: unknown;
  assignment?: { assignee_type?: string; assignee_ref?: string } | null;
}) {
  const assignment = agent.assignment;
  if (assignment?.assignee_type === "team") {
    return { scope: "team" as const, assigneeRef: assignment.assignee_ref ?? null };
  }

  if (assignment?.assignee_type === "employee") {
    return { scope: "employee" as const, assigneeRef: assignment.assignee_ref ?? agent.user_id ?? null };
  }

  return { scope: "org" as const, assigneeRef: agent.org_id };
}

function buildKnowledgeFilePath(scopeType: "org" | "team" | "user", docId: string, filename: string) {
  const folder =
    scopeType === "org" ? "knowledge/company" : scopeType === "team" ? "knowledge/team" : "knowledge/personal";
  return `${folder}/${docId}-${filename.replace(/[^a-zA-Z0-9._-]+/g, "-")}.md`;
}

export async function syncKnowledgeToAgent(agent: {
  org_id: string;
  user_id?: string | null;
  openclaw_agent_id: string;
  name: string;
  model: string;
  config?: unknown;
  assignment?: { assignee_type?: string; assignee_ref?: string } | null;
}) {
  const { scope, assigneeRef } = resolveAgentScope(agent);
  const docs = await getKnowledgeDocsForAgentScope({
    orgId: agent.org_id,
    scope,
    assigneeRef,
    userId: agent.user_id ?? null,
  });
  const { snapshot } = await getOrgModelCatalogState(agent.org_id);
  const { client } = await getTenantOpenClawClient(agent.org_id, {
    orgId: agent.org_id,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });

  await Promise.all(
    docs.map((doc) =>
      client.setAgentFile({
        agentId: agent.openclaw_agent_id,
        name: buildKnowledgeFilePath(doc.scopeType, doc.id, doc.filename),
        content: renderKnowledgeWorkspaceFile({
          title: doc.filename,
          scopeLabel: doc.scopeType === "org" ? "Company knowledge" : doc.scopeType === "team" ? "Team knowledge" : "Personal knowledge",
          filename: doc.filename,
          contentText: doc.contentText ?? "",
        }),
      }),
    ),
  );

  await client.configureAgentKnowledgeSearch({
    agentId: agent.openclaw_agent_id,
    extraPaths: resolveKnowledgeDirectories(scope),
  });
}

export async function syncKnowledgeToRelevantAgents(input: {
  orgId: string;
  scopeType: "org" | "team" | "user";
  teamId?: string | null;
  userId?: string | null;
}) {
  const agents = await getAgents(input.orgId);
  const relevantAgents = agents.filter((agent) => {
    const assignment = agent.assignment as { assignee_type?: string; assignee_ref?: string } | null | undefined;

    if (input.scopeType === "org") {
      return true;
    }

    if (input.scopeType === "team") {
      return assignment?.assignee_type === "team" && assignment.assignee_ref === input.teamId;
    }

    return (
      agent.user_id === input.userId ||
      (assignment?.assignee_type === "employee" && assignment.assignee_ref === input.userId)
    );
  });

  await Promise.all(relevantAgents.map((agent) => syncKnowledgeToAgent(agent)));
}
