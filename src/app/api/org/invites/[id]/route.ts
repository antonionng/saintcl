import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { revokeOrgInvite } from "@/lib/invites";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin billing access required." } }, { status: 403 });
  }

  try {
    const invite = await revokeOrgInvite({
      orgId: session.org.id,
      inviteId: (await params).id,
      userId: session.userId,
    });
    return NextResponse.json({ data: invite });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Unable to revoke invite." } },
      { status: 400 },
    );
  }
}
