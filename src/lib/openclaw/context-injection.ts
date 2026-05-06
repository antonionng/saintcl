import {
  getAgents,
  getKnowledgeDocsForAgentScope,
  getUserProfileRecordById,
} from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { renderKnowledgeWorkspaceFile } from "@/lib/knowledge";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { renderAgentBootstrapFiles } from "@/lib/openclaw/templates";
import { createAdminClient } from "@/lib/supabase/admin";

import type { OpenClawClient } from "@/lib/openclaw/client";

/**
 * Tenant-wide context injection. The control plane is the source of truth for
 * every native OpenClaw surface a customer-facing agent depends on:
 *
 *   - Workspace bootstrap files (AGENTS, SOUL, USER, TOOLS, IDENTITY,
 *     HEARTBEAT) populated via `agents.files.set`.
 *   - Knowledge mirror files in `knowledge/{company,team,personal}/...`.
 *   - Per-agent memorySearch governance, with synchronous sync hooks kept
 *     off so they cannot stretch the chat-turn budget.
 *
 * Doing this at provisioning + tenant-wide refresh time means the first user
 * chat does not need any setup tool calls. The agent answers the user, the
 * platform handles housekeeping.
 */

const BOOTSTRAP_FILE_RETRY_DELAYS_MS = [500, 1_500, 3_000, 5_000, 8_000, 13_000] as const;

type OrgContext = {
  name?: string | null;
  website?: string | null;
  companySummary?: string | null;
  agentBrief?: string | null;
} | null;

type ProfileContext = {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
} | null;

type AgentRow = {
  id: string;
  org_id: string;
  user_id: string | null;
  openclaw_agent_id: string;
  name: string;
  model: string;
  config?: Record<string, unknown> | null;
  assignment?: { assignee_type?: string; assignee_ref?: string } | null;
};

export type InjectAgentContextOptions = {
  /**
   * Resolved org context. Optional: when omitted the helper looks it up via
   * the admin client. Pass it explicitly when iterating many agents to skip
   * redundant fetches.
   */
  org?: OrgContext;
  /** Explicit user profile override; falls back to assignment / agent.user_id. */
  profile?: ProfileContext;
  /** Whether to mirror knowledge docs into the agent's workspace. */
  syncKnowledge?: boolean;
  /** Whether to apply safe memory search governance for this agent. */
  applySafeMemoryConfig?: boolean;
  /** Inject HEARTBEAT.md (a no-op status file the agent should not rewrite). */
  writeHeartbeat?: boolean;
  /** Optional shared OpenClawClient when the caller already has a session. */
  client?: OpenClawClient;
  /** Pre-resolved persona, useful when a wrapper just persisted a new value. */
  persona?: string;
};

export type AgentInjectionPlan = {
  agentId: string;
  openclawAgentId: string;
  name: string;
  files: string[];
  knowledgeDocs: number;
  knowledgePaths: string[];
  memorySearch: "enabled-safe" | "skipped";
};

export type AgentInjectionResult =
  | { status: "ok"; plan: AgentInjectionPlan }
  | { status: "skipped"; reason: string; plan: AgentInjectionPlan }
  | {
      status: "failed";
      message: string;
      plan: Pick<AgentInjectionPlan, "agentId" | "openclawAgentId" | "name">;
    };

export type OrgInjectionResult = {
  orgId: string;
  totalAgents: number;
  okAgents: number;
  failedAgents: number;
  failures: Array<{ agentId: string; openclawAgentId: string; name: string; message: string }>;
  plans: AgentInjectionPlan[];
  skipped?: string;
};

const DEFAULT_OPTIONS: Required<
  Pick<InjectAgentContextOptions, "syncKnowledge" | "applySafeMemoryConfig" | "writeHeartbeat">
> = {
  syncKnowledge: true,
  applySafeMemoryConfig: true,
  writeHeartbeat: true,
};

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

