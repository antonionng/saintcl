import { renderOrgContextForAgent } from "@/lib/org-profile";
import { renderProfileContextForAgent } from "@/lib/account-profile";
import { getAgents, getUserProfileRecordById } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { renderAgentBootstrapFiles } from "@/lib/openclaw/templates";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileContextInput = {
  displayName?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
} | null;

type OrgContextInput = {
  name?: string | null;
  website?: string | null;
  companySummary?: string | null;
  agentBrief?: string | null;
} | null;

function stripExistingOrgContext(persona: string) {
  return persona
    .replace(
      /\n\nCompany profile:\n[\s\S]*?\n\nUse this as lightweight company context\. Do not treat it as a replacement for policy, live data, or uploaded knowledge files\.(?=\n\nOwner profile:|$)/,
      "",
    )
    .trim();
}

function stripExistingProfileContext(persona: string) {
  const marker = "\n\nOwner profile:\n";
  const markerIndex = persona.indexOf(marker);
  if (markerIndex >= 0) {
    return persona.slice(0, markerIndex).trim();
  }

  return persona.trim();
}

export function appendProfileContextToPersona(basePersona: string, profile: ProfileContextInput) {
  const normalizedPersona = stripExistingProfileContext(basePersona);
  const context = renderProfileContextForAgent({
    displayName: profile?.displayName,
    whatIDo: profile?.whatIDo,
    agentBrief: profile?.agentBrief,
  });

  if (!context) {
    return normalizedPersona;
  }

  return `${normalizedPersona}\n\n${context}`;
}

export function appendOrgContextToPersona(basePersona: string, org: OrgContextInput) {
  const normalizedPersona = stripExistingOrgContext(basePersona);
  const context = renderOrgContextForAgent({
    name: org?.name,
    website: org?.website,
    companySummary: org?.companySummary,
    agentBrief: org?.agentBrief,
  });

  if (!context) {
    return normalizedPersona;
  }

  return `${normalizedPersona}\n\n${context}`;
}

function stripAllInjectedContexts(persona: string) {
  return stripExistingProfileContext(stripExistingOrgContext(persona));
}

function getStoredBasePersona(agent: {
  name: string;
  config?: Record<string, unknown> | null;
}) {
  const storedPersona =
    typeof agent.config?.persona === "string"
      ? String(agent.config.persona)
      : `You are ${agent.name}. Follow the assigned human's direction inside organization guardrails and focus on practical outcomes.`;
  return stripAllInjectedContexts(storedPersona);
}

function composeAgentPersona(input: {
  agent: {
    name: string;
    config?: Record<string, unknown> | null;
  };
  org?: OrgContextInput;
  profile?: ProfileContextInput;
}) {
  const basePersona = getStoredBasePersona(input.agent);
  return appendProfileContextToPersona(appendOrgContextToPersona(basePersona, input.org ?? null), input.profile ?? null);
}

async function persistAgentPersona(input: {
  orgId: string;
  agentId: string;
  persona: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const existing = await admin.from("agents").select("config").eq("id", input.agentId).eq("org_id", input.orgId).maybeSingle();
  const currentConfig =
    existing.data?.config && typeof existing.data.config === "object" && !Array.isArray(existing.data.config)
      ? (existing.data.config as Record<string, unknown>)
      : {};

  await admin
    .from("agents")
    .update({
      config: {
        ...currentConfig,
        persona: input.persona,
      },
    })
    .eq("id", input.agentId)
    .eq("org_id", input.orgId);
}

export async function writeAgentBootstrapFiles(input: {
  orgId: string;
  agentId: string;
  name: string;
  model: string;
  persona: string;
}) {
  if (!isOpenClawConfigured()) {
    return;
  }

  const { snapshot } = await getOrgModelCatalogState(input.orgId);
  const { client } = await getTenantOpenClawClient(input.orgId, {
    orgId: input.orgId,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });
  const files = renderAgentBootstrapFiles({
    agentId: input.agentId,
    name: input.name,
    model: input.model,
    persona: input.persona,
  });

  await Promise.all([
    client.setAgentFile({
      agentId: input.agentId,
      name: "AGENTS.md",
      content: files.agents,
    }),
    client.setAgentFile({
      agentId: input.agentId,
      name: "TOOLS.md",
      content: files.tools,
    }),
  ]);
}

export async function syncProfileContextToAssignedAgents(input: {
  orgId: string;
  userId: string;
  profile: ProfileContextInput;
  org?: OrgContextInput;
}) {
  if (!isOpenClawConfigured()) {
    return;
  }

  const agents = await getAgents(input.orgId);
  const assignedAgents = agents.filter((agent) => {
    const assignment = agent.assignment as { assignee_type?: string; assignee_ref?: string } | null | undefined;
    return (
      agent.user_id === input.userId ||
      (assignment?.assignee_type === "employee" && assignment.assignee_ref === input.userId)
    );
  });

  await Promise.all(
    assignedAgents.map((agent) =>
      (async () => {
        const persona = composeAgentPersona({
          agent: {
            name: agent.name,
            config: (agent.config as Record<string, unknown> | null) ?? null,
          },
          org: input.org ?? null,
          profile: input.profile,
        });
        await Promise.all([
          writeAgentBootstrapFiles({
            orgId: input.orgId,
            agentId: agent.openclaw_agent_id,
            name: agent.name,
            model: agent.model,
            persona,
          }),
          persistAgentPersona({
            orgId: input.orgId,
            agentId: agent.id,
            persona,
          }),
        ]);
      })(),
    ),
  );
}

export async function syncOrgContextToAgents(input: {
  orgId: string;
  org: OrgContextInput;
}) {
  if (!isOpenClawConfigured()) {
    return;
  }

  const agents = await getAgents(input.orgId);

  await Promise.all(
    agents.map(async (agent) => {
      const assignment = agent.assignment as { assignee_type?: string; assignee_ref?: string } | null | undefined;
      const profileUserId =
        assignment?.assignee_type === "employee" && assignment.assignee_ref
          ? assignment.assignee_ref
          : typeof agent.user_id === "string"
            ? agent.user_id
            : null;
      const profile = profileUserId ? await getUserProfileRecordById(profileUserId) : null;
      const persona = composeAgentPersona({
        agent: {
          name: agent.name,
          config: (agent.config as Record<string, unknown> | null) ?? null,
        },
        org: input.org,
        profile,
      });

      await Promise.all([
        writeAgentBootstrapFiles({
          orgId: input.orgId,
          agentId: agent.openclaw_agent_id,
          name: agent.name,
          model: agent.model,
          persona,
        }),
        persistAgentPersona({
          orgId: input.orgId,
          agentId: agent.id,
          persona,
        }),
      ]);
    }),
  );
}
