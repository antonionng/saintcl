import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getTrainingModulesForProgramme,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantNotes,
  upsertTrainingParticipantNote,
} from "@/lib/training-dal";

const scopeSchema = z.enum([
  "module",
  "checkpoint",
  "task",
  "assessment_question",
  "notebook",
]);

const querySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  scope: scopeSchema.optional(),
  scopeId: z.string().trim().max(200).optional(),
});

const upsertSchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
  scope: scopeSchema,
  scopeId: z.string().trim().max(200).optional().nullable(),
  bodyMarkdown: z.string().max(50000).optional(),
  bodyJson: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

async function resolveSession(input: { inviteCode: string; moduleSlug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return { error: NextResponse.json({ error: { message: "Participant session not found." } }, { status: 401 }) } as const;
  }

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode: input.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  if (!session?.cohort) {
    return { error: NextResponse.json({ error: { message: "Participant session is no longer valid." } }, { status: 401 }) } as const;
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === input.moduleSlug);
  if (!trainingModule) {
    return { error: NextResponse.json({ error: { message: "Training module not found for this participant." } }, { status: 404 }) } as const;
  }

  return { session, trainingModule } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    inviteCode: url.searchParams.get("inviteCode") ?? "",
    moduleSlug: url.searchParams.get("moduleSlug") ?? "",
    scope: url.searchParams.get("scope") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid notes query." } },
      { status: 400 },
    );
  }

  const resolved = await resolveSession({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
  });
  if ("error" in resolved) return resolved.error;

  const notes = await getTrainingParticipantNotes({
    participantId: resolved.session.participant.id,
    moduleId: resolved.trainingModule.id,
    scope: parsed.data.scope,
    scopeId: parsed.data.scopeId,
  });

  return NextResponse.json({ data: notes });
}

export async function POST(request: Request) {
  const parsed = upsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid note payload." } },
      { status: 400 },
    );
  }

  const resolved = await resolveSession({
    inviteCode: parsed.data.inviteCode,
    moduleSlug: parsed.data.moduleSlug,
  });
  if ("error" in resolved) return resolved.error;

  const note = await upsertTrainingParticipantNote({
    participantId: resolved.session.participant.id,
    moduleId: resolved.trainingModule.id,
    orgId:
      resolved.session.participant.orgId ?? resolved.session.cohort?.orgId ?? null,
    scope: parsed.data.scope,
    scopeId: parsed.data.scopeId ?? null,
    bodyMarkdown: parsed.data.bodyMarkdown ?? "",
    bodyJson: parsed.data.bodyJson ?? {},
    metadata: parsed.data.metadata ?? {},
  });
  if (!note) {
    return NextResponse.json({ error: { message: "Unable to save participant note." } }, { status: 500 });
  }

  return NextResponse.json({ data: note });
}
