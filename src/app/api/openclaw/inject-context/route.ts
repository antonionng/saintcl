import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { injectOrgContext } from "@/lib/openclaw/context-injection";
import { RuntimeRateLimitError } from "@/lib/openclaw/client";

const requestSchema = z
  .object({
    orgId: z.string().uuid().optional(),
    dryRun: z.boolean().optional(),
    syncKnowledge: z.boolean().optional(),
    applySafeMemoryConfig: z.boolean().optional(),
    writeHeartbeat: z.boolean().optional(),
  })
  .default({});

/**
 * Tenant-wide context injection. Admin-gated for the caller's own org;
 * super admins can target a specific org via `orgId`.
 *
 * The agent never calls this; only the SaintAGI control plane writes the
 * native OpenClaw surfaces (workspace files, knowledge mirror, memorySearch
 * config). That keeps the first user chat off the setup critical path.
 */
export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageAgents) {
    return NextResponse.json(
      { error: { message: "Agent management requires admin access." } },
      { status: 403 },
    );
  }

  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "Runtime gateway is not configured." } },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    payload = requestSchema.parse(body ?? {});
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  const targetOrgId = payload.orgId ?? session.org.id;
  if (targetOrgId !== session.org.id && !session.isSuperAdmin) {
    return NextResponse.json(
      { error: { message: "Cross-org context injection requires super-admin access." } },
      { status: 403 },
    );
  }

  try {
    const result = await injectOrgContext(
      { orgId: targetOrgId },
      {
        dryRun: payload.dryRun ?? false,
        agentOptions: {
          syncKnowledge: payload.syncKnowledge ?? true,
          applySafeMemoryConfig: payload.applySafeMemoryConfig ?? true,
          writeHeartbeat: payload.writeHeartbeat ?? true,
        },
      },
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof RuntimeRateLimitError) {
      const retryAfterSeconds = Math.max(1, Math.ceil(error.retryAfterMs / 1000));
      return NextResponse.json(
        {
          error: {
            message: `Too many setup changes in the last minute. Please try again in ${retryAfterSeconds} seconds.`,
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }
    const message = error instanceof Error ? error.message : "Context injection failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
