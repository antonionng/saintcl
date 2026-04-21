import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getTrainingParticipantByCheckInToken,
  updateTrainingParticipantProfile,
} from "@/lib/training-dal";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";

const profileSchema = z.object({
  displayName: z.string().trim().max(80).nullable().optional(),
  roleAtCompany: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
});

export async function POST(request: Request) {
  const checkInToken = await getTrainingParticipantCheckInToken();
  if (!checkInToken) {
    return NextResponse.json(
      { error: { message: "Open your invite link to refresh your participant session." } },
      { status: 401 },
    );
  }

  const session = await getTrainingParticipantByCheckInToken(checkInToken);
  if (!session?.participant) {
    return NextResponse.json(
      { error: { message: "Participant session not found. Open your invite link again." } },
      { status: 401 },
    );
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid profile payload." } },
      { status: 400 },
    );
  }

  const updated = await updateTrainingParticipantProfile({
    participantId: session.participant.id,
    displayName: parsed.data.displayName,
    roleAtCompany: parsed.data.roleAtCompany,
    bio: parsed.data.bio,
  });

  if (!updated) {
    return NextResponse.json(
      { error: { message: "We could not save your profile right now. Please try again." } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      participant: updated,
    },
  });
}
