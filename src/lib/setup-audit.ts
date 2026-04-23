import { createAdminClient } from "@/lib/supabase/admin";

export type SetupAuditCategory =
  | "channel"
  | "skill"
  | "enrichment"
  | "agent"
  | "policy"
  | "app";

export type SetupAuditEventType =
  | "channel.connected"
  | "channel.disconnected"
  | "channel.health_check"
  | "skill.installed"
  | "skill.updated"
  | "skill.removed"
  | "skill.policy_blocked"
  | "enrichment.triggered"
  | "enrichment.completed"
  | "enrichment.failed"
  | "agent.provisioned"
  | "agent.deleted"
  | "policy.skill_policy_updated"
  | "app.requested"
  | "app.installed";

export async function recordSetupAuditEvent(input: {
  orgId: string;
  agentId?: string | null;
  userId?: string | null;
  eventType: SetupAuditEventType;
  category: SetupAuditCategory;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  try {
    await admin
      .from("setup_audit_events")
      .insert({
        org_id: input.orgId,
        agent_id: input.agentId ?? null,
        user_id: input.userId ?? null,
        event_type: input.eventType,
        category: input.category,
        metadata: input.metadata ?? {},
      });
  } catch {
    // best-effort audit log; ignore failures
  }
}

export type FunnelStep =
  | "org_created"
  | "agent_provisioned"
  | "channel_connected"
  | "first_message_received"
  | "skill_installed"
  | "knowledge_uploaded"
  | "enrichment_completed";

export async function recordFunnelStep(input: {
  orgId: string;
  funnelName?: string;
  step: FunnelStep;
  completed?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  try {
    await admin
      .from("setup_funnel_events")
      .insert({
        org_id: input.orgId,
        funnel_name: input.funnelName ?? "agent_setup",
        funnel_step: input.step,
        completed: input.completed ?? true,
        metadata: input.metadata ?? {},
      });
  } catch {
    // best-effort funnel log; ignore failures
  }
}

export async function getSetupAuditEvents(orgId: string, limit = 50) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("setup_audit_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getSetupFunnelMetrics(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return { steps: [], completionRate: 0 };

  const { data } = await admin
    .from("setup_funnel_events")
    .select("funnel_step, completed")
    .eq("org_id", orgId)
    .eq("funnel_name", "agent_setup");

  const steps = data ?? [];
  const uniqueSteps = new Set(steps.filter((s) => s.completed).map((s) => s.funnel_step));
  const totalPossibleSteps = 7;
  const completionRate = Math.round((uniqueSteps.size / totalPossibleSteps) * 100);

  return {
    steps: [...uniqueSteps],
    completionRate,
  };
}
