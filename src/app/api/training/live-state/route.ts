import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { createClient } from "@/lib/supabase/server";
import {
  getTrainingLiveSessionByInvite,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantLabCheckpointProgressByInvite,
  getTrainingParticipantSlidePositions,
  upsertTrainingLiveSession,
} from "@/lib/training-dal";

const liveStateQuerySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
});

const liveStateMutationSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  currentSlideId: z.string().trim().min(1).nullable().optional(),
  currentSlideIndex: z.number().min(0),
  broadcastEnabled: z.boolean(),
  lockToFacilitator: z.boolean().optional(),
  facilitatorPrompt: z.string().trim().max(240).nullable().optional(),
});

export async function GET(request: Request) {
  const parsed = liveStateQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid live-state query." } },
      { status: 400 },
    );
  }

  const [platformSession, supabase] = await Promise.all([getCurrentPlatformTrainingSession(), createClient()]);
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const canManagePlatformTraining = platformSession?.canManagePlatformTraining === true;
  const isAnonymousViewer = !platformSession && !user?.id;

  if (!canManagePlatformTraining && !isAnonymousViewer) {
    const participantSession = await getTrainingParticipantByInviteForAuthUser({
      inviteCode: parsed.data.inviteCode,
      authUserId: user!.id,
      email: user?.email ?? null,
    });
    if (!participantSession) {
      return NextResponse.json({ error: { message: "Participant access required." } }, { status: 403 });
    }
  }

  const [resolved, participantPositions, participantLabCheckpoints] = await Promise.all([
    getTrainingLiveSessionByInvite({
      inviteCode: parsed.data.inviteCode,
      moduleSlug: parsed.data.moduleSlug,
    }),
    getTrainingParticipantSlidePositions({
      inviteCode: parsed.data.inviteCode,
      moduleSlug: parsed.data.moduleSlug,
    }),
    getTrainingParticipantLabCheckpointProgressByInvite({
      inviteCode: parsed.data.inviteCode,
      moduleSlug: parsed.data.moduleSlug,
    }),
  ]);

  if (!resolved) {
    return NextResponse.json({ error: { message: "Training live session not found." } }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      cohort: resolved.cohort,
      module: resolved.module,
      liveSession: resolved.liveSession,
      participantPositions: canManagePlatformTraining ? participantPositions : [],
      participantLabCheckpoints: canManagePlatformTraining ? participantLabCheckpoints : [],
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const parsed = liveStateMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid live-state payload." } },
      { status: 400 },
    );
  }

  const liveSession = await upsertTrainingLiveSession({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
    facilitatorUserId: session.userId,
    currentSlideId: parsed.data.currentSlideId ?? null,
    currentSlideIndex: parsed.data.currentSlideIndex,
    broadcastEnabled: parsed.data.broadcastEnabled,
    metadata: {
      lockToFacilitator: parsed.data.lockToFacilitator ?? false,
      facilitatorPrompt: parsed.data.facilitatorPrompt ?? null,
      facilitatorPromptAt: parsed.data.facilitatorPrompt ? new Date().toISOString() : null,
    },
  });

  if (!liveSession) {
    return NextResponse.json({ error: { message: "Unable to update training live state." } }, { status: 500 });
  }

  return NextResponse.json({ data: liveSession });
}
