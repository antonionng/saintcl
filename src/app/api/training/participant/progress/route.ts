import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingParticipantByInviteForAuthUser,
  getTrainingModulesForProgramme,
  recordTrainingParticipantProgress,
} from "@/lib/training-dal";
import { publishParticipantPosition } from "@/lib/training-realtime";

// In-memory dedupe for slide_viewed events: skip persisting the same
// (participant, module, slide) within a short window so deck panels that fire
// on every slide tick stop hammering the database. Realtime broadcast still
// fires every time so the facilitator cockpit drift strip stays live.
const SLIDE_DEDUPE_WINDOW_MS = 2_000;
const SLIDE_DEDUPE_MAX_ENTRIES = 10_000;
const slideDedupeCache = new Map<string, number>();

function shouldDedupeSlideEvent(key: string): boolean {
  const now = Date.now();
  const last = slideDedupeCache.get(key);
  if (typeof last === "number" && now - last < SLIDE_DEDUPE_WINDOW_MS) {
    return true;
  }
  slideDedupeCache.set(key, now);
  if (slideDedupeCache.size > SLIDE_DEDUPE_MAX_ENTRIES) {
    // Drop oldest ~10% to keep the map bounded.
    const toDelete = Math.floor(SLIDE_DEDUPE_MAX_ENTRIES * 0.1);
    let removed = 0;
    for (const cacheKey of slideDedupeCache.keys()) {
      slideDedupeCache.delete(cacheKey);
      removed += 1;
      if (removed >= toDelete) break;
    }
  }
  return false;
}

const progressEventSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  eventType: z.enum([
    "slide_viewed",
    "slide_completed",
    "lab_launched",
    "lab_completed",
    "assessment_started",
    "assessment_response_saved",
    "assessment_submitted",
    "assessment_graded",
    "module_completed",
    "certificate_issued",
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

  const metadata = parsed.data.metadata ?? {};
  const slideIndex =
    typeof metadata.slideIndex === "number"
      ? (metadata.slideIndex as number)
      : null;
  const slideId =
    typeof metadata.slideId === "string" ? (metadata.slideId as string) : null;

  const isSlideEvent =
    parsed.data.eventType === "slide_viewed" || parsed.data.eventType === "slide_completed";

  // Skip the database write for chatty slide_viewed events when the same
  // participant/module/slide just landed within the dedupe window.
  let recordedOk = true;
  const dedupeKey = isSlideEvent
    ? `${session.participant.id}:${trainingModule.id}:${slideId ?? slideIndex ?? "?"}:${parsed.data.eventType}`
    : null;
  const skipPersist =
    parsed.data.eventType === "slide_viewed" && dedupeKey !== null && shouldDedupeSlideEvent(dedupeKey);

  if (!skipPersist) {
    const recorded = await recordTrainingParticipantProgress({
      participantId: session.participant.id,
      cohortId: session.cohort.id,
      orgId: session.participant.orgId ?? session.cohort.orgId ?? null,
      enrollments: session.enrollments,
      moduleId: trainingModule.id,
      eventType: parsed.data.eventType,
      contentItemId: parsed.data.contentItemId ?? null,
      progressPercent: parsed.data.progressPercent ?? null,
      metadata,
    });
    recordedOk = Boolean(recorded);
  }

  if (!recordedOk) {
    return NextResponse.json({ error: { message: "Unable to record training progress." } }, { status: 500 });
  }

  // Broadcast slide-position updates so the facilitator cockpit drift strip
  // updates without waiting for the fallback poll. Always fires (even on
  // dedupe-skipped writes) so the cockpit stays smooth.
  if (isSlideEvent && typeof slideIndex === "number") {
    void publishParticipantPosition({
      cohortId: session.cohort.id,
      moduleId: trainingModule.id,
      position: {
        participantId: session.participant.id,
        slideId,
        slideIndex,
        progressPercent: parsed.data.progressPercent ?? null,
        occurredAt: new Date().toISOString(),
      },
    });
  }

  return NextResponse.json({ data: { ok: true, deduped: skipPersist } });
}
