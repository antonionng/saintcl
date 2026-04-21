import { NextResponse } from "next/server";
import { z } from "zod";

import {
  blueprintToStoredQuestion,
  gradeAssessmentResponse,
  type StoredQuestionShape,
} from "@/lib/training-assessment-grader";
import { createClient } from "@/lib/supabase/server";
import {
  finalizeAssessmentAttempt,
  getAssessmentAttemptsForParticipant,
  getAssessmentBySlug,
  getAssessmentResponsesForAttempt,
  getAssessmentsForModule,
  getCompletedLabSnapshotForParticipant,
  getTrainingModulesForProgramme,
  getTrainingParticipantByCheckInToken,
  getTrainingParticipantByInviteForAuthUser,
  issueCertificateIfEligible,
  recordTrainingParticipantProgress,
  startOrResumeAssessmentAttempt,
  upsertAssessmentResponse,
  type AssessmentAttemptRecord,
  type AssessmentQuestionRecord,
  type AssessmentRecord,
} from "@/lib/training-dal";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";

type ResolvedSession = NonNullable<Awaited<ReturnType<typeof getTrainingParticipantByCheckInToken>>>;

async function resolveParticipantSession(inviteCode: string): Promise<ResolvedSession | null> {
  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieSession = checkInToken ? await getTrainingParticipantByCheckInToken(checkInToken) : null;
  if (cookieSession?.cohort && cookieSession.cohort.inviteCode === inviteCode) {
    return cookieSession;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user?.id) return null;

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  return session ?? null;
}

function publicQuestion(question: AssessmentQuestionRecord) {
  return {
    id: question.id,
    slug: question.slug,
    prompt: question.prompt,
    questionType: question.questionType,
    sequence: question.sequence,
    points: question.points,
    options: question.options,
    rubric: question.rubric,
  };
}

function publicAssessment(assessment: AssessmentRecord) {
  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    description: assessment.description,
    kind: assessment.kind,
    sequence: assessment.sequence,
    estimatedMinutes: assessment.estimatedMinutes,
    passingScore: assessment.passingScore,
    maxAttempts: assessment.maxAttempts,
    isRequired: assessment.isRequired,
    blocksModuleCompletion: assessment.blocksModuleCompletion,
    facilitatorReviewRequired: assessment.facilitatorReviewRequired,
  };
}

function publicAttempt(attempt: AssessmentAttemptRecord) {
  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    facilitatorReviewStatus: attempt.facilitatorReviewStatus,
    facilitatorFeedback: attempt.facilitatorFeedback,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
  };
}

const listSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listSchema.safeParse({
    inviteCode: url.searchParams.get("inviteCode") ?? "",
    moduleSlug: url.searchParams.get("moduleSlug") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid query." } },
      { status: 400 },
    );
  }

  const session = await resolveParticipantSession(parsed.data.inviteCode);
  if (!session?.cohort) {
    return NextResponse.json({ error: { message: "Participant session is not active." } }, { status: 401 });
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === parsed.data.moduleSlug);
  if (!trainingModule) {
    return NextResponse.json({ error: { message: "Module not found." } }, { status: 404 });
  }

  const { assessments, questionsByAssessmentId } = await getAssessmentsForModule(trainingModule.id);
  const attempts = await getAssessmentAttemptsForParticipant({ participantId: session.participant.id });
  const attemptsByAssessmentId = new Map<string, AssessmentAttemptRecord[]>();
  for (const attempt of attempts) {
    const list = attemptsByAssessmentId.get(attempt.assessmentId) ?? [];
    list.push(attempt);
    attemptsByAssessmentId.set(attempt.assessmentId, list);
  }

  const data = assessments.map((assessment) => {
    const questions = (questionsByAssessmentId[assessment.id] ?? []).map(publicQuestion);
    const assessmentAttempts = (attemptsByAssessmentId.get(assessment.id) ?? []).map(publicAttempt);
    const latestPassed = assessmentAttempts.find((attempt) => attempt.passed === true);
    return {
      ...publicAssessment(assessment),
      questions,
      attempts: assessmentAttempts,
      hasPassed: Boolean(latestPassed),
    };
  });

  return NextResponse.json({ data });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    inviteCode: z.string().trim().min(2).max(120),
    moduleSlug: z.string().trim().min(2).max(120),
    assessmentSlug: z.string().trim().min(2).max(120),
  }),
  z.object({
    action: z.literal("save"),
    inviteCode: z.string().trim().min(2).max(120),
    moduleSlug: z.string().trim().min(2).max(120),
    attemptId: z.string().uuid(),
    questionId: z.string().uuid(),
    response: z.record(z.string(), z.unknown()),
  }),
  z.object({
    action: z.literal("submit"),
    inviteCode: z.string().trim().min(2).max(120),
    moduleSlug: z.string().trim().min(2).max(120),
    attemptId: z.string().uuid(),
  }),
]);

