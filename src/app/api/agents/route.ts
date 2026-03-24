import { NextResponse } from "next/server";
import { z } from "zod";

import { isOpenClawConfigured } from "@/lib/env";
import {
  getAgentCount,
  getCurrentOrg,
  getOrgMembers,
  getTeam,
  getVisibleAgentsForSession,
  loadCurrentUserProfile,
} from "@/lib/dal";
import { normalizeAgentTerminalRepoPaths } from "@/lib/openclaw/agent-terminal";
import { syncKnowledgeToAgent } from "@/lib/openclaw/knowledge-sync";
import { getAgentWorkspacePath } from "@/lib/openclaw/paths";
import {
  insertAgentMetadata,
  replaceAgentTerminalRepoAllowlists,
  upsertAgentAssignment,
} from "@/lib/openclaw/runtime-store";
import { appendOrgContextToPersona, appendProfileContextToPersona, writeAgentBootstrapFiles } from "@/lib/openclaw/profile-context";
import { resolveModelSelection } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { canProvisionAnotherAgent, getAgentProvisionLimitMessage, getResolvedTrialStatus } from "@/lib/plans";

const createAgentSchema = z.object({
  name: z.string().min(2).optional(),
  model: z.string().min(3).optional(),
  persona: z.string().min(3).optional(),
  scope: z.enum(["employee", "team", "org"]).default("employee"),
  assignee: z.string().optional(),
  terminalEnabled: z.boolean().optional(),
  terminalRepoPaths: z.array(z.string().trim().min(1).max(255)).max(24).optional(),
});

function buildAgentName(payload: z.infer<typeof createAgentSchema>) {
  if (payload.name?.trim()) return payload.name.trim();
  if (payload.assignee?.trim()) {
    const source = payload.assignee.includes("@")
      ? payload.assignee.split("@")[0]
      : payload.assignee;
    const normalized = source
      .trim()
      .replace(/[-_.]+/g, " ")
      .replace(/\s+/g, " ");
    if (normalized.length > 0) {
      const titled = normalized
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      return `${titled} Agent`;
    }
  }
  if (payload.scope === "team") return "Team Agent";
  if (payload.scope === "org") return "Organization Agent";
  return "Employee Agent";
}

function appendKnowledgeScopeInstruction(
  persona: string,
  input: { scope: "employee" | "team" | "org"; assigneeLabel?: string | null },
) {
  const scopeInstruction =
    input.scope === "org"
      ? "You can rely on company knowledge files when relevant."
      : input.scope === "team"
        ? `You can rely on company knowledge plus team knowledge for ${input.assigneeLabel ?? "this team"} when relevant.`
        : `You can rely on company knowledge plus personal knowledge for ${input.assigneeLabel ?? "the assigned employee"} when relevant.`;

  return `${persona}\n\nKnowledge scope:\n- ${scopeInstruction}\n- Use memory search before guessing when a document-backed answer may exist.`;
}

function getProvisionErrorStatus(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("not authenticated")) return 401;
  if (normalized.includes("not approved")) return 403;
  if (normalized.includes("disabled by organization policy")) return 403;
  if (normalized.includes("requires additional approval")) return 403;
  if (normalized.includes("upgrade your plan")) return 403;
  if (normalized.includes("insufficient wallet balance")) return 402;
  if (normalized.includes("wallet is unavailable")) return 503;
  if (normalized.includes("already exists")) return 409;
  if (normalized.includes("duplicate")) return 409;
  if (normalized.includes("violates unique constraint")) return 409;
  if (normalized.includes("invalid")) return 400;

  return 500;
}

