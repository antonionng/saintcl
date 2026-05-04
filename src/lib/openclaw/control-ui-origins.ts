import { headers } from "next/headers";

import { env } from "@/lib/env";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";

function buildRequestOrigin(proto: string | null, host: string | null) {
  if (!host) return null;
  return `${proto || "http"}://${host}`;
}

function withLoopbackAlias(origin: string) {
  try {
    const url = new URL(origin);
    const variants = new Set([url.origin]);
    if (url.hostname === "localhost") {
      variants.add(`${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ""}`);
    }
    if (url.hostname === "127.0.0.1") {
      variants.add(`${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`);
    }
    return [...variants];
  } catch {
    return [origin];
  }
}

function isLoopbackOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function addCommonLocalDevOrigins(origins: Set<string>) {
  for (let port = 3000; port <= 3010; port += 1) {
    origins.add(`http://localhost:${port}`);
    origins.add(`http://127.0.0.1:${port}`);
  }
}

export async function ensureCurrentControlUiOrigin(orgId: string) {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

  const candidateOrigins = new Set<string>();
  const requestOrigin = buildRequestOrigin(forwardedProto, host);
  if (requestOrigin) {
    for (const origin of withLoopbackAlias(requestOrigin)) {
      candidateOrigins.add(origin);
    }
    if (isLoopbackOrigin(requestOrigin)) {
      addCommonLocalDevOrigins(candidateOrigins);
    }
  }
  if (env.appUrl) {
    for (const origin of withLoopbackAlias(env.appUrl)) {
      candidateOrigins.add(origin);
    }
    if (isLoopbackOrigin(env.appUrl)) {
      addCommonLocalDevOrigins(candidateOrigins);
    }
  }

  if (candidateOrigins.size === 0) {
    return { changed: false, allowedOrigins: [] as string[] };
  }

  const { client } = await getTenantOpenClawClient(orgId, { orgId });
  return client.ensureControlUiAllowedOrigins([...candidateOrigins]);
}
