import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCanSpend, recordUsageCharge, usagePricing } from "@/lib/billing/usage";
import { getCurrentOrg } from "@/lib/dal";
import { env, isOpenClawConfigured } from "@/lib/env";
import { ensureTenantGatewayAssignment } from "@/lib/openclaw/gateway-assignments";
import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { RuntimeRateLimitError } from "@/lib/openclaw/client";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { insertChannelMetadata } from "@/lib/openclaw/runtime-store";
import { recordSetupAuditEvent, recordFunnelStep } from "@/lib/setup-audit";
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
      { error: { message: "Runtime gateway is not configured for this environment." } },
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
  await ensureTenantGatewayAssignment({
    orgId: payload.orgId,
    reason: payload.type,
    dedicated: true,
  }).catch(() => null);

  const { snapshot } = await getOrgModelCatalogState(payload.orgId, {
    trialStatus: session.org.trial_status,
    trialEndsAt: session.org.trial_ends_at,
    isSuperAdmin: session.isSuperAdmin,
  });
  const { client: openClaw, runtime } = await getTenantOpenClawClient(payload.orgId, {
    orgId: payload.orgId,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  });
  try {
    await openClaw.withSession(async (rpc) => {
      const currentSnapshot = await openClaw.getConfigSnapshot(rpc);
      await openClaw.applyModelGovernance(
        {
          defaultModel: snapshot.defaultModel,
          approvedModels: snapshot.approvedModels.map((entry) => ({
            id: entry.id,
            label: entry.label,
          })),
        },
        rpc,
        { currentSnapshot },
      );

      if (payload.type === "telegram") {
        await openClaw.connectTelegram(
          { agentId: payload.agentId, botToken: payload.botToken },
          rpc,
        );
      }

      if (payload.type === "slack") {
        await openClaw.connectSlack({ agentId: payload.agentId, teamId: payload.teamId }, rpc);
      }
    });
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
    throw error;
  }

  if (payload.type === "telegram") {
    await insertChannelMetadata({
      orgId: payload.orgId,
      agentId: payload.agentId,
      type: payload.type,
      credentials: { botToken: payload.botToken },
      status: "pending",
    });
  }

  if (payload.type === "slack") {
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

  recordSetupAuditEvent({
    orgId: payload.orgId,
    agentId: payload.agentId,
    userId: session.userId,
    eventType: "channel.connected",
    category: "channel",
    metadata: { type: payload.type },
  }).catch(() => null);

  recordFunnelStep({
    orgId: payload.orgId,
    step: "channel_connected",
    metadata: { type: payload.type, agentId: payload.agentId },
  }).catch(() => null);

  return NextResponse.json({
    data: {
      ...payload,
      gatewayPort: runtime?.gatewayPort ?? null,
      status: "pending",
    },
  });
}