function resolveBasePersona(agent: AgentRow): string {
  const stored = agent.config?.persona;
  if (typeof stored === "string" && stored.trim().length > 0) {
    return stripExistingProfileContext(stripExistingOrgContext(stored));
  }
  return `You are ${agent.name}. Follow the assigned human's direction inside organization guardrails and focus on practical outcomes.`;
}

function resolveAgentScope(agent: AgentRow) {
  const assignment = agent.assignment ?? null;
  if (assignment?.assignee_type === "team") {
    return { scope: "team" as const, assigneeRef: assignment.assignee_ref ?? null };
  }
  if (assignment?.assignee_type === "employee") {
    return {
      scope: "employee" as const,
      assigneeRef: assignment.assignee_ref ?? agent.user_id ?? null,
    };
  }
  return { scope: "org" as const, assigneeRef: agent.org_id };
}

function resolveKnowledgeDirectories(scope: "org" | "team" | "employee") {
  if (scope === "org") return ["knowledge/company"];
  if (scope === "team") return ["knowledge/company", "knowledge/team"];
  return ["knowledge/company", "knowledge/personal"];
}

function isTransientGatewayBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  // `unknown agent id` used to be retried as transient, but we now verify the
  // agent is visible in the gateway registry before any file write, so a
  // post-verification rejection points at a hard consistency problem rather
  // than a propagation lag. Surfacing it lets onboarding fail fast instead of
  // burning the BOOTSTRAP_FILE_RETRY budget on a doomed sequence of writes.
  return (
    message.includes("runtime gateway connection closed unexpectedly") ||
    message.includes("runtime gateway timeout") ||
    message.includes("socket hang up") ||
    message.includes("fetch failed") ||
    message.includes("unexpected server response: 502") ||
    message.includes("bad gateway")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setAgentBootstrapFileWithRetry(
  client: OpenClawClient,
  input: { agentId: string; name: string; content: string },
) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= BOOTSTRAP_FILE_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await client.setAgentFile(input);
      return;
    } catch (error) {
      lastError = error;
      const retryDelayMs = BOOTSTRAP_FILE_RETRY_DELAYS_MS[attempt];
      if (retryDelayMs === undefined || !isTransientGatewayBootstrapError(error)) {
        throw error;
      }
      await delay(retryDelayMs);
    }
  }

  throw lastError;
}

export function buildKnowledgeFilePath(
  scopeType: "org" | "team" | "user",
  docId: string,
  filename: string,
) {
  const folder =
    scopeType === "org"
      ? "knowledge/company"
      : scopeType === "team"
        ? "knowledge/team"
        : "knowledge/personal";
  // Strip any existing extension, sanitize the filename, then append a single
  // `.md`. Without stripping, an upload named `website-profile.md` produced
  // `website-profile.md.md`, which the OpenClaw gateway file allowlist rejects.
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const stem = sanitized.replace(/\.[^.]+$/, "") || "doc";
  return `${folder}/${docId}-${stem}.md`;
}

async function loadOrgContext(orgId: string): Promise<OrgContext> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("orgs")
    .select("name, website, company_summary, agent_brief")
    .eq("id", orgId)
    .maybeSingle();
  if (!data) return null;
  return {
    name: data.name,
    website: data.website,
    companySummary: data.company_summary,
    agentBrief: data.agent_brief,
  };
}

async function resolveProfileForAgent(agent: AgentRow): Promise<ProfileContext> {
  const { scope, assigneeRef } = resolveAgentScope(agent);
  const profileUserId =
    scope === "employee" && assigneeRef ? assigneeRef : agent.user_id ?? null;
  if (!profileUserId) return null;
  return getUserProfileRecordById(profileUserId);
}

async function getInjectionClient(orgId: string) {
  const { snapshot } = await getOrgModelCatalogState(orgId);
  const { client } = await getTenantOpenClawClient(orgId, {
    orgId,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });
  return client;
}

