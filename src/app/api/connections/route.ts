import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCanSpend, recordUsageCharge, usagePricing } from "@/lib/billing/usage";
import { getCurrentOrg } from "@/lib/dal";
import { env, isOpenClawConfigured } from "@/lib/env";
import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { insertChannelMetadata } from "@/lib/openclaw/runtime-store";
import { getChannels } from "@/lib/dal";

const connectChannelSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("telegram"),
    orgId: z.string(),
    agentId: z.string(),
    botToken: z.string().min(10),
  }),
  z.object({
    type: z.literal("slack"),
    orgId: z.string(),
    agentId: z.string(),
    teamId: z.string().min(3),
  }),
]);

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") ?? session.org.id;
  if (orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }

  if (!orgId) {
    return NextResponse.json({ data: [] });
  }

  const channels = await getChannels(orgId);
  return NextResponse.json({ data: channels });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured for this environment." } },
      { status: 503 },
    );
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Agent access required." } }, { status: 403 });
  }

  const payload = connectChannelSchema.parse(await request.json());
  if (payload.orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }

  if (!session.isSuperAdmin) {
    await assertCanSpend(payload.orgId, usagePricing.channelConnect);
  }
  const { snapshot } = await getOrgModelCatalogState(payload.orgId);
  const { client: openClaw, runtime } = await getTenantOpenClawClient(payload.orgId, {
    orgId: payload.orgId,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });
  await openClaw.applyModelGovernance({
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });

  if (payload.type === "telegram") {
    await openClaw.connectTelegram({ agentId: payload.agentId, botToken: payload.botToken });
    await insertChannelMetadata({
      orgId: payload.orgId,
      agentId: payload.agentId,
      type: payload.type,
      credentials: { botToken: payload.botToken },
      status: "pending",
    });
  }

  if (payload.type === "slack") {
    await openClaw.connectSlack({ agentId: payload.agentId, teamId: payload.teamId });
    await insertChannelMetadata({
      orgId: payload.orgId,
      agentId: payload.agentId,
      type: payload.type,
      credentials: { teamId: payload.teamId },
      status: "pending",
    });
  }

  if (!session.isSuperAdmin) {
    await recordUsageCharge({
      orgId: payload.orgId,
      userId: session.userId,
      agentId: payload.agentId,
      eventType: "usage_channel_connect",
      amountCents: usagePricing.channelConnect,
      description: `Connected ${payload.type} channel`,
      metadata: { type: payload.type },
    });
  }

  if (!env.openClawGatewayUrl && runtime) {
    await appendRuntimeAuditEvent(runtime, "channel.connected", {
      orgId: payload.orgId,
      agentId: payload.agentId,
      type: payload.type,
    });
  }

  return NextResponse.json({
    data: {
      ...payload,
      gatewayPort: runtime?.gatewayPort ?? null,
      status: "pending",
    },
  });
}
