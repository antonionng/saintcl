import { NextResponse } from "next/server";

import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { ensureTenantRuntime } from "@/lib/openclaw/runtime-manager";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const orgId = String(formData.get("orgId") || "org_001");
  const runtime = await ensureTenantRuntime(orgId, { orgId });

  await appendRuntimeAuditEvent(runtime, "knowledge.upload.queued", {
    orgId,
    filename: file instanceof File ? file.name : "unknown",
  });

  return NextResponse.json({
    data: {
      orgId,
      runtimeId: runtime.id,
      filename: file instanceof File ? file.name : "unknown",
      status: "queued",
    },
  });
}
