import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createTrainingCohortPost,
  getTrainingCohortByInviteCode,
  getTrainingParticipantByCheckInToken,
  listTrainingCohortFeed,
} from "@/lib/training-dal";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";

const inviteSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
});

const postSchema = inviteSchema.extend({
  body: z.string().trim().min(1).max(2000),
});

type ResolvedParticipant =
  | { ok: true; participant: NonNullable<Awaited<ReturnType<typeof getTrainingParticipantByCheckInToken>>>["participant"]; cohort: NonNullable<Awaited<ReturnType<typeof getTrainingCohortByInviteCode>>> }
  | { ok: false; message: string; status: number };

async function resolveParticipantForInvite(inviteCode: string): Promise<ResolvedParticipant> {
  const checkInToken = await getTrainingParticipantCheckInToken();
  if (!checkInToken) {
    return { ok: false, message: "Open your invite link to refresh your participant session.", status: 401 };
  }

  const session = await getTrainingParticipantByCheckInToken(checkInToken);
  if (!session?.participant || !session.cohort) {
    return { ok: false, message: "Participant session not found. Open your invite link again.", status: 401 };
  }

  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  if (!cohort) {
    return { ok: false, message: "Cohort not found for this invite link.", status: 404 };
  }

  if (session.cohort.id !== cohort.id) {
    return { ok: false, message: "This invite link is for a different cohort than your current session.", status: 403 };
  }

  return { ok: true, participant: session.participant, cohort };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = inviteSchema.safeParse({ inviteCode: url.searchParams.get("inviteCode") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invite code is required." } },
      { status: 400 },
    );
  }

  const resolved = await resolveParticipantForInvite(parsed.data.inviteCode);
  if (!resolved.ok) {
    return NextResponse.json({ error: { message: resolved.message } }, { status: resolved.status });
  }

  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 50;

  const posts = await listTrainingCohortFeed({ cohortId: resolved.cohort.id, limit });

  return NextResponse.json({
    data: {
      cohortId: resolved.cohort.id,
      currentParticipantId: resolved.participant.id,
      posts,
    },
  });
}

export async function POST(request: Request) {
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid post payload." } },
      { status: 400 },
    );
  }

  const resolved = await resolveParticipantForInvite(parsed.data.inviteCode);
  if (!resolved.ok) {
    return NextResponse.json({ error: { message: resolved.message } }, { status: resolved.status });
  }

  const post = await createTrainingCohortPost({
    cohortId: resolved.cohort.id,
    participantId: resolved.participant.id,
    body: parsed.data.body,
    orgId: resolved.cohort.orgId,
  });

  if (!post) {
    return NextResponse.json(
      { error: { message: "We could not save your post right now. Please try again." } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { post } });
}