export async function injectAgentContext(
  agent: AgentRow,
  options: InjectAgentContextOptions = {},
): Promise<AgentInjectionResult> {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  if (!isOpenClawConfigured()) {
    return {
      status: "skipped",
      reason: "Runtime gateway is not configured.",
      plan: {
        agentId: agent.id,
        openclawAgentId: agent.openclaw_agent_id,
        name: agent.name,
        files: [],
        knowledgeDocs: 0,
        knowledgePaths: [],
        memorySearch: "skipped",
      },
    };
  }

  const client = options.client ?? (await getInjectionClient(agent.org_id));
  const persona = options.persona ?? resolveBasePersona(agent);
  const orgContext = options.org ?? (await loadOrgContext(agent.org_id));
  const profile = options.profile ?? (await resolveProfileForAgent(agent));

  const { scope } = resolveAgentScope(agent);
  const knowledgeDirs = resolveKnowledgeDirectories(scope);

  const files = renderAgentBootstrapFiles({
    agentId: agent.openclaw_agent_id,
    name: agent.name,
    model: agent.model,
    persona,
    org: orgContext,
    user: profile,
  });

  const writes: Array<{ name: string; content: string }> = [
    { name: "AGENTS.md", content: files.agents },
    { name: "SOUL.md", content: files.soul },
    { name: "USER.md", content: files.user },
    { name: "TOOLS.md", content: files.tools },
    { name: "IDENTITY.md", content: files.identity },
  ];
  if (merged.writeHeartbeat) {
    writes.push({ name: "HEARTBEAT.md", content: files.heartbeat });
  }

  const writtenFileNames: string[] = [];

  try {
    // Confirm the gateway has reloaded the patched cfg before we start writing
    // workspace files. `agents.files.set` validates against the live runtime
    // cfg, so without this gate the first writes can race a freshly-applied
    // `config.patch` and fail with `unknown agent id`. The vendored gateway
    // `agents.files.*` resolver is now consistent with `agents.list`, so once
    // the agent shows up here, the workspace writes that follow can succeed.
    const verification = await client.verifyAgentRegistered({
      agentId: agent.openclaw_agent_id,
    });
    if (!verification.ok) {
      return {
        status: "failed",
        message: `Gateway did not register agent "${agent.openclaw_agent_id}" in time: ${verification.reason}`,
        plan: {
          agentId: agent.id,
          openclawAgentId: agent.openclaw_agent_id,
          name: agent.name,
        },
      };
    }

    for (const file of writes) {
      await setAgentBootstrapFileWithRetry(client, {
        agentId: agent.openclaw_agent_id,
        name: file.name,
        content: file.content,
      });
      writtenFileNames.push(file.name);
    }

    let knowledgeDocsCount = 0;
    if (merged.syncKnowledge) {
      const docs = await getKnowledgeDocsForAgentScope({
        orgId: agent.org_id,
        scope,
        assigneeRef: resolveAgentScope(agent).assigneeRef,
        userId: agent.user_id ?? null,
      });
      knowledgeDocsCount = docs.length;
      for (const doc of docs) {
        const knowledgePath = buildKnowledgeFilePath(doc.scopeType, doc.id, doc.filename);
        try {
          await client.setAgentFile({
            agentId: agent.openclaw_agent_id,
            name: knowledgePath,
            content: renderKnowledgeWorkspaceFile({
              title: doc.filename,
              scopeLabel:
                doc.scopeType === "org"
                  ? "Company knowledge"
                  : doc.scopeType === "team"
                    ? "Team knowledge"
                    : "Personal knowledge",
              filename: doc.filename,
              contentText: doc.contentText ?? "",
            }),
          });
        } catch (knowledgeError) {
          // Knowledge mirroring is best-effort: a single bad path or transient
          // gateway error must not abort onboarding once bootstrap files are
          // in place. The agent can still chat; the doc will be retried on
          // the next refresh.
          console.warn(
            "[openclaw.injectAgentContext] knowledge sync failed",
            JSON.stringify({
              agentId: agent.openclaw_agent_id,
              path: knowledgePath,
              docId: doc.id,
              error: knowledgeError instanceof Error ? knowledgeError.message : String(knowledgeError),
            }),
          );
        }
      }
    }

    let memorySearchState: AgentInjectionPlan["memorySearch"] = "skipped";
    if (merged.applySafeMemoryConfig) {
      if (knowledgeDocsCount > 0) {
        await client.configureAgentSafeKnowledgeSearch({
          agentId: agent.openclaw_agent_id,
          extraPaths: knowledgeDirs,
        });
        memorySearchState = "enabled-safe";
      } else {
        await client
          .disableAgentKnowledgeSearch({ agentId: agent.openclaw_agent_id })
          .catch(() => null);
        memorySearchState = "skipped";
      }
    }

    return {
      status: "ok",
      plan: {
        agentId: agent.id,
        openclawAgentId: agent.openclaw_agent_id,
        name: agent.name,
        files: writtenFileNames,
        knowledgeDocs: knowledgeDocsCount,
        knowledgePaths: merged.applySafeMemoryConfig ? knowledgeDirs : [],
        memorySearch: memorySearchState,
      },
    };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
      plan: {
        agentId: agent.id,
        openclawAgentId: agent.openclaw_agent_id,
        name: agent.name,
      },
    };
  }
}

