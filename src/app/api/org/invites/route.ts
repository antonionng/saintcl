import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getOrgMembers, getTeams } from "@/lib/dal";
import { createAndSendOrgInvite, listOrgInvites } from "@/lib/invites";
import { getPlanSeatPriceCents } from "@/lib/plans";

const createInviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["owner", "admin", "member", "employee"]),
  teamId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin billing access required." } }, { status: 403 });
  }

  const [invites, members, teams] = await Promise.all([
    listOrgInvites(session.org.id),
    getOrgMembers(session.org.id),
    getTeams(session.org.id),
  ]);

  return NextResponse.json({
    data: {
      invites,
      members,
      teams,
      seatPriceCents: getPlanSeatPriceCents(session.org.plan) ?? 0,
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin billing access required." } }, { status: 403 });
  }

  const parsed = createInviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid invite payload." } },
      { status: 400 },
    );
  }

  try {
    const invite = await createAndSendOrgInvite({
      orgId: session.org.id,
      orgName: session.org.name,
      orgLogoUrl: null,
      orgWebsite: session.org.website ?? null,
      inviterName: session.email ?? session.org.name,
      invitedByUserId: session.userId,
      email: parsed.data.email,
      role: parsed.data.role,
      teamId: parsed.data.teamId ?? null,
      seatPriceCents: getPlanSeatPriceCents(session.org.plan) ?? 0,
    });

    return NextResponse.json({ data: invite });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Unable to send invite." } },
      { status: 400 },
    );
  }
}
