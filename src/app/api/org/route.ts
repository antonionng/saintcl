import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgMembers } from "@/lib/dal";
import { syncOrgContextToAgents } from "@/lib/openclaw/profile-context";
import { createAdminClient } from "@/lib/supabase/admin";

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().trim().max(240).optional().default(""),
  companySummary: z.string().trim().max(2000).optional().default(""),
  agentBrief: z.string().trim().max(2000).optional().default(""),
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
  const { data, error } = await admin
    .from("orgs")
    .update({
      name: payload.name,
      website: payload.website,
      company_summary: payload.companySummary,
      agent_brief: payload.agentBrief,
    })
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

  return NextResponse.json({ data });
}
