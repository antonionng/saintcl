import { cache } from "react";

import type { CurrentOrgSession, OrgRole } from "@/types";
import { canSessionAccessAssignment, getRoleCapabilities } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureOrgFoundation(admin: NonNullable<ReturnType<typeof createAdminClient>>, orgId: string) {
  await Promise.all([
    admin.from("org_wallets").upsert({ org_id: orgId }),
    admin.from("org_policies").upsert({ org_id: orgId }),
  ]);
}

export const getCurrentOrg = cache(async (): Promise<CurrentOrgSession | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const { data: membership } = await admin
    .from("org_members")
    .select("org_id, role, orgs(id, name, slug, plan, created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership?.orgs) {
    const org = (Array.isArray(membership.orgs) ? membership.orgs[0] : membership.orgs) as CurrentOrgSession["org"];
    await ensureOrgFoundation(admin, org.id);
    const role = (membership.role as OrgRole) ?? "member";
    return {
      org,
      role,
      userId: user.id,
      email: user.email ?? null,
      capabilities: getRoleCapabilities(role),
    };
  }

  const orgName = (user.user_metadata?.org_name as string) || "My Organization";
  const slug = `${slugify(orgName)}-${user.id.slice(0, 8)}`;

  const { data: org } = await admin
    .from("orgs")
    .insert({ name: orgName, slug })
    .select()
    .single();

  if (!org) return null;

  await admin.from("org_members").insert({ org_id: org.id, user_id: user.id, role: "owner" });
  await ensureOrgFoundation(admin, org.id);

  return {
    org: org as CurrentOrgSession["org"],
    role: "owner",
    userId: user.id,
    email: user.email ?? null,
    capabilities: getRoleCapabilities("owner"),
  };
});

export async function getOrgWallet(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  await ensureOrgFoundation(admin, orgId);
  const { data } = await admin.from("org_wallets").select("*").eq("org_id", orgId).maybeSingle();
  return data;
}

export async function getWalletLedger(orgId: string, limit = 50) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("wallet_ledger")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUsageEvents(orgId: string, limit = 100) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("usage_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUsageSummary(orgId: string) {
  const events = await getUsageEvents(orgId, 500);
  const totalSpendCents = events.reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  const last7dSpendCents = events
    .filter((event) => new Date(event.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  return {
    totalSpendCents,
    last7dSpendCents,
    eventCount: events.length,
  };
}

export async function getOrgPolicy(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  await ensureOrgFoundation(admin, orgId);
  const { data } = await admin.from("org_policies").select("*").eq("org_id", orgId).maybeSingle();
  return data;
}

export async function getAgentAssignments(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("agent_assignments")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAgentAssignment(agentId: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("agent_assignments")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .maybeSingle();
  return data;
}

export async function getAgents(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const [agentsResult, assignments] = await Promise.all([
    admin.from("agents").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    getAgentAssignments(orgId),
  ]);

  const assignmentMap = new Map(assignments.map((assignment) => [assignment.agent_id, assignment]));
  return (agentsResult.data ?? []).map((agent) => ({
    ...agent,
    assignment: assignmentMap.get(agent.id) ?? null,
  }));
}

export async function getVisibleAgentsForSession(session: CurrentOrgSession) {
  const agents = await getAgents(session.org.id);
  return agents.filter((agent) => canSessionAccessAssignment(session, agent.assignment));
}

export async function getAgent(id: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const [agentResult, assignment] = await Promise.all([
    admin.from("agents").select("*").eq("id", id).eq("org_id", orgId).maybeSingle(),
    getAgentAssignment(id, orgId),
  ]);

  if (!agentResult.data) return null;
  return {
    ...agentResult.data,
    assignment,
  };
}

export async function getVisibleAgentForSession(id: string, session: CurrentOrgSession) {
  const agent = await getAgent(id, session.org.id);
  if (!agent) return null;
  if (!canSessionAccessAssignment(session, agent.assignment)) return null;
  return agent;
}

export async function getChannels(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("channels")
    .select("*, agents(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getKnowledgeDocs(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("knowledge_docs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getRuntimes(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("openclaw_runtimes")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAgentLogs(orgId: string, agentId?: string, limit = 20) {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("agent_logs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getRepoAllowlists(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("repo_allowlists")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getTerminalApprovals(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("terminal_approvals")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getTerminalRuns(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("terminal_runs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getDashboardStats(orgId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return { agents: 0, channels: 0, docs: 0, runtimes: 0, balanceCents: 0, spendCents: 0 };
  }

  const [agents, channels, docs, runtimes, wallet, usage] = await Promise.all([
    admin.from("agents").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("channels").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("knowledge_docs").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("openclaw_runtimes").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    getOrgWallet(orgId),
    getUsageSummary(orgId),
  ]);

  return {
    agents: agents.count ?? 0,
    channels: channels.count ?? 0,
    docs: docs.count ?? 0,
    runtimes: runtimes.count ?? 0,
    balanceCents: wallet?.balance_cents ?? 0,
    spendCents: usage.totalSpendCents,
  };
}
