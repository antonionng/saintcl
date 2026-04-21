import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingParticipantByInviteForAuthUser,
  getTrainingModulesForProgramme,
  getTrainingSubmissionsForParticipant,
  recordTrainingParticipantProgress,
  submitTrainingParticipantWork,
} from "@/lib/training-dal";
import {
  aiAssessorInputFromSubmission,
  persistTrainingAiAssessment,
  runTrainingAiAssessor,
} from "@/lib/training-ai-assessor";

const scopeSchema = z.enum([
  "module",
  "checkpoint",
  "task",
  "assessment_question",
  "notebook",
]);

const kindSchema = z.enum([
  "notebook_snapshot",
  "artifact_link",
  "file_upload",
  "workbench_state",
  "prompt_variant",
  "model_card",
  "chart_spec",
  "flow_design",
  "strategy_canvas",
]);

const submissionSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  contentItemId: z.string().trim().min(1).optional().nullable(),
  summary: z.string().trim().max(500).optional().nullable(),
  artifactUrl: z.string().trim().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  scope: scopeSchema.optional(),
  scopeId: z.string().trim().max(200).optional().nullable(),
  kind: kindSchema.optional().nullable(),
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
    scope: parsed.data.scope ?? "module",
    scopeId: parsed.data.scopeId ?? null,
    kind: parsed.data.kind ?? null,
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
      scope: submission.scope,
      scopeId: submission.scopeId,
      kind: submission.kind,
      source: "training-browser-lab",
    },
  });

  let assessment: Awaited<ReturnType<typeof runTrainingAiAssessor>> | null = null;
  try {
    const assessorInput = aiAssessorInputFromSubmission({
      submissionId: submission.id,
      participantId: session.participant.id,
      moduleId: trainingModule.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      scope: parsed.data.scope ?? "module",
      scopeId: parsed.data.scopeId ?? null,
      metadata: parsed.data.metadata,
      inviteCode: parsed.data.inviteCode,
      moduleSlug: parsed.data.moduleSlug,
      artifactUrl: parsed.data.artifactUrl ?? null,
      summary: parsed.data.summary ?? null,
    });
    assessment = await runTrainingAiAssessor(assessorInput);
    await persistTrainingAiAssessment({
      submissionId: submission.id,
      participantId: session.participant.id,
      moduleId: trainingModule.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      taskId: assessorInput.task?.id ?? null,
      checkpointSlug:
        assessorInput.checkpoint?.slug ?? parsed.data.scopeId ?? null,
      outcome: assessment,
    });
  } catch {
    // Assessor failures must never block the submission write itself.
    assessment = null;
  }

  return NextResponse.json({
    data: submission,
    assessment: assessment
      ? {
          scoreBand: assessment.scoreBand,
          criterionScores: assessment.criterionScores,
          summary: assessment.summary,
          suggestedNextStep: assessment.suggestedNextStep,
          ruleSignals: assessment.ruleSignals,
          model: assessment.model,
          status: assessment.status,
        }
      : null,
  });
}

const listQuerySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  scope: scopeSchema.optional(),
  scopeId: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json({ error: { message: "Participant session not found." } }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    inviteCode: url.searchParams.get("inviteCode") ?? "",
    moduleSlug: url.searchParams.get("moduleSlug") ?? "",
    scope: url.searchParams.get("scope") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid query." } },
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

  const submissions = await getTrainingSubmissionsForParticipant({
    participantId: session.participant.id,
    moduleId: trainingModule.id,
    scope: parsed.data.scope,
    scopeId: parsed.data.scopeId ?? null,
    limit: parsed.data.limit ?? 100,
  });

  return NextResponse.json({ data: submissions });
}
