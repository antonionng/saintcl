import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import {
  createTrainingCohort,
  getTrainingCohorts,
  getTrainingProgrammeBySlug,
  syncAjbTrainingProgramme,
} from "@/lib/training-dal";

const createCohortSchema = z.object({
  programmeSlug: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(160),
  audience: z.string().trim().max(240).optional().default(""),
  startsOn: z.string().trim().max(40).optional().nullable(),
  endsOn: z.string().trim().max(40).optional().nullable(),
  inviteCode: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const cohorts = await getTrainingCohorts();
  return NextResponse.json({ data: cohorts });
}

export async function POST(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const parsed = createCohortSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid cohort payload." } },
      { status: 400 },
    );
  }

  let programme = await getTrainingProgrammeBySlug(parsed.data.programmeSlug);
  if (!programme && parsed.data.programmeSlug === "ajb-ai-and-data-programme") {
    const synced = await syncAjbTrainingProgramme(session.userId);
    programme = synced?.programme ?? null;
  }

  if (!programme) {
    return NextResponse.json({ error: { message: "Training programme not found." } }, { status: 404 });
  }

  const cohort = await createTrainingCohort({
    programmeId: programme.id,
    name: parsed.data.name,
    audience: parsed.data.audience,
    startsOn: parsed.data.startsOn ?? null,
    endsOn: parsed.data.endsOn ?? null,
    inviteCode: parsed.data.inviteCode ?? null,
    createdBy: session.userId,
  });

  if (!cohort) {
    return NextResponse.json({ error: { message: "Unable to create training cohort." } }, { status: 500 });
  }

  return NextResponse.json({ data: cohort });
}
