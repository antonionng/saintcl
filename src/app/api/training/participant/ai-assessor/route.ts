import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingParticipantByInviteForAuthUser,
  getTrainingModulesForProgramme,
} from "@/lib/training-dal";
import {
  persistTrainingAiAssessment,
  runTrainingAiAssessor,
  type AiAssessmentRuleSignal,
} from "@/lib/training-ai-assessor";

const ruleSignalSchema = z.object({
  taskId: z.string().max(200).nullable().optional(),
  taskTitle: z.string().max(400).nullable().optional(),
  state: z.enum(["passed", "retry_needed", "guided_complete", "not_started"]),
  message: z.string().max(1000).nullable().optional(),
});

const requestSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  submissionId: z.string().trim().min(1).max(200),
  scope: z.string().trim().max(80).optional(),
  scopeId: z.string().trim().max(200).optional().nullable(),
  checkpoint: z
    .object({
      slug: z.string().max(200),
      title: z.string().max(400),
      description: z.string().max(2000).optional().nullable(),
      facilitatorPrompt: z.string().max(2000).optional().nullable(),
    })
    .optional()
    .nullable(),
  task: z
    .object({
      id: z.string().max(200).nullable().optional(),
      title: z.string().max(400).nullable().optional(),
      successCriteria: z
        .union([z.string().max(2000), z.array(z.string().max(800))])
        .nullable()
        .optional(),
      rubric: z
        .union([z.string().max(2000), z.array(z.string().max(800))])
        .nullable()
        .optional(),
      notebookSlug: z.string().max(200).nullable().optional(),
    })
    .optional()
    .nullable(),
  ruleSignals: z.array(ruleSignalSchema).max(50).optional(),
  code: z.string().max(20000).nullable().optional(),
  stdout: z.string().max(8000).nullable().optional(),
  stderr: z.string().max(8000).nullable().optional(),
  outputFiles: z.array(z.string().max(400)).max(50).optional(),
  datasetName: z.string().max(300).nullable().optional(),
  artifactUrl: z.string().max(2000).nullable().optional(),
  summary: z.string().max(1500).nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return NextResponse.json(
      { error: { message: "Participant session not found." } },
      { status: 401 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid assessor payload.",
        },
      },
      { status: 400 },
    );
  }

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode: parsed.data.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  if (!session?.cohort) {
    return NextResponse.json(
      { error: { message: "Participant session is no longer valid." } },
      { status: 401 },
    );
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find(
    (candidate) => candidate.slug === parsed.data.moduleSlug,
  );
  if (!trainingModule) {
    return NextResponse.json(
      { error: { message: "Training module not found for this participant." } },
      { status: 404 },
    );
  }

  const ruleSignals: AiAssessmentRuleSignal[] = (parsed.data.ruleSignals ?? []).map(
    (signal) => ({
      taskId: signal.taskId ?? null,
      taskTitle: signal.taskTitle ?? null,
      state: signal.state,
      message: signal.message ?? null,
    }),
  );

  const outcome = await runTrainingAiAssessor({
    submissionId: parsed.data.submissionId,
    participantId: session.participant.id,
    moduleId: trainingModule.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
    checkpoint: parsed.data.checkpoint ?? null,
    task: parsed.data.task ?? null,
    ruleSignals,
    code: parsed.data.code ?? null,
    stdout: parsed.data.stdout ?? null,
    stderr: parsed.data.stderr ?? null,
    outputFiles: parsed.data.outputFiles ?? [],
    datasetName: parsed.data.datasetName ?? null,
    artifactUrl: parsed.data.artifactUrl ?? null,
    summary: parsed.data.summary ?? null,
  });

  await persistTrainingAiAssessment({
    submissionId: parsed.data.submissionId,
    participantId: session.participant.id,
    moduleId: trainingModule.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    taskId: parsed.data.task?.id ?? null,
    checkpointSlug: parsed.data.checkpoint?.slug ?? parsed.data.scopeId ?? null,
    outcome,
  });

  return NextResponse.json({
    data: {
      submissionId: parsed.data.submissionId,
      scoreBand: outcome.scoreBand,
      criterionScores: outcome.criterionScores,
      summary: outcome.summary,
      suggestedNextStep: outcome.suggestedNextStep,
      ruleSignals: outcome.ruleSignals,
      model: outcome.model,
      status: outcome.status,
    },
  });
}
