import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  TRAINING_PARTICIPANT_COOKIE_MAX_AGE,
  TRAINING_PARTICIPANT_COOKIE_NAME,
} from "@/lib/training-participant-session";
import { claimTrainingParticipantAccess } from "@/lib/training-dal";

const participantCheckInSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  employeeId: z.string().trim().max(80).optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: { message: "Sign in with your Saint account first." } }, { status: 401 });
  }

  const parsed = participantCheckInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid participant payload." } },
      { status: 400 },
    );
  }

  const result = await claimTrainingParticipantAccess({
    inviteCode: parsed.data.inviteCode,
    authUserId: user.id,
    fullName: parsed.data.fullName,
    email: user.email,
    employeeId: parsed.data.employeeId ?? null,
  });

  if (!result.ok) {
    const message =
      result.reason === "already_linked"
        ? "This cohort seat is already linked to another Saint account."
        : result.reason === "account_exists"
          ? "An account already exists for this learner in the cohort."
          : result.reason === "write_failed"
            ? "We could not save your enrolment right now. Please try again."
            : "Invite code not found or participant could not be checked in.";
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