export async function POST(request: Request) {
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid payload." } },
      { status: 400 },
    );
  }

  const session = await resolveParticipantSession(parsed.data.inviteCode);
  if (!session?.cohort) {
    return NextResponse.json({ error: { message: "Participant session is not active." } }, { status: 401 });
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === parsed.data.moduleSlug);
  if (!trainingModule) {
    return NextResponse.json({ error: { message: "Module not found." } }, { status: 404 });
  }

  if (parsed.data.action === "start") {
    const lookup = await getAssessmentBySlug({
      moduleId: trainingModule.id,
      slug: parsed.data.assessmentSlug,
    });
    if (!lookup) {
      return NextResponse.json({ error: { message: "Assessment not found." } }, { status: 404 });
    }

    const enrollmentId = session.enrollments.find((enrollment) => enrollment.moduleId === trainingModule.id)?.id ?? null;

    const attempt = await startOrResumeAssessmentAttempt({
      assessment: lookup.assessment,
      cohortId: session.cohort.id,
      participantId: session.participant.id,
      enrollmentId,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    });

    if (!attempt) {
      return NextResponse.json(
        { error: { message: "Maximum attempts reached for this assessment." } },
        { status: 409 },
      );
    }

    await recordTrainingParticipantProgress({
      participantId: session.participant.id,
      cohortId: session.cohort.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      enrollments: session.enrollments,
      moduleId: trainingModule.id,
      eventType: "assessment_started",
      metadata: {
        assessmentId: lookup.assessment.id,
        assessmentSlug: lookup.assessment.slug,
        attemptId: attempt.id,
      },
    });

    const responses = await getAssessmentResponsesForAttempt(attempt.id);

    return NextResponse.json({
      data: {
        attempt: publicAttempt(attempt),
        assessment: publicAssessment(lookup.assessment),
        questions: lookup.questions.map(publicQuestion),
        savedResponses: responses.map((response) => ({
          questionId: response.questionId,
          response: response.response,
        })),
      },
    });
  }

  if (parsed.data.action === "save") {
    const payload = parsed.data;
    const attempts = await getAssessmentAttemptsForParticipant({ participantId: session.participant.id });
    const attempt = attempts.find((candidate) => candidate.id === payload.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: { message: "Attempt not found." } }, { status: 404 });
    }
    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: { message: "This attempt is no longer editable." } },
        { status: 409 },
      );
    }

    const saved = await upsertAssessmentResponse({
      attemptId: attempt.id,
      questionId: payload.questionId,
      response: payload.response,
      orgId: attempt.orgId,
    });

    if (!saved) {
      return NextResponse.json({ error: { message: "Unable to save response." } }, { status: 500 });
    }

    await recordTrainingParticipantProgress({
      participantId: session.participant.id,
      cohortId: session.cohort.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      enrollments: session.enrollments,
      moduleId: trainingModule.id,
      eventType: "assessment_response_saved",
      metadata: {
        attemptId: attempt.id,
        questionId: payload.questionId,
      },
    });

    return NextResponse.json({ data: { ok: true } });
  }

  const submitPayload = parsed.data;
  const attempts = await getAssessmentAttemptsForParticipant({ participantId: session.participant.id });
  const attempt = attempts.find((candidate) => candidate.id === submitPayload.attemptId);
  if (!attempt) {
    return NextResponse.json({ error: { message: "Attempt not found." } }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json(
      { error: { message: "This attempt has already been submitted." } },
      { status: 409 },
    );
  }

  const { assessments, questionsByAssessmentId } = await getAssessmentsForModule(trainingModule.id);
  const assessment = assessments.find((candidate) => candidate.id === attempt.assessmentId);
  const questions = assessment ? questionsByAssessmentId[assessment.id] ?? [] : [];
  if (!assessment || questions.length === 0) {
    return NextResponse.json({ error: { message: "Assessment configuration missing." } }, { status: 500 });
  }

  const completedLabs = await getCompletedLabSnapshotForParticipant({
    participantId: session.participant.id,
    moduleId: trainingModule.id,
  });

  const responses = await getAssessmentResponsesForAttempt(attempt.id);
  const responseByQuestionId = new Map(responses.map((response) => [response.questionId, response]));

  let totalAwarded = 0;
  let totalMax = 0;
  let anyNeedsReview = false;
  let allAutoCorrect = true;

  for (const question of questions) {
    const stored: StoredQuestionShape = {
      slug: question.slug,
      questionType: question.questionType,
      points: question.points,
      options: question.options,
      correctAnswer: question.correctAnswer,
      validators: question.validators as StoredQuestionShape["validators"],
    };

    const responseRecord = responseByQuestionId.get(question.id);
    const responsePayload = (responseRecord?.response ?? {}) as {
      selectedOptionId?: string | null;
      selectedOptionIds?: string[] | null;
      text?: string | null;
      code?: string | null;
      fileUrl?: string | null;
      taskCheckId?: string | null;
    };

    const grade = gradeAssessmentResponse({
      question: stored,
      response: responsePayload,
      completedLabs,
    });

    totalAwarded += grade.awardedPoints;
    totalMax += grade.maxPoints;
    if (grade.signal === "needs_review") {
      anyNeedsReview = true;
      allAutoCorrect = false;
    }
    if (grade.signal === "auto_incorrect") {
      allAutoCorrect = false;
    }

    await upsertAssessmentResponse({
      attemptId: attempt.id,
      questionId: question.id,
      response: responsePayload as Record<string, unknown>,
      isCorrect: grade.isCorrect,
      awardedPoints: grade.awardedPoints,
      autoGradeSummary: grade.summary as unknown as Record<string, unknown>,
      flaggedForReview: grade.requiresFacilitatorReview,
      orgId: attempt.orgId,
    });
  }

  const scorePercent = totalMax > 0 ? Number(((totalAwarded / totalMax) * 100).toFixed(2)) : 0;
  const passed = scorePercent >= assessment.passingScore && !anyNeedsReview;
  const finalStatus: AssessmentAttemptRecord["status"] = anyNeedsReview ? "submitted" : "graded";
  const reviewStatus: AssessmentAttemptRecord["facilitatorReviewStatus"] = anyNeedsReview ? "pending" : "not_required";

  const finalized = await finalizeAssessmentAttempt({
    attemptId: attempt.id,
    status: finalStatus,
    score: scorePercent,
    maxScore: 100,
    passed: anyNeedsReview ? null : passed,
    autoGraded: allAutoCorrect && !anyNeedsReview,
    facilitatorReviewStatus: reviewStatus,
    metadata: {
      totalAwarded,
      totalMax,
    },
  });

  await recordTrainingParticipantProgress({
    participantId: session.participant.id,
    cohortId: session.cohort.id,
    orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    enrollments: session.enrollments,
    moduleId: trainingModule.id,
    eventType: anyNeedsReview ? "assessment_submitted" : "assessment_graded",
    metadata: {
      assessmentId: assessment.id,
      assessmentSlug: assessment.slug,
      attemptId: attempt.id,
      score: scorePercent,
      passed: anyNeedsReview ? null : passed,
    },
  });

  let certificateIssued = false;
  if (!anyNeedsReview && passed && assessment.kind === "module_test") {
    const result = await issueCertificateIfEligible({
      participantId: session.participant.id,
      programmeId: session.cohort.programmeId,
      cohortId: session.cohort.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
    });
    if (result?.issuedNow) {
      certificateIssued = true;
      await recordTrainingParticipantProgress({
        participantId: session.participant.id,
        cohortId: session.cohort.id,
        orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
        enrollments: session.enrollments,
        moduleId: trainingModule.id,
        eventType: "certificate_issued",
        metadata: {
          certificateId: result.certificate?.id,
          serial: result.certificate?.serial,
        },
      });
    }
  }

  return NextResponse.json({
    data: {
      attempt: finalized ? publicAttempt(finalized) : publicAttempt(attempt),
      score: scorePercent,
      passed: anyNeedsReview ? null : passed,
      requiresFacilitatorReview: anyNeedsReview,
      certificateIssued,
    },
  });
}
