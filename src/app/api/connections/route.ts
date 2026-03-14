import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCanSpend, recordUsageCharge, usagePricing } from "@/lib/billing/usage";
import { getCurrentOrg } from "@/lib/dal";
import { env, isOpenClawConfigured } from "@/lib/env";
import { OpenClawClient } from "@/lib/openclaw/client";
import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { ensureTenantRuntime, startTenantRuntime } from "@/lib/openclaw/runtime-manager";
import { buildRuntimeDescriptor } from "@/lib/openclaw/paths";
import { insertChannelMetadata } from "@/lib/openclaw/runtime-store";
import { getChannels } from "@/lib/dal";
import { resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

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
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
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

  const payload = connectChannelSchema.parse(await request.json());
  if (payload.orgId !== session.org.id) {
    return NextResponse.json({ error: { message: "Organization mismatch." } }, { status: 403 });
  }

  await assertCanSpend(payload.orgId, usagePricing.channelConnect);
  const hostedTarget = await resolveTenantGatewayTarget(payload.orgId);
  const usesHostedGateway = Boolean(env.openClawGatewayUrl);
  const runtime = usesHostedGateway
    ? buildRuntimeDescriptor(payload.orgId)
    : await ensureTenantRuntime(payload.orgId, { orgId: payload.orgId });
  const activeRuntime = usesHostedGateway
    ? null
    : await startTenantRuntime(payload.orgId);
  const openClaw = usesHostedGateway
    ? new OpenClawClient(
        hostedTarget
          ? {
              gatewayUrl: hostedTarget.wsUrl,
              gatewayToken: hostedTarget.token,
            }
          : undefined,
      )
    : new OpenClawClient(activeRuntime ?? undefined);

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

  await recordUsageCharge({
    orgId: payload.orgId,
    userId: session.userId,
    agentId: payload.agentId,
    eventType: "usage_channel_connect",
    amountCents: usagePricing.channelConnect,
    description: `Connected ${payload.type} channel`,
    metadata: { type: payload.type },
  });

  if (!usesHostedGateway) {
    await appendRuntimeAuditEvent(runtime, "channel.connected", {
      orgId: payload.orgId,
      agentId: payload.agentId,
      type: payload.type,
    });
  }

  return NextResponse.json({
    data: {
      ...payload,
      gatewayPort: activeRuntime?.gatewayPort ?? null,
      status: "pending",
    },
  });
}
