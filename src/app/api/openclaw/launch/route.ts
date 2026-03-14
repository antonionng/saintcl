import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { buildGatewayConsoleUrl, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export async function GET() {
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

  return NextResponse.redirect(buildGatewayConsoleUrl(target));
}

