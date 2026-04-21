import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import {
  issueCertificateIfEligible,
  recordFacilitatorAssessmentReview,
} from "@/lib/training-dal";
import { createAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  attemptId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(4000).optional().nullable(),
  scoreOverride: z.number().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid review payload." } },
      { status: 400 },
    );
  }

  const updated = await recordFacilitatorAssessmentReview({
    attemptId: parsed.data.attemptId,
    facilitatorUserId: session.userId,
    decision: parsed.data.decision,
    feedback: parsed.data.feedback ?? null,
    scoreOverride: parsed.data.scoreOverride ?? null,
    passed: parsed.data.passed ?? null,
  });

  if (!updated) {
    return NextResponse.json({ error: { message: "Unable to record review." } }, { status: 500 });
  }

  let certificateIssued = false;
  if (parsed.data.decision === "approved" && updated.passed === true) {
    const admin = createAdminClient();
    if (admin) {
      const { data: assessmentRow } = await admin
        .from("training_assessments")
        .select("kind, programme_id")
        .eq("id", updated.assessmentId)
        .maybeSingle();
      const assessment = assessmentRow as { kind: string; programme_id: string } | null;
      if (assessment?.kind === "module_test") {
        const result = await issueCertificateIfEligible({
          participantId: updated.participantId,
          programmeId: assessment.programme_id,
          cohortId: updated.cohortId,
          orgId: updated.orgId,
        });
        certificateIssued = Boolean(result?.issuedNow);
      }
    }
  }

  return NextResponse.json({ data: { attempt: updated, certificateIssued } });
}
