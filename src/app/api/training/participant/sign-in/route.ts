import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  TRAINING_PARTICIPANT_COOKIE_MAX_AGE,
  TRAINING_PARTICIPANT_COOKIE_NAME,
} from "@/lib/training-participant-session";
import { resumeTrainingParticipantSession } from "@/lib/training-dal";

const participantSignInSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json({ error: { message: "Sign in with your Saint account first." } }, { status: 401 });
  }

  const parsed = participantSignInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid participant sign-in payload." } },
      { status: 400 },
    );
  }

  const result = await resumeTrainingParticipantSession({
    inviteCode: parsed.data.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });

  if (!result.ok) {
    const message =
      result.reason === "participant_not_found"
        ? "No training access was found for this signed-in account. Join the cohort first."
        : result.reason === "already_linked"
          ? "This cohort seat is already linked to another Saint account."
          : result.reason === "write_failed"
            ? "We could not restore your learning access right now. Please try again."
          : "This participant sign-in link is not active yet.";
    const status = result.reason === "invite_not_found" ? 404 : result.reason === "write_failed" ? 500 : 409;

    return NextResponse.json({ error: { message } }, { status });
  }

  const response = NextResponse.json({
    data: {
      participant: result.participant,
      cohort: result.cohort,
      enrollments: result.enrollments,
      redirectTo: `/academy/${parsed.data.inviteCode}`,
    },
  });

  response.cookies.set(TRAINING_PARTICIPANT_COOKIE_NAME, result.checkInToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRAINING_PARTICIPANT_COOKIE_MAX_AGE,
  });

  return response;
}
