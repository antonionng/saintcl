import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgMembers } from "@/lib/dal";
import { injectOrgContext, type OrgInjectionResult } from "@/lib/openclaw/context-injection";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/org-selection";
import { enrichOrgWebsite } from "@/lib/org-website-enrichment";
import { createAdminClient } from "@/lib/supabase/admin";

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  website: z.string().trim().max(240).optional().default(""),
  companySummary: z.string().trim().max(2000).optional().default(""),
  agentBrief: z.string().trim().max(2000).optional().default(""),
  forceEnrich: z.boolean().optional(),
  forceSync: z.boolean().optional(),
});

async function runOrgContextSync(input: {
  orgId: string;
  org: {
    name: string | null;
    website: string | null;
    companySummary: string | null;
    agentBrief: string | null;
  };
}): Promise<OrgInjectionResult> {
  try {
    return await injectOrgContext(
      { orgId: input.orgId },
      {
        org: input.org,
        agentOptions: {
          syncKnowledge: true,
          applySafeMemoryConfig: true,
          writeHeartbeat: true,
        },
      },
    );
  } catch (error) {
    return {
      orgId: input.orgId,
      totalAgents: 0,
      okAgents: 0,
      failedAgents: 0,
      failures: [],
      plans: [],
      skipped: error instanceof Error ? error.message : "Unknown sync error.",
    };
  }
}

function setActiveOrgCookie(response: NextResponse, orgId: string) {
  response.cookies.set(ACTIVE_ORG_COOKIE_NAME, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const members = await getOrgMembers(session.org.id);

  return NextResponse.json({
    data: {
      userId: session.userId,
      email: session.email,
      isSuperAdmin: session.isSuperAdmin,
      displayName: members.find((member) => member.userId === session.userId)?.displayName ?? null,
      members,
      org: session.org,
      role: session.role,
      capabilities: session.capabilities,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Supabase admin is unavailable." } }, { status: 503 });
  }

  const payload = updateOrgSchema.parse(await request.json());

  if (payload.forceEnrich && payload.website?.trim()) {
    await admin
      .from("orgs")
      .update({ website_enriched_url: null, website_enriched_at: null })
      .eq("id", session.org.id);

    enrichOrgWebsite({
      orgId: session.org.id,
      website: payload.website,
      createdBy: session.userId,
    }).catch(() => null);

    const response = NextResponse.json({ data: { ok: true, enrichmentTriggered: true } });
    setActiveOrgCookie(response, session.org.id);
    return response;
  }

  if (payload.forceSync) {
    const { data: orgRow, error: readError } = await admin
      .from("orgs")
      .select("id, name, slug, plan, website, company_summary, agent_brief, logo_path, created_at")
      .eq("id", session.org.id)
      .single();

    if (readError || !orgRow) {
      return NextResponse.json(
        { error: { message: readError?.message || "Workspace not found." } },
        { status: 500 },
      );
    }

    const sync = await runOrgContextSync({
      orgId: session.org.id,
      org: {
        name: orgRow.name,
        website: orgRow.website,
        companySummary: orgRow.company_summary,
        agentBrief: orgRow.agent_brief,
      },
    });

    const response = NextResponse.json({ data: { org: orgRow, sync } });
    setActiveOrgCookie(response, session.org.id);
    return response;
  }

  const updateFields: Record<string, unknown> = {};
  if (payload.name !== undefined) updateFields.name = payload.name;
  if (payload.website !== undefined) updateFields.website = payload.website;
  if (payload.companySummary !== undefined) updateFields.company_summary = payload.companySummary;
  if (payload.agentBrief !== undefined) updateFields.agent_brief = payload.agentBrief;

  const { data, error } = await admin
    .from("orgs")
    .update(updateFields)
    .eq("id", session.org.id)
    .select("id, name, slug, plan, website, company_summary, agent_brief, logo_path, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const sync = await runOrgContextSync({
    orgId: session.org.id,
    org: {
      name: data.name,
      website: data.website,
      companySummary: data.company_summary,
      agentBrief: data.agent_brief,
    },
  });

  if (data.website?.trim()) {
    enrichOrgWebsite({
      orgId: session.org.id,
      website: data.website,
      createdBy: session.userId,
    }).catch(() => null);
  }

  const response = NextResponse.json({ data: { org: data, sync } });
  setActiveOrgCookie(response, session.org.id);
  return response;
}
