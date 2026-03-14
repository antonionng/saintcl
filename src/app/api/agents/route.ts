import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCanSpend, recordUsageCharge, usagePricing } from "@/lib/billing/usage";
import { OpenClawClient } from "@/lib/openclaw/client";
import { env, isOpenClawConfigured } from "@/lib/env";
import { insertAgentMetadata, upsertAgentAssignment } from "@/lib/openclaw/runtime-store";
import { getAgents, getCurrentOrg } from "@/lib/dal";

const createAgentSchema = z.object({
  name: z.string().min(2).optional(),
  model: z.string().min(3).optional(),
  persona: z.string().min(3).optional(),
  scope: z.enum(["employee", "team", "org"]).default("employee"),
  assignee: z.string().optional(),
});

function buildAgentName(payload: z.infer<typeof createAgentSchema>) {
  if (payload.name?.trim()) return payload.name.trim();
  if (payload.assignee?.trim()) {
    const source = payload.assignee.includes("@")
      ? payload.assignee.split("@")[0]
      : payload.assignee;
    const normalized = source
      .trim()
      .replace(/[-_.]+/g, " ")
      .replace(/\s+/g, " ");
    if (normalized.length > 0) {
      const titled = normalized
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      return `${titled} Agent`;
    }
  }
  if (payload.scope === "team") return "Team Agent";
  if (payload.scope === "org") return "Organization Agent";
  return "Employee Agent";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ data: [] });
  }
  const agents = await getAgents(orgId);
  return NextResponse.json({ data: agents });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json(
      { error: { message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const orgId = session.org.id;
  const userId = session.userId;

  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured for this environment." } },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof createAgentSchema>;
  try {
    payload = createAgentSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues[0]?.message : "Invalid input";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  if ((payload.scope === "employee" || payload.scope === "team") && !payload.assignee?.trim()) {
    return NextResponse.json(
      { error: { message: payload.scope === "employee" ? "Employee is required." : "Team is required." } },
      { status: 400 },
    );
  }

  const name = buildAgentName(payload);
  const model = payload.model ?? env.openClawDefaultModel;
  const persona =
    payload.persona ??
    `You are ${name}. Follow the assigned human's direction inside organization guardrails and focus on practical outcomes.`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  try {
    await assertCanSpend(orgId, usagePricing.agentProvision);

    const client = new OpenClawClient();
    await client.provisionAgent({
      agentId: slug,
      workspace: `workspaces/${slug}`,
      model,
    });

    const agentRow = await insertAgentMetadata({
      orgId,
      userId,
      name,
      slug,
      model,
      persona,
      workspacePath: `workspaces/${slug}`,
      metadata: {
        scope: payload.scope,
        assignee: payload.assignee ?? null,
      },
    });

    if (agentRow?.id) {
      await upsertAgentAssignment({
        orgId,
        agentId: agentRow.id,
        assigneeType: payload.scope,
        assigneeRef: payload.scope === "org" ? orgId : payload.assignee ?? orgId,
        createdBy: userId,
      });
    }

    await recordUsageCharge({
      orgId,
      userId,
      agentId: agentRow?.id ?? null,
      eventType: "usage_agent_provision",
      amountCents: usagePricing.agentProvision,
      description: `Provisioned agent ${name}`,
      metadata: {
        scope: payload.scope,
        assignee: payload.assignee ?? null,
        openclawAgentId: slug,
      },
    });

    return NextResponse.json({
      data: {
        id: agentRow?.id ?? slug,
        name,
        model,
        openclawAgentId: slug,
        scope: payload.scope,
        assignee: payload.assignee,
        status: "provisioning",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
