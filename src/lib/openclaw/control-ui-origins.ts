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
  }
  if (env.appUrl) {
    for (const origin of withLoopbackAlias(env.appUrl)) {
      candidateOrigins.add(origin);
    }
  }

  if (candidateOrigins.size === 0) {
    return { changed: false, allowedOrigins: [] as string[] };
  }

  const { client } = await getTenantOpenClawClient(orgId, { orgId });
  return client.ensureControlUiAllowedOrigins([...candidateOrigins]);
}
