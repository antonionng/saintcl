import { NextResponse } from "next/server";
import { z } from "zod";

import { getApp } from "@/lib/apps/catalog";
import { recordAppInstall, recordAppRequest } from "@/lib/apps/store";
import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { insertChannelMetadata } from "@/lib/openclaw/runtime-store";
import { recordSetupAuditEvent } from "@/lib/setup-audit";

const installSchema = z.object({
  appId: z.string().min(1),
  agentId: z.string().nullable().optional(),
  token: z.string().optional(),
  requestAccess: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: "Agent management access required." }, { status: 403 });
  }

  const body = installSchema.parse(await request.json());
  const app = getApp(body.appId);
  if (!app) {
    return NextResponse.json({ error: "Unknown app." }, { status: 404 });
  }

  if (body.requestAccess || app.install === "oauth-soon") {
    await recordAppRequest({
      orgId: session.org.id,
      appId: app.id,
      requestedBy: session.userId,
    });
    recordSetupAuditEvent({
      orgId: session.org.id,
      agentId: body.agentId ?? undefined,
      userId: session.userId,
      eventType: "app.requested",
      category: "app",
      metadata: { appId: app.id },
    }).catch(() => null);
    return NextResponse.json({ data: { requested: true } });
  }

  const installer = app.installer;

  try {
    if (installer === "openclaw-skill") {
      if (!isOpenClawConfigured()) {
        return NextResponse.json({ error: "Agent runtime not available." }, { status: 503 });
      }
      if (!body.agentId) {
        return NextResponse.json({ error: "Choose an agent for this skill." }, { status: 400 });
      }
      if (!app.skillSlug) {
        return NextResponse.json({ error: "Skill not configured." }, { status: 500 });
      }
      const { snapshot } = await getOrgModelCatalogState(session.org.id);
      const { client: openClaw } = await getTenantOpenClawClient(session.org.id, {
        orgId: session.org.id,
        defaultModel: snapshot.defaultModel,
        approvedModels: snapshot.approvedModels.map((e) => ({ id: e.id, label: e.label })),
      });
      await openClaw.call("skills.install", {
        source: app.skillSlug.startsWith("github/") ? "github" : "clawhub",
        slug: app.skillSlug,
        agentId: body.agentId,
      });
    } else if (installer === "channel-token") {
      if (!isOpenClawConfigured()) {
        return NextResponse.json({ error: "Agent runtime not available." }, { status: 503 });
      }
      if (!body.agentId) {
        return NextResponse.json({ error: "Choose an agent for this channel." }, { status: 400 });
      }
      if (!body.token) {
        return NextResponse.json({ error: "A token is required." }, { status: 400 });
      }
      const { snapshot } = await getOrgModelCatalogState(session.org.id);
      const { client: openClaw } = await getTenantOpenClawClient(session.org.id, {
        orgId: session.org.id,
        defaultModel: snapshot.defaultModel,
        approvedModels: snapshot.approvedModels.map((e) => ({ id: e.id, label: e.label })),
      });
      if (app.channelType === "telegram") {
        await openClaw.connectTelegram({ agentId: body.agentId, botToken: body.token });
        await insertChannelMetadata({
          orgId: session.org.id,
          agentId: body.agentId,
          type: "telegram",
          credentials: { botToken: body.token },
          status: "pending",
        });
      } else if (app.channelType === "slack") {
        await openClaw.connectSlack({ agentId: body.agentId, teamId: body.token });
        await insertChannelMetadata({
          orgId: session.org.id,
          agentId: body.agentId,
          type: "slack",
          credentials: { teamId: body.token },
          status: "pending",
        });
      } else {
        return NextResponse.json({ error: "Unsupported channel type." }, { status: 400 });
      }
    } else if (installer === "config-toggle") {
      // For search, memory, and tools, recording the install is enough for v1.
      // The agent runtime will pick up bindings from agent_apps and the gateway
      // plugin governance flow surfaces the corresponding plugin to agents.
    } else if (installer === "mcp-stub") {
      const admin = createAdminClient();
      if (admin) {
        await admin
          .from("org_mcp_servers")
          .upsert(
            {
              org_id: session.org.id,
              app_id: app.id,
              config: {},
              created_by: session.userId,
            },
            { onConflict: "org_id,app_id" },
          );
      }
    } else {
      return NextResponse.json({ error: "Installer not implemented." }, { status: 400 });
    }

    const { row: installRow, error: persistError } = await recordAppInstall({
      orgId: session.org.id,
      agentId: body.agentId ?? null,
      appId: app.id,
      installer: installer ?? "unknown",
      installedBy: session.userId,
    });

    if (persistError) {
      return NextResponse.json({ error: persistError }, { status: 500 });
    }

    recordSetupAuditEvent({
      orgId: session.org.id,
      agentId: body.agentId ?? undefined,
      userId: session.userId,
      eventType: "app.installed",
      category: "app",
      metadata: { appId: app.id, installer },
    }).catch(() => null);

    return NextResponse.json({ data: installRow });
  } catch (error) {
    console.error("[apps.install] failed", { appId: body.appId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Install failed." },
      { status: 500 },
    );
  }
}
