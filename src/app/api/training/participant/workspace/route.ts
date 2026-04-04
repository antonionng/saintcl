import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  getLatestTrainingLabWorkspace,
  getTrainingModulesForProgramme,
  getTrainingParticipantByInviteForAuthUser,
  recordTrainingParticipantProgress,
  upsertTrainingLabWorkspace,
} from "@/lib/training-dal";
import {
  startManagedTrainingWorkspace,
  syncManagedTrainingWorkspace,
} from "@/lib/openclaw/training-workspace-manager";

const workspaceQuerySchema = z.object({
  inviteCode: z.string().trim().min(2).max(120),
  moduleSlug: z.string().trim().min(2).max(120),
});

type ResolvedParticipantContext = {
  participantId: string;
  moduleId: string;
  orgId: string;
  inviteCode: string;
  moduleSlug: string;
  enrollments: NonNullable<Awaited<ReturnType<typeof getTrainingParticipantByInviteForAuthUser>>>["enrollments"];
  cohortId: string;
};

async function resolveParticipantContext(requestData: { inviteCode: string; moduleSlug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return { error: NextResponse.json({ error: { message: "Participant session not found." } }, { status: 401 }) };
  }

  const session = await getTrainingParticipantByInviteForAuthUser({
    inviteCode: requestData.inviteCode,
    authUserId: user.id,
    email: user.email ?? null,
  });
  if (!session?.cohort) {
    return { error: NextResponse.json({ error: { message: "Participant session is no longer valid." } }, { status: 401 }) };
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === requestData.moduleSlug);
  if (!trainingModule) {
    return { error: NextResponse.json({ error: { message: "Training module not found for this participant." } }, { status: 404 }) };
  }

  const orgId = session.participant.orgId ?? session.cohort.orgId;
  if (!orgId) {
    return { error: NextResponse.json({ error: { message: "Training workspace requires a resolved org context." } }, { status: 500 }) };
  }

  return {
    data: {
      participantId: session.participant.id,
      moduleId: trainingModule.id,
      orgId,
      inviteCode: requestData.inviteCode,
      moduleSlug: requestData.moduleSlug,
      enrollments: session.enrollments,
      cohortId: session.cohort.id,
    } satisfies ResolvedParticipantContext,
  };
}

async function syncWorkspaceRecord(context: ResolvedParticipantContext) {
  const existingRecord = await getLatestTrainingLabWorkspace({
    participantId: context.participantId,
    moduleId: context.moduleId,
  });
  if (!existingRecord) {
    return { record: null, launchUrl: null };
  }

  const runtime = await syncManagedTrainingWorkspace({
    orgId: context.orgId,
    participantId: context.participantId,
    moduleSlug: context.moduleSlug,
  });
  if (!runtime) {
    return { record: existingRecord, launchUrl: null };
  }

  const persisted = await upsertTrainingLabWorkspace({
    workspaceId: existingRecord.id,
    participantId: context.participantId,
    moduleId: context.moduleId,
    orgId: context.orgId,
    provider: "jupyter-local",
    status: runtime.state.status,
    launchUrl: runtime.launchUrl ? runtime.launchUrl.replace(/\?token=.*$/, "") : existingRecord.launchUrl ?? null,
    notebookPath: runtime.state.notebooksDir,
    runtimeImage: "python3-jupyterlab:native",
    metadata: {
      ...existingRecord.metadata,
      managedRuntime: "jupyter-local",
      port: runtime.state.port,
      workspaceRoot: runtime.state.rootDir,
      logPath: runtime.state.logPath,
      launchMode: "local-direct",
    },
    lastHeartbeatAt: runtime.state.lastHeartbeatAt ?? null,
  });

  return {
    record: persisted ?? existingRecord,
    launchUrl: runtime.launchUrl,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = workspaceQuerySchema.safeParse({
    inviteCode: url.searchParams.get("inviteCode"),
    moduleSlug: url.searchParams.get("moduleSlug"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid workspace query." } },
      { status: 400 },
    );
  }

  const resolved = await resolveParticipantContext(parsed.data);
  if ("error" in resolved) {
    return resolved.error;
  }

  const synced = await syncWorkspaceRecord(resolved.data);
  return NextResponse.json({
    data: synced.record
      ? {
          workspace: synced.record,
          launchUrl: synced.launchUrl,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const parsed = workspaceQuerySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid workspace payload." } },
      { status: 400 },
    );
  }

  const resolved = await resolveParticipantContext(parsed.data);
  if ("error" in resolved) {
    return resolved.error;
  }

  const existingRecord = await getLatestTrainingLabWorkspace({
    participantId: resolved.data.participantId,
    moduleId: resolved.data.moduleId,
  });
  const ensuredRecord =
    existingRecord ??
    (await upsertTrainingLabWorkspace({
      participantId: resolved.data.participantId,
      moduleId: resolved.data.moduleId,
      orgId: resolved.data.orgId,
      provider: "jupyter-local",
      status: "provisioning",
      runtimeImage: "python3-jupyterlab:native",
      metadata: {
        managedRuntime: "jupyter-local",
        launchMode: "local-direct",
      },
    }));

  if (!ensuredRecord) {
    return NextResponse.json({ error: { message: "Unable to create a training workspace record." } }, { status: 500 });
  }

  const started = await startManagedTrainingWorkspace({
    workspaceId: ensuredRecord.id,
    orgId: resolved.data.orgId,
    participantId: resolved.data.participantId,
    moduleSlug: resolved.data.moduleSlug,
  });

  const persisted = await upsertTrainingLabWorkspace({
    workspaceId: ensuredRecord.id,
    participantId: resolved.data.participantId,
    moduleId: resolved.data.moduleId,
    orgId: resolved.data.orgId,
    provider: "jupyter-local",
    status: started.state.status,
    launchUrl: started.launchUrl ? started.launchUrl.replace(/\?token=.*$/, "") : ensuredRecord.launchUrl ?? null,
    notebookPath: started.state.notebooksDir,
    runtimeImage: "python3-jupyterlab:native",
    metadata: {
      ...(ensuredRecord.metadata ?? {}),
      managedRuntime: "jupyter-local",
      port: started.state.port,
      workspaceRoot: started.state.rootDir,
      logPath: started.state.logPath,
      launchMode: "local-direct",
    },
    lastHeartbeatAt: started.state.lastHeartbeatAt ?? null,
  });

  await recordTrainingParticipantProgress({
    participantId: resolved.data.participantId,
    cohortId: resolved.data.cohortId,
    orgId: resolved.data.orgId,
    enrollments: resolved.data.enrollments,
    moduleId: resolved.data.moduleId,
    eventType: "lab_launched",
    metadata: {
      source: "managed-jupyter-lab",
      provider: "jupyter-local",
      workspaceId: ensuredRecord.id,
    },
  });

  return NextResponse.json({
    data: {
      workspace: persisted ?? ensuredRecord,
      launchUrl: started.launchUrl,
    },
  });
}
