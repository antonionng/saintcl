import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilitatorAssessmentReviewList } from "@/components/training/facilitator-assessment-review-list";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import {
  getAssessmentResponsesForAttempt,
  getTrainingCohortSnapshots,
  listAssessmentAttemptsPendingReview,
} from "@/lib/training-dal";
import { createAdminClient } from "@/lib/supabase/admin";

type ParticipantLite = {
  id: string;
  fullName: string;
  email: string;
};

type AssessmentLite = {
  id: string;
  slug: string;
  title: string;
  kind: "activity" | "homework" | "quiz" | "module_test";
  passingScore: number;
};

type CohortLite = {
  id: string;
  name: string;
  inviteCode: string | null | undefined;
};

type ModuleLite = {
  id: string;
  slug: string;
  title: string;
};

type QuestionLite = {
  id: string;
  prompt: string;
  questionType: string;
  points: number;
};

export default async function FacilitatorAssessmentsPage() {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.canManagePlatformTraining) {
    redirect("/dashboard");
  }

  const [pending, cohortSnapshots] = await Promise.all([
    listAssessmentAttemptsPendingReview(),
    getTrainingCohortSnapshots(),
  ]);

  const admin = createAdminClient();

  const cohortById = new Map<string, CohortLite>();
  const participantById = new Map<string, ParticipantLite>();
  for (const snapshot of cohortSnapshots) {
    cohortById.set(snapshot.cohort.id, {
      id: snapshot.cohort.id,
      name: snapshot.cohort.name,
      inviteCode: snapshot.cohort.inviteCode,
    });
    for (const participant of snapshot.participants) {
      participantById.set(participant.id, {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
      });
    }
  }

  const assessmentById = new Map<string, AssessmentLite & { moduleId: string }>();
  const moduleById = new Map<string, ModuleLite>();
  const questionsByAssessmentId = new Map<string, QuestionLite[]>();
  const responsesByAttemptId = new Map<
    string,
    Array<{ questionId: string; response: Record<string, unknown>; awardedPoints: number | null }>
  >();

  if (admin && pending.length > 0) {
    const assessmentIds = Array.from(new Set(pending.map((attempt) => attempt.assessmentId)));
    const { data: assessmentRows } = await admin
      .from("training_assessments")
      .select("id, slug, title, kind, passing_score, module_id")
      .in("id", assessmentIds);
    for (const row of (assessmentRows ?? []) as Array<{
      id: string;
      slug: string;
      title: string;
      kind: AssessmentLite["kind"];
      passing_score: number;
      module_id: string;
    }>) {
      assessmentById.set(row.id, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        kind: row.kind,
        passingScore: Number(row.passing_score),
        moduleId: row.module_id,
      });
    }

    const moduleIds = Array.from(new Set(Array.from(assessmentById.values()).map((value) => value.moduleId)));
    if (moduleIds.length > 0) {
      const { data: moduleRows } = await admin
        .from("training_modules")
        .select("id, slug, title")
        .in("id", moduleIds);
      for (const row of (moduleRows ?? []) as Array<{ id: string; slug: string; title: string }>) {
        moduleById.set(row.id, { id: row.id, slug: row.slug, title: row.title });
      }
    }

    const { data: questionRows } = await admin
      .from("training_assessment_questions")
      .select("id, assessment_id, prompt, question_type, points")
      .in("assessment_id", assessmentIds)
      .order("sequence", { ascending: true });
    for (const row of (questionRows ?? []) as Array<{
      id: string;
      assessment_id: string;
      prompt: string;
      question_type: string;
      points: number;
    }>) {
      const list = questionsByAssessmentId.get(row.assessment_id) ?? [];
      list.push({ id: row.id, prompt: row.prompt, questionType: row.question_type, points: Number(row.points) });
      questionsByAssessmentId.set(row.assessment_id, list);
    }

    for (const attempt of pending) {
      const responses = await getAssessmentResponsesForAttempt(attempt.id);
      responsesByAttemptId.set(
        attempt.id,
        responses.map((response) => ({
          questionId: response.questionId,
          response: response.response,
          awardedPoints: response.awardedPoints,
        })),
      );
    }
  }

  const enrichedPending = pending.map((attempt) => {
    const assessment = assessmentById.get(attempt.assessmentId);
    const cohort = cohortById.get(attempt.cohortId);
    const participant = participantById.get(attempt.participantId);
    const trainingModule = assessment ? moduleById.get(assessment.moduleId) : null;
    const questions = assessment ? questionsByAssessmentId.get(assessment.id) ?? [] : [];
    const responses = responsesByAttemptId.get(attempt.id) ?? [];
    return {
      attempt,
      assessment,
      cohort,
      participant,
      module: trainingModule,
      questions,
      responses,
    };
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Facilitator</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Assessment review queue</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Review submissions awaiting facilitator sign-off across active cohorts. Auto-graded portions are already scored.
            </p>
          </div>
          <Link
            href="/facilitator"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            Back to hub
          </Link>
        </div>

        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Pending facilitator review</CardTitle>
            <CardDescription>{pending.length} attempt{pending.length === 1 ? "" : "s"} awaiting review.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedPending.length === 0 ? (
              <p className="text-sm text-zinc-400">Nothing pending. New submissions will appear here automatically.</p>
            ) : (
              <FacilitatorAssessmentReviewList items={enrichedPending} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
