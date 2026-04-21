import { NextResponse } from "next/server";

import {
  TRAINING_PARTICIPANT_COOKIE_MAX_AGE,
  TRAINING_PARTICIPANT_COOKIE_NAME,
} from "@/lib/training-participant-session";
import { getTrainingParticipantByCheckInToken } from "@/lib/training-dal";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> },
) {
  const { inviteCode } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const academyUrl = new URL(`/academy/${inviteCode}`, url);

  if (!token) {
    return NextResponse.redirect(academyUrl);
  }

  const session = await getTrainingParticipantByCheckInToken(token);
  if (!session?.cohort || session.cohort.inviteCode !== inviteCode) {
    return NextResponse.redirect(academyUrl);
  }

  const response = NextResponse.redirect(academyUrl);
  response.cookies.set(TRAINING_PARTICIPANT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRAINING_PARTICIPANT_COOKIE_MAX_AGE,
  });
  return response;
}
