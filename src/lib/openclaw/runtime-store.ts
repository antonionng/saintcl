import { createAdminClient } from "@/lib/supabase/admin";
import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

export async function upsertRuntimeMetadata(runtime: OpenClawRuntimeDescriptor) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const payload = {
    org_id: runtime.orgId,
    state_root: runtime.paths.stateRoot,
    config_path: runtime.paths.configPath,
    workspace_root: runtime.paths.workspaceRoot,
    gateway_port: runtime.gatewayPort,
    gateway_token: runtime.gatewayToken,
    status: runtime.status,
    pid: runtime.pid,
    last_heartbeat_at: runtime.lastHeartbeatAt,
  };

  const existing = await admin
    .from("openclaw_runtimes")
    .select("id")
    .eq("org_id", runtime.orgId)
    .maybeSingle();

  if (existing.data?.id) {
    const updated = await admin
      .from("openclaw_runtimes")
      .update(payload)
      .eq("id", existing.data.id)
      .select()
      .single();

    return updated.data ?? null;
  }

  const inserted = await admin.from("openclaw_runtimes").insert(payload).select().single();
  return inserted.data ?? null;
}

export async function insertAgentMetadata(input: {
  orgId: string;
  userId?: string;
  runtimeDbId?: string;
  name: string;
  slug: string;
  model: string;
  persona?: string;
  workspacePath: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const inserted = await admin
    .from("agents")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      openclaw_runtime_id: input.runtimeDbId,
      name: input.name,
      openclaw_agent_id: input.slug,
      model: input.model,
      status: "provisioning",
      config: {
        persona: input.persona ?? "",
        workspace: input.workspacePath,
        ...(input.metadata ?? {}),
      },
    })
    .select()
    .single();

  return inserted.data ?? null;
}

export async function insertChannelMetadata(input: {
  orgId: string;
  agentId: string;
  type: string;
  credentials: Record<string, unknown>;
  status: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const inserted = await admin
    .from("channels")
    .insert({
      org_id: input.orgId,
      agent_id: input.agentId,
      type: input.type,
      credentials: input.credentials,
      status: input.status,
    })
    .select()
    .single();

  return inserted.data ?? null;
}

export async function upsertAgentAssignment(input: {
  orgId: string;
  agentId: string;
  assigneeType: "employee" | "team" | "org";
  assigneeRef: string;
  createdBy?: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("agent_assignments")
    .upsert({
      org_id: input.orgId,
      agent_id: input.agentId,
      assignee_type: input.assigneeType,
      assignee_ref: input.assigneeRef,
      created_by: input.createdBy,
    }, { onConflict: "agent_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listRepoAllowlistPatterns(orgId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("repo_allowlists")
    .select("pattern")
    .eq("org_id", orgId);

  return (data ?? []).map((entry) => entry.pattern);
}

export async function insertTerminalApproval(input: {
  orgId: string;
  agentId?: string;
  requestedBy?: string;
  command: string;
  repo?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const inserted = await admin
    .from("terminal_approvals")
    .insert({
      org_id: input.orgId,
      agent_id: input.agentId,
      requested_by: input.requestedBy,
      command: input.command,
      repo: input.repo,
      status: input.status,
      approved_by: input.approvedBy,
      approved_at: input.approvedAt,
    })
    .select()
    .single();

  return inserted.data ?? null;
}

export async function insertTerminalRun(input: {
  orgId: string;
  agentId?: string;
  approvalId?: string;
  command: string;
  exitCode: number;
  stdoutExcerpt: string;
  stderrExcerpt: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const inserted = await admin
    .from("terminal_runs")
    .insert({
      org_id: input.orgId,
      agent_id: input.agentId,
      approval_id: input.approvalId,
      command: input.command,
      exit_code: input.exitCode,
      stdout_excerpt: input.stdoutExcerpt,
      stderr_excerpt: input.stderrExcerpt,
    })
    .select()
    .single();

  return inserted.data ?? null;
}