async function resolveEmployeeAssignment(
  session: NonNullable<Awaited<ReturnType<typeof getCurrentOrg>>>,
  rawAssignee?: string,
) {
  const assignee = rawAssignee?.trim() ?? "";
  const members = await getOrgMembers(session.org.id);
  const fallbackMember = members.find((member) => member.userId === session.userId);
  const fallbackLabel = fallbackMember?.displayName ?? fallbackMember?.email ?? session.email ?? "Me";
  const normalizedAssignee = assignee.toLowerCase();

  if (!assignee) {
    return {
      assigneeRef: session.userId,
      assigneeLabel: fallbackLabel,
    };
  }

  const matchedMember = members.find((member) =>
    [member.userId, member.email, member.displayName]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .some((value) => value.trim().toLowerCase() === normalizedAssignee),
  );

  if (matchedMember) {
    return {
      assigneeRef: matchedMember.userId,
      assigneeLabel: matchedMember.displayName ?? matchedMember.email ?? matchedMember.userId,
    };
  }

  if (["me", "myself", "self"].includes(normalizedAssignee)) {
    return {
      assigneeRef: session.userId,
      assigneeLabel: fallbackLabel,
    };
  }

  return {
    assigneeRef: assignee,
    assigneeLabel: assignee,
  };
}

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (orgId && orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }

  const agents = await getVisibleAgentsForSession(session);
  return NextResponse.json({ data: agents });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json(
      { error: { message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const orgId = session.org.id;
  const userId = session.userId;

  if (!session.capabilities.canManageAgents) {
    return NextResponse.json(
      { error: { message: "Agent management requires admin access." } },
      { status: 403 },
    );
  }

  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured for this environment." } },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof createAgentSchema>;
  try {
    payload = createAgentSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues[0]?.message : "Invalid input";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  try {
    if (payload.scope === "team" && !payload.assignee?.trim()) {
      return NextResponse.json(
        { error: { message: "Team is required." } },
        { status: 400 },
      );
    }

    if (payload.scope === "employee" && !payload.assignee?.trim()) {
      payload = {
        ...payload,
        assignee: session.email ?? session.userId,
      };
    }

    const employeeAssignment =
      payload.scope === "employee" ? await resolveEmployeeAssignment(session, payload.assignee) : null;
    const teamAssignment = payload.scope === "team" && payload.assignee ? await getTeam(payload.assignee, orgId) : null;

    if (payload.scope === "team" && !teamAssignment) {
      return NextResponse.json({ error: { message: "Team not found." } }, { status: 404 });
    }

    const name = buildAgentName({
      ...payload,
      assignee: employeeAssignment?.assigneeLabel ?? teamAssignment?.name ?? payload.assignee,
    });
    const profile = await loadCurrentUserProfile();
    const personaWithKnowledge = appendKnowledgeScopeInstruction(
      payload.persona ??
        `You are ${name}. Follow the assigned human's direction inside organization guardrails and focus on practical outcomes.`,
      {
        scope: payload.scope,
        assigneeLabel: employeeAssignment?.assigneeLabel ?? teamAssignment?.name ?? payload.assignee,
      },
    );
    const persona = appendProfileContextToPersona(
      appendOrgContextToPersona(personaWithKnowledge, {
        name: session.org.name,
        website: session.org.website,
        companySummary: session.org.company_summary,
        agentBrief: session.org.agent_brief,
      }),
      profile,
    );
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const currentAgentCount = await getAgentCount(orgId);

    const trialStatus = getResolvedTrialStatus(session.org.trial_status, session.org.trial_ends_at);

    if (!canProvisionAnotherAgent(session.org.plan, currentAgentCount, { trialStatus, isSuperAdmin: session.isSuperAdmin })) {
      return NextResponse.json(
        { error: { message: getAgentProvisionLimitMessage(session.org.plan, { trialStatus }) } },
        { status: 403 },
      );
    }

    const { model, snapshot } = await resolveModelSelection({
      orgId,
      userId,
      isSuperAdmin: session.isSuperAdmin,
      requestedModel: payload.model,
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
    const terminalRepoPaths = normalizeAgentTerminalRepoPaths(payload.terminalRepoPaths ?? []);
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
      name,
      model,
      persona,
    });

    const agentRow = await insertAgentMetadata({
      orgId,
      userId,
      name,
      slug,
      model,
      persona,
      workspacePath,
      metadata: {
        scope: payload.scope,
        assignee: employeeAssignment?.assigneeLabel ?? payload.assignee ?? null,
        terminal: {
          enabled: payload.terminalEnabled === true,
        },
      },
    });

    if (agentRow?.id) {
      await Promise.all([
        upsertAgentAssignment({
          orgId,
          agentId: agentRow.id,
          assigneeType: payload.scope,
          assigneeRef:
            payload.scope === "org"
              ? orgId
              : payload.scope === "employee"
                ? employeeAssignment?.assigneeRef ?? session.userId
                : teamAssignment?.id ?? orgId,
          createdBy: userId,
        }),
        replaceAgentTerminalRepoAllowlists({
          orgId,
          agentId: agentRow.id,
          repoPaths: terminalRepoPaths,
          createdBy: userId,
        }),
      ]);
    }

    if (agentRow) {
      await syncKnowledgeToAgent({
        ...agentRow,
        assignment: {
          assignee_type: payload.scope,
          assignee_ref:
            payload.scope === "org"
              ? orgId
              : payload.scope === "employee"
                ? employeeAssignment?.assigneeRef ?? session.userId
                : teamAssignment?.id ?? orgId,
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      data: {
        id: agentRow?.id ?? slug,
        name,
        model,
        openclawAgentId: slug,
        scope: payload.scope,
        assignee: employeeAssignment?.assigneeLabel ?? payload.assignee,
        status: "provisioning",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    console.error("Agent provisioning failed", {
      orgId,
      userId,
      scope: payload.scope,
      assignee: payload.assignee ?? null,
      message,
      error: err,
    });
    return NextResponse.json({ error: { message } }, { status: getProvisionErrorStatus(message) });
  }
}
