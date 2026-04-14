import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingParticipantByInviteForAuthUser,
  getTrainingModulesForProgramme,
  recordTrainingParticipantProgress,
} from "@/lib/training-dal";

const progressEventSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  eventType: z.enum([
    "slide_viewed",
    "slide_completed",
    "lab_launched",
    "lab_completed",
    "assessment_started",
    "assessment_submitted",
    "module_completed",
  ]),
  progressPercent: z.number().min(0).max(100).optional().nullable(),
  contentItemId: z.string().trim().min(1).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json({ error: { message: "Participant session not found." } }, { status: 401 });
  }

  const parsed = progressEventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid progress payload." } },
      { status: 400 },
    );
  }

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode: parsed.data.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  if (!session?.cohort) {
    return NextResponse.json({ error: { message: "Participant session is no longer valid." } }, { status: 401 });
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === parsed.data.moduleSlug);
  if (!trainingModule) {
    return NextResponse.json({ error: { message: "Training module not found for this participant." } }, { status: 404 });
  }

  const recorded = await recordTrainingParticipantProgress({
    participantId: session.participant.id,
    cohortId: session.cohort.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    enrollments: session.enrollments,
    moduleId: trainingModule.id,
    eventType: parsed.data.eventType,
    contentItemId: parsed.data.contentItemId ?? null,
    progressPercent: parsed.data.progressPercent ?? null,
    metadata: parsed.data.metadata ?? {},
  });

  if (!recorded) {
    return NextResponse.json({ error: { message: "Unable to record training progress." } }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
