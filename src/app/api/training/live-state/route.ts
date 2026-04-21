import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { createClient } from "@/lib/supabase/server";
import {
  getTrainingEvidenceSummaryByInvite,
  getTrainingLiveSessionByInvite,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantLabCheckpointProgressByInvite,
  getTrainingParticipantSlidePositions,
  upsertTrainingLiveSession,
} from "@/lib/training-dal";
import {
  legacyFromLiveMode,
  publishLiveSession,
  toLiveSession,
  type LiveMode,
} from "@/lib/training-realtime";

const liveStateQuerySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
});

const liveModeSchema = z.enum(["off", "on", "locked"]);

const liveStateMutationSchema = z
  .object({
    inviteCode: z.string().trim().min(2).max(120),
    moduleSlug: z.string().trim().min(2).max(120),
    currentSlideId: z.string().trim().min(1).nullable().optional(),
    currentSlideIndex: z.number().min(0),
    // Unified shape (preferred).
    liveMode: liveModeSchema.optional(),
    prompt: z.string().trim().max(240).nullable().optional(),
    // Legacy shape (still accepted during the cutover so older clients keep working).
    broadcastEnabled: z.boolean().optional(),
    lockToFacilitator: z.boolean().optional(),
    facilitatorPrompt: z.string().trim().max(240).nullable().optional(),
  })
  .refine(
    (value) => value.liveMode !== undefined || value.broadcastEnabled !== undefined,
    { message: "Provide either liveMode or broadcastEnabled." },
  );

function resolveMutationFlags(input: z.infer<typeof liveStateMutationSchema>) {
  let mode: LiveMode;
  if (input.liveMode) {
    mode = input.liveMode;
  } else if (input.lockToFacilitator) {
    mode = "locked";
  } else if (input.broadcastEnabled) {
    mode = "on";
  } else {
    mode = "off";
  }

  const legacy = legacyFromLiveMode(mode);
  const prompt = input.prompt ?? input.facilitatorPrompt ?? null;
  return { mode, legacy, prompt };
}

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

  const [resolved, participantPositions, participantLabCheckpoints, evidenceSummary] = await Promise.all([
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
    canManagePlatformTraining
      ? getTrainingEvidenceSummaryByInvite({
          inviteCode: parsed.data.inviteCode,
          moduleSlug: parsed.data.moduleSlug,
        })
      : Promise.resolve(null),
  ]);

  if (!resolved) {
    return NextResponse.json({ error: { message: "Training live session not found." } }, { status: 404 });
  }

  const live = resolved.liveSession ? toLiveSession(resolved.liveSession) : null;

  return NextResponse.json({
    data: {
      cohort: resolved.cohort,
      module: resolved.module,
      liveSession: resolved.liveSession,
      live,
      channel: live ? `training:live:${live.cohortId}:${live.moduleId}` : null,
      participantPositions: canManagePlatformTraining ? participantPositions : [],
      participantLabCheckpoints: canManagePlatformTraining ? participantLabCheckpoints : [],
      evidenceSummary: canManagePlatformTraining ? evidenceSummary : null,
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

  const { legacy, prompt } = resolveMutationFlags(parsed.data);

  const liveSession = await upsertTrainingLiveSession({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
    facilitatorUserId: session.userId,
    currentSlideId: parsed.data.currentSlideId ?? null,
    currentSlideIndex: parsed.data.currentSlideIndex,
    broadcastEnabled: legacy.broadcastEnabled,
    metadata: {
      lockToFacilitator: legacy.lockToFacilitator,
      facilitatorPrompt: prompt,
      facilitatorPromptAt: prompt ? new Date().toISOString() : null,
    },
  });

  if (!liveSession) {
    return NextResponse.json({ error: { message: "Unable to update training live state." } }, { status: 500 });
  }

  const live = toLiveSession(liveSession);

  // Best-effort realtime broadcast so subscribed clients update instantly.
  // Clients also keep a slow fallback poll in case a broadcast is dropped.
  void publishLiveSession(live);

  return NextResponse.json({ data: { liveSession, live } });
}
