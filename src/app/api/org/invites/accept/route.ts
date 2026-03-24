import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { acceptOrgInvite } from "@/lib/invites";

const acceptInviteSchema = z.object({
  token: z.string().min(10),
});

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const parsed = acceptInviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid invite token." } },
      { status: 400 },
    );
  }

  try {
    const invite = await acceptOrgInvite({
      token: parsed.data.token,
      userId: session.userId,
      email: session.email ?? null,
    });
    return NextResponse.json({ data: invite });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Unable to accept invite." } },
      { status: 400 },
    );
  }
}
