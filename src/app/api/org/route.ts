import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgMembers } from "@/lib/dal";
import { syncOrgContextToAgents } from "@/lib/openclaw/profile-context";
import { enrichOrgWebsite } from "@/lib/org-website-enrichment";
import { createAdminClient } from "@/lib/supabase/admin";

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  website: z.string().trim().max(240).optional().default(""),
  companySummary: z.string().trim().max(2000).optional().default(""),
  agentBrief: z.string().trim().max(2000).optional().default(""),
  forceEnrich: z.boolean().optional(),
});

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

    return NextResponse.json({ data: { ok: true, enrichmentTriggered: true } });
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

  await syncOrgContextToAgents({
    orgId: session.org.id,
    org: {
      name: data.name,
      website: data.website,
      companySummary: data.company_summary,
      agentBrief: data.agent_brief,
    },
  }).catch(() => null);

  if (data.website?.trim()) {
    enrichOrgWebsite({
      orgId: session.org.id,
      website: data.website,
      createdBy: session.userId,
    }).catch(() => null);
  }

  return NextResponse.json({ data });
}
