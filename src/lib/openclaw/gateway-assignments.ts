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

/**
 * Thrown when an org has an active gateway assignment row that cannot be
 * resolved to a real gateway target. The most common cause is shard config
 * drift: the row pins the org to a shard id that is no longer present in
 * `OPENCLAW_GATEWAY_SHARDS` and the row has no fallback `ws_url` either.
 *
 * We surface this as a hard error rather than silently falling back to hash
 * sharding or `OPENCLAW_GATEWAY_URL`, because falling back routes control-plane
 * writes (config.patch) and data-plane writes (agents.files.set) to a
 * different gateway than the one the assignment promised. That split-brain
 * routing is exactly what produced the production "unknown agent id" failure
 * the gateway agent persistence work was chasing.
 */
export class GatewayAssignmentDriftError extends Error {
  readonly orgId: string;
  readonly shardId?: string;
  readonly assignmentReason?: string;

  constructor(input: { orgId: string; shardId?: string; assignmentReason?: string; reason: string }) {
    super(
      `Gateway assignment for org ${input.orgId} cannot be resolved: ${input.reason}`,
    );
    this.name = "GatewayAssignmentDriftError";
    this.orgId = input.orgId;
    this.shardId = input.shardId;
    this.assignmentReason = input.assignmentReason;
  }
}

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

  const row = data as Record<string, unknown>;
  const resolved = resolveTenantGatewayAssignmentFromRow(row);
  if (resolved) {
    return resolved;
  }

  // We have an active row that the resolver could not turn into a target.
  // Fail closed instead of letting the caller silently fall through to hash
  // sharding or the global env URL, which would route writes to a different
  // gateway than the one the assignment intended.
  const shardIdRaw = typeof row.shard_id === "string" ? row.shard_id.trim() : "";
  const wsUrlRaw = typeof row.ws_url === "string" ? row.ws_url.trim() : "";
  const reasonRaw = typeof row.assignment_reason === "string" ? row.assignment_reason.trim() : "";
  let driftReason: string;
  if (shardIdRaw && !wsUrlRaw) {
    driftReason = `shard "${shardIdRaw}" is not present in OPENCLAW_GATEWAY_SHARDS and the row has no fallback ws_url`;
  } else if (shardIdRaw) {
    driftReason = `shard "${shardIdRaw}" cannot be resolved from current configuration`;
  } else if (wsUrlRaw) {
    driftReason = `ws_url "${wsUrlRaw}" did not parse to a usable gateway target`;
  } else {
    driftReason = "row has neither a known shard_id nor a ws_url";
  }
  throw new GatewayAssignmentDriftError({
    orgId,
    shardId: shardIdRaw || undefined,
    assignmentReason: reasonRaw || undefined,
    reason: driftReason,
  });
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
