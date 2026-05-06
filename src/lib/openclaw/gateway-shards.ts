import { createHash } from "node:crypto";

import { env } from "@/lib/env";

export type GatewayShard = {
  id: string;
  wsUrl: string;
  token?: string;
};

type ShardEnvEntry = {
  id?: string;
  wsUrl?: string;
  url?: string;
  token?: string;
  orgs?: string[];
};

type ParsedShardConfig = {
  shards: GatewayShard[];
  pinned: Map<string, string>;
};

let cachedConfig: ParsedShardConfig | null = null;
let cachedRaw: string | null | undefined;

function parseShardConfig(raw: string | undefined): ParsedShardConfig {
  if (!raw?.trim()) {
    return { shards: [], pinned: new Map() };
  }

  try {
    const parsed = JSON.parse(raw) as ShardEnvEntry[] | { shards?: ShardEnvEntry[] };
    const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.shards) ? parsed.shards : [];
    const shards: GatewayShard[] = [];
    const pinned = new Map<string, string>();

    for (const entry of entries) {
      const wsUrl = entry?.wsUrl?.trim() || entry?.url?.trim();
      if (!wsUrl) continue;
      const id = entry?.id?.trim() || `shard-${shards.length + 1}`;
      const shard: GatewayShard = {
        id,
        wsUrl,
        token: entry?.token?.trim() || undefined,
      };
      shards.push(shard);
      for (const orgId of entry?.orgs ?? []) {
        if (typeof orgId === "string" && orgId.trim()) {
          pinned.set(orgId.trim(), id);
        }
      }
    }

    return { shards, pinned };
  } catch {
    return { shards: [], pinned: new Map() };
  }
}

function getShardConfig(): ParsedShardConfig {
  const raw = env.openClawGatewayShards;
  if (cachedConfig && cachedRaw === raw) {
    return cachedConfig;
  }
  cachedConfig = parseShardConfig(raw);
  cachedRaw = raw;
  return cachedConfig;
}

function pickShardForOrg(orgId: string, shards: GatewayShard[], pinned: Map<string, string>) {
  const explicit = pinned.get(orgId);
  if (explicit) {
    const match = shards.find((shard) => shard.id === explicit);
    if (match) return match;
  }

  // Stable hash so the same org always lands on the same shard, which keeps
  // workspace state, channel pairings, and gateway-side caches consistent
  // across requests once sharding is rolled out.
  const digest = createHash("sha256").update(orgId).digest();
  const index = digest.readUInt32BE(0) % shards.length;
  return shards[index];
}

/**
 * Resolves the gateway shard that should serve traffic for the given org. If
 * `OPENCLAW_GATEWAY_SHARDS` is not configured, this returns null and callers
 * fall back to the single shared `OPENCLAW_GATEWAY_URL`. Once shard config is
 * provided, every org gets a stable shard assignment so customer traffic does
 * not pile up on one Railway runtime.
 *
 * Shard config shape (set as JSON in OPENCLAW_GATEWAY_SHARDS):
 * [
 *   { "id": "shard-a", "wsUrl": "wss://gw-a.example", "token": "..." },
 *   { "id": "shard-b", "wsUrl": "wss://gw-b.example", "token": "...", "orgs": ["org_pinned_id"] }
 * ]
 */
export function resolveOrgGatewayShard(orgId: string | undefined | null): GatewayShard | null {
  if (!orgId) return null;
  const { shards, pinned } = getShardConfig();
  if (shards.length === 0) return null;
  return pickShardForOrg(orgId, shards, pinned);
}

export function listConfiguredGatewayShards(): GatewayShard[] {
  return getShardConfig().shards.slice();
}
