import { createAdminClient } from "@/lib/supabase/admin";

export type AgentAppRow = {
  id: string;
  org_id: string;
  agent_id: string | null;
  app_id: string;
  installer: string;
  status: string;
  config: Record<string, unknown>;
  installed_at: string;
};

export async function listOrgApps(orgId: string): Promise<AgentAppRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("agent_apps")
    .select("*")
    .eq("org_id", orgId)
    .order("installed_at", { ascending: false });

  return (data ?? []) as AgentAppRow[];
}

export async function listAgentApps(orgId: string, agentId: string): Promise<AgentAppRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("agent_apps")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .order("installed_at", { ascending: false });

  return (data ?? []) as AgentAppRow[];
}

export async function recordAppInstall(params: {
  orgId: string;
  agentId?: string | null;
  appId: string;
  installer: string;
  status?: string;
  config?: Record<string, unknown>;
  installedBy?: string | null;
}): Promise<{ row: AgentAppRow | null; error: string | null }> {
  const admin = createAdminClient();
  if (!admin) {
    return { row: null, error: "Supabase admin client unavailable." };
  }

  const { data, error } = await admin
    .from("agent_apps")
    .upsert(
      {
        org_id: params.orgId,
        agent_id: params.agentId ?? null,
        app_id: params.appId,
        installer: params.installer,
        status: params.status ?? "installed",
        config: params.config ?? {},
        installed_by: params.installedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,agent_id,app_id" },
    )
    .select("*")
    .single();

  if (error) {
    const isMissingAppStoreTable =
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      /does not exist/i.test(error.message) ||
      /schema cache/i.test(error.message);
    const friendly =
      isMissingAppStoreTable
        ? "App store database not initialised. Run `supabase db push` (or apply migration 00019_agent_apps.sql)."
        : error.message;
    return { row: null, error: friendly };
  }

  return { row: (data ?? null) as AgentAppRow | null, error: null };
}

export async function recordAppRequest(params: {
  orgId: string;
  appId: string;
  requestedBy?: string | null;
  note?: string;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("app_install_requests").insert({
    org_id: params.orgId,
    app_id: params.appId,
    requested_by: params.requestedBy ?? null,
    note: params.note ?? null,
  });
}
