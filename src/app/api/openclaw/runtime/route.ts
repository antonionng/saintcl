import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawRuntimeManaged } from "@/lib/env";
import {
  restartTenantRuntime,
  startTenantRuntime,
  stopTenantRuntime,
} from "@/lib/openclaw/runtime-manager";
import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

const runtimeActionSchema = z.object({
  action: z.enum(["start", "stop", "restart"]),
});

function serializeRuntime(runtime: OpenClawRuntimeDescriptor) {
  return {
    id: runtime.id,
    orgId: runtime.orgId,
    gatewayPort: runtime.gatewayPort,
    gatewayUrl: runtime.gatewayUrl,
    status: runtime.status,
    pid: runtime.pid ?? null,
    lastHeartbeatAt: runtime.lastHeartbeatAt ?? null,
  };
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageConsole) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  if (!isOpenClawRuntimeManaged()) {
    return NextResponse.json(
      { error: { message: "Runtime lifecycle actions are only available for managed runtimes." } },
      { status: 409 },
    );
  }

  let payload: z.infer<typeof runtimeActionSchema>;
  try {
    payload = runtimeActionSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid input.";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  try {
    const runtime = payload.action === "stop"
      ? await stopTenantRuntime(session.org.id)
      : payload.action === "restart"
        ? await restartTenantRuntime(session.org.id)
        : await startTenantRuntime(session.org.id, { orgId: session.org.id });

    return NextResponse.json({
      data: {
        action: payload.action,
        runtime: serializeRuntime(runtime),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Runtime lifecycle action failed.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
