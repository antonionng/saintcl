import { createAdminClient } from "@/lib/supabase/admin";
import {
  getConfiguredGatewayShard,
  listConfiguredGatewayShards,
  type GatewayShard,
} from "@/lib/openclaw/gateway-shards";

export type TenantGatewayAssignment = {
  orgId: string;
  shardId?: string;
  wsUrl?: string;
  token?: string;
  status: "active" | "draining" | "disabled";
  dedicated: boolean;
  assignmentReason?: string;
};

function isMissingGatewayAssignmentsSchemaError(
  error: { code?: string | null; message?: string | null } | null | undefined,
) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST205" ||
    (message.includes("openclaw_gateway_assignments") &&
      (message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("could not find the table") ||
        message.includes("relation")))
  );
}

function readTokenFromEnv(tokenEnvKey: unknown) {
  if (typeof tokenEnvKey !== "string") return undefined;
  const key = tokenEnvKey.trim();
  if (!key) return undefined;
  return process.env[key]?.trim() || undefined;
}

function assignmentFromShard(
  row: Record<string, unknown>,
  shard: GatewayShard,
): TenantGatewayAssignment {
  return {
    orgId: String(row.org_id),
    shardId: shard.id,
    wsUrl: shard.wsUrl,
    token: shard.token,
    status: "active",
    dedicated: row.dedicated !== false,
    assignmentReason: typeof row.assignment_reason === "string" ? row.assignment_reason : undefined,
  };
}

function assignmentFromUrl(row: Record<string, unknown>): TenantGatewayAssignment | null {
  const wsUrl = typeof row.ws_url === "string" ? row.ws_url.trim() : "";
  if (!wsUrl) return null;
  return {
    orgId: String(row.org_id),
    shardId: typeof row.shard_id === "string" ? row.shard_id.trim() || undefined : undefined,
    wsUrl,
    token: readTokenFromEnv(row.token_env_key),
    status: "active",
    dedicated: row.dedicated !== false,
    assignmentReason: typeof row.assignment_reason === "string" ? row.assignment_reason : undefined,
  };
}

export function resolveTenantGatewayAssignmentFromRow(
  row: Record<string, unknown>,
): TenantGatewayAssignment | null {
  if (row.status !== "active") return null;
  const shard = getConfiguredGatewayShard(typeof row.shard_id === "string" ? row.shard_id : undefined);
  if (shard) {
    return assignmentFromShard(row, shard);
  }
  return assignmentFromUrl(row);
}

export async function getActiveTenantGatewayAssignment(
  orgId: string,
): Promise<TenantGatewayAssignment | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("openclaw_gateway_assignments")
    .select("org_id, shard_id, ws_url, token_env_key, status, dedicated, assignment_reason")
    .eq("org_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    if (isMissingGatewayAssignmentsSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;

  return resolveTenantGatewayAssignmentFromRow(data as Record<string, unknown>);
}

function pickLeastLoadedShard(
  shards: GatewayShard[],
  rows: Array<{ shard_id?: string | null }>,
) {
  const counts = new Map(shards.map((shard) => [shard.id, 0]));
  for (const row of rows) {
    const shardId = row.shard_id?.trim();
    if (!shardId || !counts.has(shardId)) continue;
    counts.set(shardId, (counts.get(shardId) ?? 0) + 1);
  }
  return shards.toSorted((a, b) => {
    const countDiff = (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0);
    return countDiff === 0 ? a.id.localeCompare(b.id) : countDiff;
  })[0];
}

export async function ensureTenantGatewayAssignment(input: {
  orgId: string;
  reason: "trial" | "paid" | "whatsapp" | "telegram" | "slack" | "manual" | "performance";
  dedicated?: boolean;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const existing = await getActiveTenantGatewayAssignment(input.orgId);
  if (existing) return existing;

  const shards = listConfiguredGatewayShards();
  if (shards.length === 0) return null;

  const { data: activeRows, error: listError } = await admin
    .from("openclaw_gateway_assignments")
    .select("shard_id")
    .eq("status", "active");

  if (listError) {
    if (isMissingGatewayAssignmentsSchemaError(listError)) return null;
    throw listError;
  }

  const shard = pickLeastLoadedShard(
    shards,
    (activeRows ?? []) as Array<{ shard_id?: string | null }>,
  );
  if (!shard) return null;

  const { data, error } = await admin
    .from("openclaw_gateway_assignments")
    .upsert(
      {
        org_id: input.orgId,
        shard_id: shard.id,
        status: "active",
        dedicated: input.dedicated ?? true,
        assignment_reason: input.reason,
        metadata: {
          strategy: "least_loaded_prewarmed_pool",
          assignedBy: "saintagi",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
    )
    .select("org_id, shard_id, ws_url, token_env_key, status, dedicated, assignment_reason")
    .single();

  if (error) {
    if (isMissingGatewayAssignmentsSchemaError(error)) return null;
    throw error;
  }

  return resolveTenantGatewayAssignmentFromRow(data as Record<string, unknown>);
}
