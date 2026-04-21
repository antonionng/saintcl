import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import {
  getTrainingModulesForProgramme,
  getTrainingParticipantNotes,
} from "@/lib/training-dal";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  sharedOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
  participantId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.canManagePlatformTraining) {
    return NextResponse.json({ error: { message: "Platform training access required." } }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    inviteCode: url.searchParams.get("inviteCode") ?? "",
    moduleSlug: url.searchParams.get("moduleSlug") ?? "",
    sharedOnly: url.searchParams.get("sharedOnly") ?? undefined,
    participantId: url.searchParams.get("participantId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid notes query." } },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: { message: "Service unavailable." } }, { status: 503 });
  }

  const { data: cohortRow } = await admin
    .from("training_cohorts")
    .select("id, programme_id, invite_code")
    .eq("invite_code", parsed.data.inviteCode)
    .maybeSingle();
  if (!cohortRow) {
    return NextResponse.json({ error: { message: "Cohort not found." } }, { status: 404 });
  }

  const modules = await getTrainingModulesForProgramme(cohortRow.programme_id as string);
  const trainingModule = modules.find((candidate) => candidate.slug === parsed.data.moduleSlug);
  if (!trainingModule) {
    return NextResponse.json({ error: { message: "Module not found for cohort programme." } }, { status: 404 });
  }

  const { data: participants } = await admin
    .from("training_participants")
    .select("id, full_name, email")
    .eq("cohort_id", cohortRow.id);

  const participantRows = (participants ?? []) as Array<{ id: string; full_name: string; email: string }>;
  const filteredParticipants = parsed.data.participantId
    ? participantRows.filter((row) => row.id === parsed.data.participantId)
    : participantRows;

  const allNotes = await Promise.all(
    filteredParticipants.map(async (participant) => {
      const notes = await getTrainingParticipantNotes({
        participantId: participant.id,
        moduleId: trainingModule.id,
      });
      return notes.map((note) => ({
        ...note,
        participant: {
          id: participant.id,
          fullName: participant.full_name,
          email: participant.email,
        },
      }));
    }),
  );

  let flattened = allNotes.flat();
  if (parsed.data.sharedOnly) {
    flattened = flattened.filter((note) => {
      const meta = note.metadata as Record<string, unknown> | null;
      return meta?.sharedWithFacilitator === true;
    });
  }

  flattened.sort((left, right) => {
    const leftAt = left.updatedAt ?? "";
    const rightAt = right.updatedAt ?? "";
    return rightAt.localeCompare(leftAt);
  });

  return NextResponse.json({ data: flattened });
}
