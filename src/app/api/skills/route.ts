import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgPolicy } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { appendRuntimeAuditEvent } from "@/lib/openclaw/log-sync";
import { recordSetupAuditEvent, recordFunnelStep } from "@/lib/setup-audit";
import { fetchSkillIndex } from "@/lib/skills-index";

const installSchema = z.object({
  slug: z.string().min(1),
  source: z.enum(["clawhub", "github"]).default("clawhub"),
  agentId: z.string().min(1),
  version: z.string().optional(),
  force: z.boolean().optional(),
  action: z.enum(["install", "disable"]).default("install"),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const index = await fetchSkillIndex();

  if (isOpenClawConfigured()) {
    try {
      const { snapshot } = await getOrgModelCatalogState(session.org.id);
      const { client: openClaw } = await getTenantOpenClawClient(session.org.id, {
        orgId: session.org.id,
        defaultModel: snapshot.defaultModel,
        approvedModels: snapshot.approvedModels.map((e) => ({ id: e.id, label: e.label })),
      });
      const status = await openClaw.call("skills.status", {});
      return NextResponse.json({
        data: {
          index,
          installed: status ?? null,
        },
      });
    } catch {
      return NextResponse.json({ data: { index, installed: null } });
    }
  }

  return NextResponse.json({ data: { index, installed: null } });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!isOpenClawConfigured()) {
    return NextResponse.json(
      { error: { message: "OpenClaw gateway is not configured." } },
      { status: 503 },
    );
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Agent management access required." } }, { status: 403 });
  }

  const body = installSchema.parse(await request.json());

  const policy = await getOrgPolicy(session.org.id);
  const skillPolicy = policy?.skill_policy as {
    allowedSources?: string[];
    allowedTrustTiers?: string[];
    requireApprovalForCommunity?: boolean;
  } | null;

  if (skillPolicy?.allowedSources && !skillPolicy.allowedSources.includes(body.source)) {
    recordSetupAuditEvent({
      orgId: session.org.id,
      agentId: body.agentId,
      userId: session.userId,
      eventType: "skill.policy_blocked",
      category: "skill",
      metadata: { slug: body.slug, source: body.source, reason: "source_not_allowed" },
    }).catch(() => null);

    return NextResponse.json(
      { error: { message: `Skill source "${body.source}" is not allowed by your organization's policy.` } },
      { status: 403 },
    );
  }

  const { snapshot } = await getOrgModelCatalogState(session.org.id);
  const { client: openClaw, runtime } = await getTenantOpenClawClient(session.org.id, {
    orgId: session.org.id,
    defaultModel: snapshot.defaultModel,
    approvedModels: snapshot.approvedModels.map((e) => ({ id: e.id, label: e.label })),
  });

  if (body.action === "disable") {
    const result = await openClaw.call("skills.update", {
      skillKey: body.slug,
      enabled: false,
    });

    recordSetupAuditEvent({
      orgId: session.org.id,
      agentId: body.agentId,
      userId: session.userId,
      eventType: "skill.removed",
      category: "skill",
      metadata: { slug: body.slug },
    }).catch(() => null);

    return NextResponse.json({ data: result });
  }

  const result = await openClaw.call("skills.install", {
    source: body.source,
    slug: body.slug,
    version: body.version,
    force: body.force,
    agentId: body.agentId,
  });

  if (runtime) {
    await appendRuntimeAuditEvent(runtime, "skill.installed", {
      orgId: session.org.id,
      agentId: body.agentId,
      slug: body.slug,
      source: body.source,
    }).catch(() => null);
  }

  recordSetupAuditEvent({
    orgId: session.org.id,
    agentId: body.agentId,
    userId: session.userId,
    eventType: "skill.installed",
    category: "skill",
    metadata: { slug: body.slug, source: body.source, version: body.version },
  }).catch(() => null);

  recordFunnelStep({
    orgId: session.org.id,
    step: "skill_installed",
    metadata: { slug: body.slug, agentId: body.agentId },
  }).catch(() => null);

  return NextResponse.json({ data: result });
}
