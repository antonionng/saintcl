import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgMembers } from "@/lib/dal";
import { injectOrgContext, type OrgInjectionResult } from "@/lib/openclaw/context-injection";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/org-selection";
import { enrichOrgWebsite, type EnrichOrgWebsiteResult } from "@/lib/org-website-enrichment";
import { createAdminClient } from "@/lib/supabase/admin";

const ORG_SELECT_FIELDS =
  "id, name, slug, plan, website, company_summary, agent_brief, website_enriched_url, website_enriched_at, logo_path, created_at";

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  website: z.string().trim().max(240).optional().default(""),
  companySummary: z.string().trim().max(2000).optional().default(""),
  agentBrief: z.string().trim().max(2000).optional().default(""),
  forceEnrich: z.boolean().optional(),
  forceSync: z.boolean().optional(),
  enrichFromWebsite: z.boolean().optional(),
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

function summarizeEnrichmentForClient(result: EnrichOrgWebsiteResult) {
  if (result.enriched) {
    return {
      ok: true,
      website: result.website,
      companySummary: result.companySummary,
      agentBrief: result.agentBrief,
      profileFieldsWritten: result.profileFieldsWritten,
    } as const;
  }
  return {
    ok: false,
    reason: result.reason,
    website: result.website ?? null,
  } as const;
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

    const enrichResult = await enrichOrgWebsite({
      orgId: session.org.id,
      website: payload.website,
      createdBy: session.userId,
    });

    const { data: orgRow } = await admin
      .from("orgs")
      .select(ORG_SELECT_FIELDS)
      .eq("id", session.org.id)
      .single();

    const response = NextResponse.json({
      data: {
        ok: true,
        org: orgRow,
        enrichment: summarizeEnrichmentForClient(enrichResult),
      },
    });
    setActiveOrgCookie(response, session.org.id);
    return response;
  }

  if (payload.forceSync) {
    const { data: orgRow, error: readError } = await admin
      .from("orgs")
      .select(ORG_SELECT_FIELDS)
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
    .select(ORG_SELECT_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const websiteValue = (data.website ?? "").trim();
  let enrichmentForClient: ReturnType<typeof summarizeEnrichmentForClient> | undefined;
  let finalOrgRow: typeof data = data;

  // When the client explicitly asks for synchronous enrichment (the website
  // onboarding step), wait for results and return them so the UI can show an
  // editable draft. Otherwise keep the legacy fire-and-forget behavior so
  // routine settings saves do not block on the LLM.
  if (websiteValue && payload.enrichFromWebsite) {
    const enrichResult = await enrichOrgWebsite({
      orgId: session.org.id,
      website: websiteValue,
      createdBy: session.userId,
    });
    enrichmentForClient = summarizeEnrichmentForClient(enrichResult);

    const { data: refreshed } = await admin
      .from("orgs")
      .select(ORG_SELECT_FIELDS)
      .eq("id", session.org.id)
      .single();
    if (refreshed) {
      finalOrgRow = refreshed;
    }
  } else if (websiteValue) {
    enrichOrgWebsite({
      orgId: session.org.id,
      website: websiteValue,
      createdBy: session.userId,
    }).catch(() => null);
  }

  // Org context sync touches every agent's workspace and used to block this
  // PATCH for tens of seconds on cold gateways, which made the onboarding
  // "Save and continue" button feel stuck. Fire and forget so the user can
  // move forward immediately. The next workspace render's repair path will
  // reapply the latest org context to the agent we just opened, so the
  // ux-visible result still converges quickly.
  void runOrgContextSync({
    orgId: session.org.id,
    org: {
      name: finalOrgRow.name,
      website: finalOrgRow.website,
      companySummary: finalOrgRow.company_summary,
      agentBrief: finalOrgRow.agent_brief,
    },
  });

  const response = NextResponse.json({
    data: {
      org: finalOrgRow,
      sync: {
        status: "queued" as const,
        message:
          "Company context will be synced to existing agents in the background; new agents pick it up automatically.",
      },
      ...(enrichmentForClient ? { enrichment: enrichmentForClient } : {}),
    },
  });
  setActiveOrgCookie(response, session.org.id);
  return response;
}
