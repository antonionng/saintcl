import { createAdminClient } from "@/lib/supabase/admin";
import { env, isOpenClawRuntimeManaged } from "@/lib/env";
import { resolveOrgGatewayShard } from "@/lib/openclaw/gateway-shards";

export type TenantGatewayTarget = {
  wsUrl: string;
  httpUrl: string;
  token?: string;
  source: "runtime" | "env" | "shard";
  shardId?: string;
};

function wsToHttp(url: string) {
  if (url.startsWith("wss://")) return `https://${url.slice("wss://".length)}`;
  if (url.startsWith("ws://")) return `http://${url.slice("ws://".length)}`;
  return url;
}

function getEnvGatewayTarget(): TenantGatewayTarget | null {
  if (!env.openClawGatewayUrl) return null;
  return {
    wsUrl: env.openClawGatewayUrl,
    httpUrl: wsToHttp(env.openClawGatewayUrl),
    token: env.openClawGatewayToken || undefined,
    source: "env",
  };
}

async function getRuntimeGatewayTarget(orgId: string): Promise<TenantGatewayTarget | null> {
  if (!isOpenClawRuntimeManaged()) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("openclaw_runtimes")
    .select("gateway_port, gateway_token")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.gateway_port) {
    return null;
  }

  const envHost = env.openClawGatewayUrl ? new URL(wsToHttp(env.openClawGatewayUrl)).host : "127.0.0.1:18789";
  const hostName = envHost.split(":")[0] || "127.0.0.1";

  return {
    wsUrl: `ws://${hostName}:${data.gateway_port}`,
    httpUrl: `http://${hostName}:${data.gateway_port}`,
    token: data.gateway_token || env.openClawGatewayToken || undefined,
    source: "runtime",
  };
}

export function buildGatewayConsoleUrl(target: TenantGatewayTarget) {
  const url = new URL(target.httpUrl);
  url.searchParams.set("gatewayUrl", target.wsUrl);

  const token = target.token?.trim();
  if (token) {
    url.hash = `token=${encodeURIComponent(token)}`;
  }

  return url.toString();
}

function buildGatewayProxyPath(
  target: TenantGatewayTarget,
  basePath: string,
  options?: { path?: string; embed?: boolean; managedRuntime?: boolean; session?: string; debug?: boolean },
) {
  const params = new URLSearchParams();
  params.set("gatewayUrl", target.wsUrl);
  if (options?.embed) {
    params.set("embed", "1");
  }
  if (options?.managedRuntime) {
    params.set("managedRuntime", "1");
  }
  if (options?.debug) {
    params.set("debug", "1");
  }
  if (options?.session?.trim()) {
    params.set("session", options.session.trim());
  }

  const token = target.token?.trim();
  const hash = token ? `#token=${encodeURIComponent(token)}` : "";
  const normalizedPath = options?.path?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  const pathSuffix = normalizedPath ? `/${normalizedPath}` : "";

  return `${basePath}${pathSuffix}/?${params.toString()}${hash}`;
}

export function buildGatewayConsoleProxyPath(
  target: TenantGatewayTarget,
  options?: { path?: string; embed?: boolean; session?: string },
) {
  return buildGatewayProxyPath(target, "/api/openclaw/console", {
    ...options,
    debug: true,
    managedRuntime: target.source === "env",
  });
}

export function buildGatewayWorkspaceProxyPath(target: TenantGatewayTarget, options?: { path?: string; session?: string }) {
  return buildGatewayProxyPath(target, "/api/openclaw/workspace", {
    ...options,
    embed: true,
    managedRuntime: target.source === "env",
  });
}

function getShardGatewayTarget(orgId: string): TenantGatewayTarget | null {
  const shard = resolveOrgGatewayShard(orgId);
  if (!shard) return null;
  return {
    wsUrl: shard.wsUrl,
    httpUrl: wsToHttp(shard.wsUrl),
    token: shard.token || env.openClawGatewayToken || undefined,
    source: "shard",
    shardId: shard.id,
  };
}

export async function resolveTenantGatewayTarget(orgId?: string): Promise<TenantGatewayTarget | null> {
  if (!orgId) {
    return getEnvGatewayTarget();
  }

  if (isOpenClawRuntimeManaged()) {
    return getRuntimeGatewayTarget(orgId);
  }

  // Sharded hosted gateways: when OPENCLAW_GATEWAY_SHARDS is set, each org is
  // pinned to a stable shard so customer traffic does not pile up on a single
  // Railway runtime CPU. Falls back to the single env gateway when sharding
  // is not configured (current default).
  return getShardGatewayTarget(orgId) ?? getEnvGatewayTarget();
}

