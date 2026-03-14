import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

type RouteParams = {
  params: Promise<{ path?: string[] }>;
};

async function proxyToGateway(request: Request, { params }: RouteParams) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageConsole) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured." } },
      { status: 503 },
    );
  }

  const pathParts = (await params).path ?? [];
  const incoming = new URL(request.url);
  const proxiedUrl = `${target.httpUrl}/${pathParts.join("/")}${incoming.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("accept-encoding");
  if (target.token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${target.token}`);
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const response = await fetch(proxiedUrl, {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const outHeaders = new Headers(response.headers);
  outHeaders.delete("content-encoding");
  outHeaders.set("cache-control", "no-store");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  });
}

export async function GET(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

export async function POST(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

export async function PUT(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

export async function PATCH(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

export async function DELETE(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

export async function OPTIONS(request: Request, ctx: RouteParams) {
  return proxyToGateway(request, ctx);
}

