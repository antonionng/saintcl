import { NextResponse } from "next/server";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { syncAjbTrainingProgramme } from "@/lib/training-dal";

export async function POST() {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const synced = await syncAjbTrainingProgramme(session.userId);
  if (!synced) {
    return NextResponse.json({ error: { message: "Unable to sync AJB training programme." } }, { status: 500 });
  }

  return NextResponse.json({ data: synced });
}
