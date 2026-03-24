import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getCurrentUserProfile, loadCurrentUserProfile, upsertCurrentUserProfile } from "@/lib/dal";
import { syncProfileContextToAssignedAgents } from "@/lib/openclaw/profile-context";

const updateAccountSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  whatIDo: z.string().trim().max(160),
  agentBrief: z.string().trim().max(280),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ error: { message: "Account profile is unavailable." } }, { status: 503 });
  }

  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const parsed = updateAccountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid account profile payload." } },
      { status: 400 },
    );
  }

  const record = await upsertCurrentUserProfile(parsed.data);
  if (!record) {
    return NextResponse.json({ error: { message: "Unable to save account profile." } }, { status: 503 });
  }

  const profile = await loadCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ error: { message: "Unable to reload account profile." } }, { status: 500 });
  }

  await syncProfileContextToAssignedAgents({
    orgId: session.org.id,
    userId: session.userId,
    profile,
    org: {
      name: session.org.name,
      website: session.org.website,
      companySummary: session.org.company_summary,
      agentBrief: session.org.agent_brief,
    },
  }).catch(() => null);

  return NextResponse.json({ data: profile });
}