export type InjectOrgContextOptions = {
  agentOptions?: Omit<InjectAgentContextOptions, "client" | "org" | "profile">;
  /** Shared OrgContext override; otherwise the helper loads it from `orgs`. */
  org?: OrgContext;
  /** Skip injection, only return the plan that would have run. */
  dryRun?: boolean;
};

export async function injectOrgContext(
  input: { orgId: string },
  options: InjectOrgContextOptions = {},
): Promise<OrgInjectionResult> {
  const orgId = input.orgId;

  if (!isOpenClawConfigured()) {
    return {
      orgId,
      totalAgents: 0,
      okAgents: 0,
      failedAgents: 0,
      failures: [],
      plans: [],
      skipped: "Runtime gateway is not configured.",
    };
  }

  const agents = (await getAgents(orgId)) as AgentRow[];
  if (agents.length === 0) {
    return {
      orgId,
      totalAgents: 0,
      okAgents: 0,
      failedAgents: 0,
      failures: [],
      plans: [],
      skipped: "No agents in this workspace.",
    };
  }

  const orgContext = options.org ?? (await loadOrgContext(orgId));

  if (options.dryRun) {
    return {
      orgId,
      totalAgents: agents.length,
      okAgents: agents.length,
      failedAgents: 0,
      failures: [],
      plans: agents.map((agent) => {
        const { scope } = resolveAgentScope(agent);
        return {
          agentId: agent.id,
          openclawAgentId: agent.openclaw_agent_id,
          name: agent.name,
          files: ["AGENTS.md", "SOUL.md", "USER.md", "TOOLS.md", "IDENTITY.md", "HEARTBEAT.md"],
          knowledgeDocs: -1,
          knowledgePaths: resolveKnowledgeDirectories(scope),
          memorySearch: "enabled-safe",
        };
      }),
    };
  }

  const client = await getInjectionClient(orgId);
  const failures: OrgInjectionResult["failures"] = [];
  const plans: AgentInjectionPlan[] = [];
  let okCount = 0;

  for (const agent of agents) {
    const result = await injectAgentContext(agent, {
      ...(options.agentOptions ?? {}),
      org: orgContext,
      client,
    });
    if (result.status === "ok") {
      okCount += 1;
      plans.push(result.plan);
    } else if (result.status === "skipped") {
      plans.push(result.plan);
    } else {
      failures.push({
        agentId: result.plan.agentId,
        openclawAgentId: result.plan.openclawAgentId,
        name: result.plan.name,
        message: result.message,
      });
    }
  }

  return {
    orgId,
    totalAgents: agents.length,
    okAgents: okCount,
    failedAgents: failures.length,
    failures,
    plans,
  };
}
