import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { provisionInvitedTrainingParticipants } from "@/lib/training-dal";

const provisionSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  participants: z
    .array(
      z.object({
        fullName: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(240),
        employeeId: z.string().trim().max(80).optional().nullable(),
      }),
    )
    .min(1)
    .max(200),
});

function buildMagicLink(inviteCode: string, token: string) {
  const base = env.appUrl.replace(/\/+$/, "");
  return `${base}/academy/${encodeURIComponent(inviteCode)}/launch?token=${encodeURIComponent(token)}`;
}

export async function POST(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.canManagePlatformTraining) {
    return NextResponse.json(
      { error: { message: "Platform training access required." } },
      { status: 403 },
    );
  }

  const parsed = provisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid provisioning payload." } },
      { status: 400 },
    );
  }

  const result = await provisionInvitedTrainingParticipants({
    inviteCode: parsed.data.inviteCode,
    participants: parsed.data.participants,
  });

  if (!result.ok) {
    const status = result.reason === "invite_not_found" ? 404 : 500;
    const message =
      result.reason === "invite_not_found"
        ? "Invite code not recognised."
        : result.message ?? "Failed to provision participants.";
    return NextResponse.json({ error: { message } }, { status });
  }

  return NextResponse.json({
    data: {
      cohort: result.cohort,
      participants: result.participants.map((entry) => ({
        participant: entry.participant,
        checkInToken: entry.checkInToken,
        created: entry.created,
        magicLink: buildMagicLink(parsed.data.inviteCode, entry.checkInToken),
      })),
    },
  });
}
