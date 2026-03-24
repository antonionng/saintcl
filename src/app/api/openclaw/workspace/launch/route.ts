import { NextResponse } from "next/server";

import { getCurrentOrg, getPreferredAgentForSession } from "@/lib/dal";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated." } }, { status: 401 });
  }

  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured." } },
      { status: 503 },
    );
  }

  const preferredAgent = await getPreferredAgentForSession(session);
  if (!preferredAgent) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  const preferredSession = preferredAgent ? `agent:${preferredAgent.openclaw_agent_id}:main` : undefined;

  return NextResponse.redirect(
    new URL(buildGatewayWorkspaceProxyPath(target, { path: "chat", session: preferredSession }), request.url),
  );
}
