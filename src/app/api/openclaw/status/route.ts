import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { OpenClawClient } from "@/lib/openclaw/client";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageConsole) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  if (!isOpenClawConfigured()) {
    return NextResponse.json({
      data: {
        configured: false,
        gatewayUrl: null,
        healthy: false,
      },
    });
  }

  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    return NextResponse.json({
      data: {
        configured: false,
        gatewayUrl: null,
        healthy: false,
      },
    });
  }

  try {
    const client = new OpenClawClient({
      gatewayUrl: target.wsUrl,
      gatewayToken: target.token,
    });
    await client.health();
    return NextResponse.json({
      data: {
        configured: true,
        gatewayUrl: target.wsUrl,
        healthy: true,
        source: target.source,
      },
    });
  } catch (error) {
    return NextResponse.json({
      data: {
        configured: true,
        gatewayUrl: target.wsUrl,
        healthy: false,
        source: target.source,
        error: error instanceof Error ? error.message : "Gateway unreachable",
      },
    });
  }
}

