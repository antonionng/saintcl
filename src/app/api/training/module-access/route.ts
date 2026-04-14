import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { getTrainingModuleUnlockMapByInvite, setTrainingModuleUnlocked } from "@/lib/training-dal";

const moduleAccessQuerySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
});

const moduleAccessMutationSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  unlocked: z.boolean(),
});

export async function GET(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const parsed = moduleAccessQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid module access query." } },
      { status: 400 },
    );
  }

  const unlocks = await getTrainingModuleUnlockMapByInvite(parsed.data.inviteCode);
  return NextResponse.json({ data: { unlocks } });
}

export async function POST(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const parsed = moduleAccessMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid module access payload." } },
      { status: 400 },
    );
  }

  const liveSession = await setTrainingModuleUnlocked({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
    facilitatorUserId: session.userId,
    unlocked: parsed.data.unlocked,
  });

  if (!liveSession) {
    return NextResponse.json({ error: { message: "Unable to update module access." } }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      moduleSlug: parsed.data.moduleSlug,
      unlocked: liveSession.metadata?.moduleUnlocked === true,
    },
  });
}
