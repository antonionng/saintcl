import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type TenantGatewayTarget = {
  wsUrl: string;
  httpUrl: string;
  token?: string;
  source: "runtime" | "env";
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

export function buildGatewayConsoleUrl(target: TenantGatewayTarget) {
  const url = new URL(target.httpUrl);
  url.searchParams.set("gatewayUrl", target.wsUrl);

  const token = target.token?.trim();
  if (token) {
    url.hash = `token=${encodeURIComponent(token)}`;
  }

  return url.toString();
}

export async function resolveTenantGatewayTarget(orgId?: string): Promise<TenantGatewayTarget | null> {
  const fallback = getEnvGatewayTarget();
  if (!orgId || fallback) return fallback;

  const admin = createAdminClient();
  if (!admin) return fallback;

  const { data } = await admin
    .from("openclaw_runtimes")
    .select("gateway_port, gateway_token")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.gateway_port) return fallback;

  const envHost = env.openClawGatewayUrl ? new URL(wsToHttp(env.openClawGatewayUrl)).host : "127.0.0.1:18789";
  const hostName = envHost.split(":")[0] || "127.0.0.1";

  return {
    wsUrl: `ws://${hostName}:${data.gateway_port}`,
    httpUrl: `http://${hostName}:${data.gateway_port}`,
    token: data.gateway_token || env.openClawGatewayToken || undefined,
    source: "runtime",
  };
}

