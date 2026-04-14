import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingParticipantByInviteForAuthUser,
  getTrainingModulesForProgramme,
  recordTrainingParticipantProgress,
  submitTrainingParticipantWork,
} from "@/lib/training-dal";

const submissionSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  contentItemId: z.string().trim().min(1).optional().nullable(),
  summary: z.string().trim().max(500).optional().nullable(),
  artifactUrl: z.string().trim().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json({ error: { message: "Participant session not found." } }, { status: 401 });
  }

  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid submission payload." } },
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

  const submission = await submitTrainingParticipantWork({
    participantId: session.participant.id,
    moduleId: trainingModule.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    contentItemId: parsed.data.contentItemId ?? null,
    summary: parsed.data.summary ?? null,
    artifactUrl: parsed.data.artifactUrl ?? null,
    metadata: parsed.data.metadata,
  });
  if (!submission) {
    return NextResponse.json({ error: { message: "Unable to save training submission." } }, { status: 500 });
  }

  await recordTrainingParticipantProgress({
    participantId: session.participant.id,
    cohortId: session.cohort.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    enrollments: session.enrollments,
    moduleId: trainingModule.id,
    eventType: "assessment_submitted",
    contentItemId: parsed.data.contentItemId ?? null,
    metadata: {
      submissionId: submission.id,
      source: "training-browser-lab",
    },
  });

  return NextResponse.json({ data: submission });
}
