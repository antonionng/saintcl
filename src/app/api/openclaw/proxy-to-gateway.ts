import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentOrg, getPreferredAgentForSession } from "@/lib/dal";
import { recordRequestEvent } from "@/lib/observability";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export type OpenClawProxyRouteParams = {
  params: Promise<{ path?: string[] }>;
};

const SAINTCLAW_LOGO_STYLE = String.raw`<style id="saintclaw-console-logo-style">
.brand-logo {
  position: relative;
}
.brand-logo > * {
  opacity: 0 !important;
}
.brand-logo::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("/saintclaw-placeholder-logo.png?v=3");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}
</style>`;

function injectConsoleLogoStyle(html: string) {
  if (html.includes('id="saintclaw-console-logo-style"')) {
    return html;
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", `${SAINTCLAW_LOGO_STYLE}</head>`);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${SAINTCLAW_LOGO_STYLE}</body>`);
  }
  return `${html}${SAINTCLAW_LOGO_STYLE}`;
}

const WORKSPACE_PROXY_ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const WORKSPACE_PROXY_ALLOWED_EXACT_PATHS = new Set(["", "chat", "favicon.svg", "sw.js"]);
const WORKSPACE_PROXY_ALLOWED_PREFIXES = ["__openclaw/", "assets/", "avatar/"];

function normalizeProxyPath(pathParts: string[]) {
  return pathParts.join("/").replace(/^\/+|\/+$/g, "");
}

function isWorkspaceProxyPathAllowed(pathName: string) {
  if (WORKSPACE_PROXY_ALLOWED_EXACT_PATHS.has(pathName)) {
    return true;
  }

  return WORKSPACE_PROXY_ALLOWED_PREFIXES.some((prefix) => pathName.startsWith(prefix));
}

export async function proxyToGateway(
  request: Request,
  { params }: OpenClawProxyRouteParams,
  options?: {
    requireAdmin?: boolean;
    requireAssignedAgent?: boolean;
    restrictToWorkspaceSurface?: boolean;
  },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (options?.requireAdmin !== false && !session.capabilities.canManageConsole) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }
  if (options?.requireAssignedAgent) {
    const preferredAgent = await getPreferredAgentForSession(session);
    if (!preferredAgent) {
      return NextResponse.json(
        { error: { message: "Create your first agent before opening workspace chat." } },
        { status: 409 },
      );
    }
  }

  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured." } },
      { status: 503 },
    );
  }

  const pathParts = (await params).path ?? [];
  const normalizedPath = normalizeProxyPath(pathParts);
  const incoming = new URL(request.url);
  const method = request.method.toUpperCase();

  if (options?.restrictToWorkspaceSurface) {
    if (!WORKSPACE_PROXY_ALLOWED_METHODS.has(method)) {
      return NextResponse.json(
        { error: { message: "Workspace proxy only allows read-only requests." } },
        { status: 405 },
      );
    }
    if (!isWorkspaceProxyPathAllowed(normalizedPath)) {
      return NextResponse.json(
        { error: { message: "Workspace proxy path is not allowed." } },
        { status: 403 },
      );
    }
  }

  const proxiedUrl = `${target.httpUrl}/${pathParts.join("/")}${incoming.search}`;
  const requestId = randomUUID();
  const startedAt = Date.now();

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");
  if (target.token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${target.token}`);
  }

  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(proxiedUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    void recordRequestEvent({
      orgId: session.org.id,
      actorUserId: session.userId,
      requestId,
      source: "gateway_http",
      eventType: `http.${method.toLowerCase()}`,
      path: `/${normalizedPath}`,
      method,
      status: response.ok ? "completed" : "failed",
      statusCode: response.status,
      latencyMs: Date.now() - startedAt,
      metadata: {
        runtimeSource: target.source,
      },
    }).catch(() => null);

    const outHeaders = new Headers(response.headers);
    outHeaders.delete("content-security-policy");
    outHeaders.delete("x-frame-options");
    outHeaders.set("cache-control", "no-store");

    const contentType = response.headers.get("content-type") || "";
    const shouldInjectConsoleLogo =
      method === "GET" &&
      pathParts.length === 0 &&
      contentType.toLowerCase().includes("text/html");
    if (shouldInjectConsoleLogo) {
      const html = await response.text();
      const patchedHtml = injectConsoleLogoStyle(html);
      outHeaders.delete("content-encoding");
      outHeaders.delete("content-length");
      return new NextResponse(patchedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: outHeaders,
      });
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gateway proxy failed.";
    void recordRequestEvent({
      orgId: session.org.id,
      actorUserId: session.userId,
      requestId,
      source: "gateway_http",
      eventType: `http.${method.toLowerCase()}`,
      path: `/${normalizedPath}`,
      method,
      status: "failed",
      latencyMs: Date.now() - startedAt,
      errorMessage: message,
      metadata: {
        runtimeSource: target.source,
      },
    }).catch(() => null);

    return NextResponse.json({ error: { message } }, { status: 502 });
  }
}
