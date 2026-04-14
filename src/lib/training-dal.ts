import { randomUUID } from "node:crypto";

import type {
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingLiveSessionRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingLabWorkspaceRecord,
  TrainingModuleRecord,
  TrainingParticipantRecord,
  TrainingProgrammeRecord,
  TrainingSubmissionRecord,
} from "@/types";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";
import { ajbTrainingProgramme } from "@/lib/training";
import { createAdminClient } from "@/lib/supabase/admin";

export const PLATFORM_TRAINING_KEY = "saintagi-training";

async function getPlatformTrainingCompatOrgId(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const existingTrainingOrg = await admin
    .from("training_programmes")
    .select("org_id")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .not("org_id", "is", null)
    .limit(1)
    .maybeSingle();

  const existingOrgId =
    existingTrainingOrg.data && "org_id" in existingTrainingOrg.data
      ? (existingTrainingOrg.data.org_id as string | null)
      : null;
  if (existingOrgId) {
    return existingOrgId;
  }

  const fallbackOrg = await admin.from("orgs").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return fallbackOrg.data?.id ?? null;
}

async function resolveTrainingWriteOrgId(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  preferredOrgId?: string | null,
) {
  return preferredOrgId ?? (await getPlatformTrainingCompatOrgId(admin));
}

type TrainingProgrammeRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  slug: string;
  name: string;
  client_name: string | null;
  description: string;
  status: "planning" | "active" | "archived";
  target_slide_count: number;
  created_at: string;
  updated_at: string;
};

type TrainingModuleRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  programme_id: string;
  slug: string;
  title: string;
  sequence: number;
  status: "draft" | "scheduled" | "ready" | "live" | "complete";
  delivery_mode: "online" | "hybrid" | "in_person";
  duration_days: number;
  hours_per_day: number;
  start_date: string | null;
  end_date: string | null;
  target_slide_count: number;
  summary: string;
  learning_objectives: string[] | null;
  key_themes: string[] | null;
  created_at: string;
  updated_at: string;
};

type TrainingCohortRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  programme_id: string;
  slug: string;
  name: string;
  audience: string;
  status: "draft" | "scheduled" | "active" | "complete";
  invite_code: string | null;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingParticipantRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  auth_user_id: string | null;
  cohort_id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  status: "invited" | "checked_in" | "active" | "completed";
  check_in_token: string | null;
  checked_in_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingEnrollmentRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  cohort_id: string;
  participant_id: string;
  module_id: string;
  status: "enrolled" | "in_progress" | "completed";
  progress_percent: number;
  completed_at: string | null;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingLabWorkspaceRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  module_id: string;
  participant_id: string;
  content_item_id: string | null;
  provider: string;
  status: "provisioning" | "active" | "paused" | "stopped" | "error";
  launch_url: string | null;
  notebook_path: string | null;
  metadata: Record<string, unknown> | null;
  runtime_image: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingSubmissionRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  module_id: string;
  participant_id: string;
  content_item_id: string | null;
  status: "draft" | "submitted" | "reviewed";
  score_band: "competent" | "strong" | "exceptional" | null;
  artifact_url: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingLiveSessionRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  cohort_id: string;
  module_id: string;
  facilitator_user_id: string | null;
  current_slide_id: string | null;
  current_slide_index: number;
  broadcast_enabled: boolean;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapTrainingProgrammeRecord(row: TrainingProgrammeRow): TrainingProgrammeRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    slug: row.slug,
    name: row.name,
    clientName: row.client_name,
    description: row.description,
    status: row.status,
    targetSlideCount: row.target_slide_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingModuleRecord(row: TrainingModuleRow): TrainingModuleRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    programmeId: row.programme_id,
    slug: row.slug,
    title: row.title,
    sequence: row.sequence,
    status: row.status,
    deliveryMode: row.delivery_mode,
    durationDays: row.duration_days,
    hoursPerDay: Number(row.hours_per_day),
    startDate: row.start_date,
    endDate: row.end_date,
    targetSlideCount: row.target_slide_count,
    summary: row.summary,
    learningObjectives: row.learning_objectives ?? [],
    keyThemes: row.key_themes ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingCohortRecord(row: TrainingCohortRow): TrainingCohortRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    programmeId: row.programme_id,
    slug: row.slug,
    name: row.name,
    audience: row.audience,
    inviteCode: row.invite_code,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingParticipantRecord(row: TrainingParticipantRow): TrainingParticipantRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    authUserId: row.auth_user_id,
    cohortId: row.cohort_id,
    fullName: row.full_name,
    email: row.email,
    employeeId: row.employee_id,
    status: row.status,
    checkedInAt: row.checked_in_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingEnrollmentRecord(row: TrainingEnrollmentRow): TrainingEnrollmentRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    cohortId: row.cohort_id,
    moduleId: row.module_id,
    participantId: row.participant_id,
    status: row.status,
    progressPercent: Number(row.progress_percent),
    completedAt: row.completed_at,
    lastEventAt: row.last_event_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingLabWorkspaceRecord(row: TrainingLabWorkspaceRow): TrainingLabWorkspaceRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    moduleId: row.module_id,
    participantId: row.participant_id,
    contentItemId: row.content_item_id,
    provider: row.provider,
    status: row.status,
    launchUrl: row.launch_url,
    runtimeImage: row.runtime_image,
    notebookPath: row.notebook_path,
    metadata: row.metadata ?? {},
    lastHeartbeatAt: row.last_heartbeat_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingSubmissionRecord(row: TrainingSubmissionRow): TrainingSubmissionRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    moduleId: row.module_id,
    participantId: row.participant_id,
    contentItemId: row.content_item_id,
    status: row.status,
    scoreBand: row.score_band,
    artifactUrl: row.artifact_url,
    summary: row.summary,
    metadata: row.metadata ?? {},
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingLiveSessionRecord(row: TrainingLiveSessionRow): TrainingLiveSessionRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    cohortId: row.cohort_id,
    moduleId: row.module_id,
    facilitatorUserId: row.facilitator_user_id,
    currentSlideId: row.current_slide_id,
    currentSlideIndex: row.current_slide_index,
    broadcastEnabled: row.broadcast_enabled,
    metadata: row.metadata ?? {},
    updatedAt: row.updated_at,
  };
}

export async function getTrainingProgrammes() {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("training_programmes")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .order("updated_at", { ascending: false });

  return ((data ?? []) as TrainingProgrammeRow[]).map(mapTrainingProgrammeRecord);
}

export async function getTrainingProgrammeBySlug(slug: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("training_programmes")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .eq("slug", slug)
    .maybeSingle();

  return data ? mapTrainingProgrammeRecord(data as TrainingProgrammeRow) : null;
}

export async function getTrainingModulesForProgramme(programmeId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("training_modules")
    .select("*")
    .eq("programme_id", programmeId)
    .order("sequence", { ascending: true });

  return ((data ?? []) as TrainingModuleRow[]).map(mapTrainingModuleRecord);
}

export async function getTrainingCohorts() {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("training_cohorts")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .order("starts_on", { ascending: true });

  return ((data ?? []) as TrainingCohortRow[]).map(mapTrainingCohortRecord);
}

export async function getTrainingCohortSnapshots() {
  const admin = createAdminClient();
  if (!admin) return [];

  const [cohortResult, participantResult, enrollmentResult] = await Promise.all([
    admin.from("training_cohorts").select("*").eq("platform_key", PLATFORM_TRAINING_KEY).order("starts_on", { ascending: true }),
    admin.from("training_participants").select("*").eq("platform_key", PLATFORM_TRAINING_KEY).order("full_name", { ascending: true }),
    admin.from("training_enrollments").select("*").eq("platform_key", PLATFORM_TRAINING_KEY).order("updated_at", { ascending: false }),
  ]);

  const cohorts = ((cohortResult.data ?? []) as TrainingCohortRow[]).map(mapTrainingCohortRecord);
  const participants = ((participantResult.data ?? []) as TrainingParticipantRow[]).map(mapTrainingParticipantRecord);
  const enrollments = ((enrollmentResult.data ?? []) as TrainingEnrollmentRow[]).map(mapTrainingEnrollmentRecord);

  return cohorts.map((cohort) => {
    const cohortParticipants = participants.filter((participant) => participant.cohortId === cohort.id);
    const cohortEnrollments = enrollments.filter((enrollment) => enrollment.cohortId === cohort.id);
    const completedEnrollments = cohortEnrollments.filter((enrollment) => enrollment.status === "completed");
    const activeEnrollments = cohortEnrollments.filter((enrollment) => enrollment.status === "in_progress");
    const averageProgress =
      cohortEnrollments.length > 0
        ? cohortEnrollments.reduce((sum, enrollment) => sum + enrollment.progressPercent, 0) / cohortEnrollments.length
        : 0;

    return {
      cohort,
      participants: cohortParticipants,
      enrollments: cohortEnrollments,
      stats: {
        participantCount: cohortParticipants.length,
        activeParticipantCount: cohortParticipants.filter((participant) => participant.status === "active").length,
        completedEnrollmentCount: completedEnrollments.length,
        activeEnrollmentCount: activeEnrollments.length,
        averageProgress,
      },
    };
  });
}

export async function getTrainingCohortByInviteCode(inviteCode: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("training_cohorts")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .eq("invite_code", inviteCode)
    .maybeSingle();

  return data ? mapTrainingCohortRecord(data as TrainingCohortRow) : null;
}

export async function createTrainingCohort(input: {
  programmeId: string;
  name: string;
  audience?: string;
  startsOn?: string | null;
  endsOn?: string | null;
  inviteCode?: string | null;
  createdBy?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin);
  const slug = slugify(input.name);
  const { data } = await admin
    .from("training_cohorts")
    .insert({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      programme_id: input.programmeId,
      slug,
      name: input.name,
      audience: input.audience ?? "",
      invite_code: input.inviteCode ?? slug,
      starts_on: input.startsOn ?? null,
      ends_on: input.endsOn ?? null,
      status: "scheduled",
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  return data ? mapTrainingCohortRecord(data as TrainingCohortRow) : null;
}

export async function syncAjbTrainingProgramme(createdBy?: string | null) {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin);
  const { data: programmeData } = await admin
    .from("training_programmes")
    .upsert(
      {
        org_id: orgId,
        platform_key: PLATFORM_TRAINING_KEY,
        slug: ajbTrainingProgramme.slug,
        name: ajbTrainingProgramme.name,
        client_name: ajbTrainingProgramme.clientName,
        description: ajbTrainingProgramme.description,
        audience: ajbTrainingProgramme.audience,
        status: ajbTrainingProgramme.status,
        delivery_mode: ajbTrainingProgramme.deliveryMode,
        target_slide_count: 80,
        created_by: createdBy ?? null,
      },
      { onConflict: "platform_key,slug" },
    )
    .select("*")
    .single();

  if (!programmeData) {
    return null;
  }

  const programme = mapTrainingProgrammeRecord(programmeData as TrainingProgrammeRow);
  const modulePayload = ajbTrainingProgramme.modules.map((module) => ({
    org_id: orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    programme_id: programme.id,
    slug: module.slug,
    title: module.title,
    sequence: module.sequence,
    summary: module.summary,
    status: module.status,
    delivery_mode: module.deliveryMode,
    duration_days: module.durationDays,
    hours_per_day: module.hoursPerDay,
    start_date: module.dates.startsOn,
    end_date: module.dates.endsOn,
    target_slide_count: module.contentModel.targetSlideCount,
    learning_objectives: module.learningObjectives,
    key_themes: module.keyThemes,
    source_root: "src/lib/training.ts",
    created_by: createdBy ?? null,
  }));

  const { data: modulesData } = await admin
    .from("training_modules")
    .upsert(modulePayload, { onConflict: "programme_id,slug" })
    .select("*");

  await admin.from("training_cohorts").upsert(
    {
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      programme_id: programme.id,
      slug: "ajb-enterprise-banking-cohort",
      name: "AJB Enterprise Banking Cohort",
      audience: "Enterprise Banking cohort",
      invite_code: "ajb-enterprise-banking",
      status: "scheduled",
      created_by: createdBy ?? null,
    },
    { onConflict: "platform_key,slug" },
  );

  return {
    programme,
    modules: ((modulesData ?? []) as TrainingModuleRow[])
      .map(mapTrainingModuleRecord)
      .sort((left, right) => left.sequence - right.sequence),
  };
}

export async function getTrainingParticipantByCheckInToken(checkInToken: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: participantData } = await admin
    .from("training_participants")
    .select("*")
    .eq("check_in_token", checkInToken)
    .maybeSingle();

  if (!participantData) {
    return null;
  }

  const participantRow = participantData as TrainingParticipantRow;
  const [cohortData, enrollmentData, workspaceData, submissionData] = await Promise.all([
    admin.from("training_cohorts").select("*").eq("id", participantRow.cohort_id).maybeSingle(),
    admin
      .from("training_enrollments")
      .select("*")
      .eq("participant_id", participantRow.id)
      .order("updated_at", { ascending: false }),
    admin
      .from("training_lab_workspaces")
      .select("*")
      .eq("participant_id", participantRow.id)
      .order("updated_at", { ascending: false }),
    admin
      .from("training_submissions")
      .select("*")
      .eq("participant_id", participantRow.id)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    participant: mapTrainingParticipantRecord(participantRow),
    cohort: cohortData.data ? mapTrainingCohortRecord(cohortData.data as TrainingCohortRow) : null,
    enrollments: ((enrollmentData.data ?? []) as TrainingEnrollmentRow[]).map(mapTrainingEnrollmentRecord),
    workspaces: ((workspaceData.data ?? []) as TrainingLabWorkspaceRow[]).map(mapTrainingLabWorkspaceRecord),
    submissions: ((submissionData.data ?? []) as TrainingSubmissionRow[]).map(mapTrainingSubmissionRecord),
  };
}

export async function resolveTrainingCohortAndModuleByInvite(input: { inviteCode: string; moduleSlug: string }) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: cohortData } = await admin
    .from("training_cohorts")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .eq("invite_code", input.inviteCode)
    .maybeSingle();

  if (!cohortData) {
    return null;
  }

  const cohort = mapTrainingCohortRecord(cohortData as TrainingCohortRow);
  const { data: moduleData } = await admin
    .from("training_modules")
    .select("*")
    .eq("programme_id", cohort.programmeId)
    .eq("slug", input.moduleSlug)
    .maybeSingle();

  if (!moduleData) {
    return null;
  }

  return {
    cohort,
    module: mapTrainingModuleRecord(moduleData as TrainingModuleRow),
  };
}

export async function upsertTrainingLiveSession(input: {
  inviteCode: string;
  moduleSlug: string;
  facilitatorUserId?: string | null;
  currentSlideId?: string | null;
  currentSlideIndex: number;
  broadcastEnabled: boolean;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const resolved = await resolveTrainingCohortAndModuleByInvite({
    inviteCode: input.inviteCode,
    moduleSlug: input.moduleSlug,
  });
  if (!resolved) {
    return null;
  }

  const { data } = await admin
    .from("training_live_sessions")
    .upsert(
      {
        org_id: await resolveTrainingWriteOrgId(admin, resolved.cohort.orgId),
        platform_key: PLATFORM_TRAINING_KEY,
        cohort_id: resolved.cohort.id,
        module_id: resolved.module.id,
        facilitator_user_id: input.facilitatorUserId ?? null,
        current_slide_id: input.currentSlideId ?? null,
        current_slide_index: input.currentSlideIndex,
        broadcast_enabled: input.broadcastEnabled,
        metadata: input.metadata ?? {},
      },
      { onConflict: "cohort_id,module_id" },
    )
    .select("*")
    .single();

  return data ? mapTrainingLiveSessionRecord(data as TrainingLiveSessionRow) : null;
}

export async function getTrainingLiveSessionByInvite(input: { inviteCode: string; moduleSlug: string }) {
  const admin = createAdminClient();
  if (!admin) return null;

  const resolved = await resolveTrainingCohortAndModuleByInvite(input);
  if (!resolved) {
    return null;
  }

  const { data } = await admin
    .from("training_live_sessions")
    .select("*")
    .eq("cohort_id", resolved.cohort.id)
    .eq("module_id", resolved.module.id)
    .maybeSingle();

  return {
    cohort: resolved.cohort,
    module: resolved.module,
    liveSession: data ? mapTrainingLiveSessionRecord(data as TrainingLiveSessionRow) : null,
  };
}

export async function getTrainingModuleUnlockMapByInvite(inviteCode: string) {
  const admin = createAdminClient();
  if (!admin) return {};

  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  if (!cohort) return {};

  const [modulesResult, liveSessionsResult] = await Promise.all([
    admin.from("training_modules").select("*").eq("programme_id", cohort.programmeId).order("sequence", { ascending: true }),
    admin.from("training_live_sessions").select("*").eq("cohort_id", cohort.id),
  ]);

  const modules = ((modulesResult.data ?? []) as TrainingModuleRow[]).map(mapTrainingModuleRecord);
  const liveSessions = ((liveSessionsResult.data ?? []) as TrainingLiveSessionRow[]).map(mapTrainingLiveSessionRecord);
  const unlockedByModuleId = new Map(
    liveSessions.map((session) => [session.moduleId, session.metadata?.moduleUnlocked === true]),
  );

  return Object.fromEntries(modules.map((module) => [module.slug, Boolean(unlockedByModuleId.get(module.id))]));
}

export async function setTrainingModuleUnlocked(input: {
  inviteCode: string;
  moduleSlug: string;
  facilitatorUserId?: string | null;
  unlocked: boolean;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const resolved = await resolveTrainingCohortAndModuleByInvite({
    inviteCode: input.inviteCode,
    moduleSlug: input.moduleSlug,
  });
  if (!resolved) {
    return null;
  }

  const { data: existingData } = await admin
    .from("training_live_sessions")
    .select("*")
    .eq("cohort_id", resolved.cohort.id)
    .eq("module_id", resolved.module.id)
    .maybeSingle();

  const existingSession = existingData ? mapTrainingLiveSessionRecord(existingData as TrainingLiveSessionRow) : null;
  const mergedMetadata = {
    ...(existingSession?.metadata ?? {}),
    moduleUnlocked: input.unlocked,
  };

  const { data } = await admin
    .from("training_live_sessions")
    .upsert(
      {
        org_id: await resolveTrainingWriteOrgId(admin, resolved.cohort.orgId),
        platform_key: PLATFORM_TRAINING_KEY,
        cohort_id: resolved.cohort.id,
        module_id: resolved.module.id,
        facilitator_user_id: input.facilitatorUserId ?? existingSession?.facilitatorUserId ?? null,
        current_slide_id: existingSession?.currentSlideId ?? null,
        current_slide_index: existingSession?.currentSlideIndex ?? 0,
        broadcast_enabled: existingSession?.broadcastEnabled ?? false,
        metadata: mergedMetadata,
      },
      { onConflict: "cohort_id,module_id" },
    )
    .select("*")
    .single();

  return data ? mapTrainingLiveSessionRecord(data as TrainingLiveSessionRow) : null;
}

export async function getTrainingParticipantSlidePositions(input: { inviteCode: string; moduleSlug: string }) {
  const admin = createAdminClient();
  if (!admin) return [];

  const resolved = await resolveTrainingCohortAndModuleByInvite(input);
  if (!resolved) {
    return [];
  }

  const [participantsResult, progressEventsResult] = await Promise.all([
    admin.from("training_participants").select("*").eq("cohort_id", resolved.cohort.id).order("full_name", { ascending: true }),
    admin
      .from("training_progress_events")
      .select("*")
      .eq("cohort_id", resolved.cohort.id)
      .eq("module_id", resolved.module.id)
      .in("event_type", ["slide_viewed", "slide_completed"])
      .order("occurred_at", { ascending: false }),
  ]);

  const participants = ((participantsResult.data ?? []) as TrainingParticipantRow[]).map(mapTrainingParticipantRecord);
  const progressEvents = (progressEventsResult.data ?? []) as Array<{
    participant_id: string;
    progress_percent: number | null;
    metadata: { slideId?: string; slideIndex?: number } | null;
    occurred_at: string;
  }>;

  const latestByParticipant = new Map<
    string,
    {
      slideId: string | null;
      slideIndex: number | null;
      progressPercent: number | null;
      occurredAt: string;
    }
  >();

  progressEvents.forEach((event) => {
    if (latestByParticipant.has(event.participant_id)) return;
    latestByParticipant.set(event.participant_id, {
      slideId: event.metadata?.slideId ?? null,
      slideIndex: typeof event.metadata?.slideIndex === "number" ? event.metadata.slideIndex : null,
      progressPercent: event.progress_percent ?? null,
      occurredAt: event.occurred_at,
    });
  });

  return participants.map((participant) => {
    const latest = latestByParticipant.get(participant.id) ?? null;
    return {
      participant,
      slideId: latest?.slideId ?? null,
      slideIndex: latest?.slideIndex ?? null,
      progressPercent: latest?.progressPercent ?? null,
      occurredAt: latest?.occurredAt ?? null,
    };
  });
}

function buildParticipantLabCheckpointRecords(input: {
  participants: TrainingParticipantRecord[];
  events: Array<{
    participant_id: string;
    event_type: "lab_launched" | "lab_completed";
    metadata: { labSlug?: string; labTitle?: string; completionMode?: string; taskSummary?: string } | null;
    occurred_at: string;
  }>;
  moduleSlug: string;
}) {
  const checkpoints = resolveTrainingLabCheckpoints(input.moduleSlug);
  const latestEventByParticipantAndLab = new Map<
    string,
    {
      eventType: "lab_launched" | "lab_completed";
      occurredAt: string;
      labTitle: string;
      completionMode: "passed" | "guided_complete" | "retry_needed" | null;
      taskSummary: string | null;
    }
  >();

  input.events.forEach((event) => {
    const labSlug = event.metadata?.labSlug;
    if (!labSlug) return;
    const key = `${event.participant_id}:${labSlug}`;
    if (latestEventByParticipantAndLab.has(key)) return;
    latestEventByParticipantAndLab.set(key, {
      eventType: event.event_type,
      occurredAt: event.occurred_at,
      labTitle: event.metadata?.labTitle ?? checkpoints.find((checkpoint) => checkpoint.slug === labSlug)?.title ?? labSlug,
      completionMode:
        event.metadata?.completionMode === "passed" ||
        event.metadata?.completionMode === "guided_complete" ||
        event.metadata?.completionMode === "retry_needed"
          ? event.metadata.completionMode
          : null,
      taskSummary: typeof event.metadata?.taskSummary === "string" ? event.metadata.taskSummary : null,
    });
  });

  return input.participants.flatMap((participant) =>
    checkpoints.map((checkpoint) => {
      const latest = latestEventByParticipantAndLab.get(`${participant.id}:${checkpoint.slug}`) ?? null;
      return {
        participant,
        labSlug: checkpoint.slug,
        labTitle: checkpoint.title,
        status: latest?.eventType === "lab_completed" ? "completed" : latest?.eventType === "lab_launched" ? "launched" : "not_started",
        completionMode: latest?.completionMode ?? null,
        taskSummary: latest?.taskSummary ?? null,
        launchedAt: latest?.eventType === "lab_launched" ? latest.occurredAt : null,
        completedAt: latest?.eventType === "lab_completed" ? latest.occurredAt : null,
        lastEventAt: latest?.occurredAt ?? null,
      } satisfies TrainingParticipantLabCheckpointRecord;
    }),
  );
}

export async function getTrainingParticipantLabCheckpointProgressByInvite(input: {
  inviteCode: string;
  moduleSlug: string;
}) {
  const admin = createAdminClient();
  if (!admin) return [];

  const resolved = await resolveTrainingCohortAndModuleByInvite(input);
  if (!resolved) {
    return [];
  }

  const checkpoints = resolveTrainingLabCheckpoints(input.moduleSlug);
  if (checkpoints.length === 0) {
    return [];
  }

  const [participantsResult, progressEventsResult] = await Promise.all([
    admin.from("training_participants").select("*").eq("cohort_id", resolved.cohort.id).order("full_name", { ascending: true }),
    admin
      .from("training_progress_events")
      .select("*")
      .eq("cohort_id", resolved.cohort.id)
      .eq("module_id", resolved.module.id)
      .in("event_type", ["lab_launched", "lab_completed"])
      .order("occurred_at", { ascending: false }),
  ]);

  const participants = ((participantsResult.data ?? []) as TrainingParticipantRow[]).map(mapTrainingParticipantRecord);
  const progressEvents = (progressEventsResult.data ?? []) as Array<{
    participant_id: string;
    event_type: "lab_launched" | "lab_completed";
    metadata: { labSlug?: string; labTitle?: string; completionMode?: string; taskSummary?: string } | null;
    occurred_at: string;
  }>;

  return buildParticipantLabCheckpointRecords({
    participants,
    events: progressEvents,
    moduleSlug: input.moduleSlug,
  });
}

export async function getTrainingParticipantLabCheckpointProgressByCheckInToken(input: {
  checkInToken: string;
  moduleSlug: string;
}) {
  const admin = createAdminClient();
  if (!admin) return [];

  const session = await getTrainingParticipantByCheckInToken(input.checkInToken);
  if (!session?.participant || !session.cohort) {
    return [];
  }

  const modules = await getTrainingModulesForProgramme(session.cohort.programmeId);
  const trainingModule = modules.find((candidate) => candidate.slug === input.moduleSlug);
  if (!trainingModule) {
    return [];
  }

  const checkpoints = resolveTrainingLabCheckpoints(input.moduleSlug);
  if (checkpoints.length === 0) {
    return [];
  }

  const { data } = await admin
    .from("training_progress_events")
    .select("*")
    .eq("participant_id", session.participant.id)
    .eq("cohort_id", session.cohort.id)
    .eq("module_id", trainingModule.id)
    .in("event_type", ["lab_launched", "lab_completed"])
    .order("occurred_at", { ascending: false });

  const progressEvents = (data ?? []) as Array<{
    participant_id: string;
    event_type: "lab_launched" | "lab_completed";
    metadata: { labSlug?: string; labTitle?: string; completionMode?: string; taskSummary?: string } | null;
    occurred_at: string;
  }>;

  return buildParticipantLabCheckpointRecords({
    participants: [session.participant],
    events: progressEvents,
    moduleSlug: input.moduleSlug,
  });
}

type TrainingParticipantAuthResult =
  | {
      ok: true;
      cohort: TrainingCohortRecord;
      participant: TrainingParticipantRecord;
      enrollments: TrainingEnrollmentRecord[];
      checkInToken: string;
    }
  | {
      ok: false;
      reason: "invite_not_found" | "account_exists" | "participant_not_found" | "already_linked" | "write_failed";
    };

async function resolveTrainingCohortRowByInviteCode(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  inviteCode: string,
) {
  const { data } = await admin
    .from("training_cohorts")
    .select("*")
    .eq("platform_key", PLATFORM_TRAINING_KEY)
    .eq("invite_code", inviteCode)
    .maybeSingle();

  return (data as TrainingCohortRow | null) ?? null;
}

async function buildTrainingParticipantAuthSuccess(input: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  cohortRow: TrainingCohortRow;
  participantRow: TrainingParticipantRow;
  checkInToken: string;
}): Promise<TrainingParticipantAuthResult> {
  const { data: enrollmentData } = await input.admin
    .from("training_enrollments")
    .select("*")
    .eq("participant_id", input.participantRow.id)
    .order("updated_at", { ascending: false });

  return {
    ok: true as const,
    cohort: mapTrainingCohortRecord(input.cohortRow),
    participant: mapTrainingParticipantRecord(input.participantRow),
    enrollments: ((enrollmentData ?? []) as TrainingEnrollmentRow[]).map(mapTrainingEnrollmentRecord),
    checkInToken: input.checkInToken,
  };
}

async function getTrainingParticipantSessionByRow(input: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  participantRow: TrainingParticipantRow;
}) {
  const [cohortData, enrollmentData, workspaceData, submissionData] = await Promise.all([
    input.admin.from("training_cohorts").select("*").eq("id", input.participantRow.cohort_id).maybeSingle(),
    input.admin
      .from("training_enrollments")
      .select("*")
      .eq("participant_id", input.participantRow.id)
      .order("updated_at", { ascending: false }),
    input.admin
      .from("training_lab_workspaces")
      .select("*")
      .eq("participant_id", input.participantRow.id)
      .order("updated_at", { ascending: false }),
    input.admin
      .from("training_submissions")
      .select("*")
      .eq("participant_id", input.participantRow.id)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    participant: mapTrainingParticipantRecord(input.participantRow),
    cohort: cohortData.data ? mapTrainingCohortRecord(cohortData.data as TrainingCohortRow) : null,
    enrollments: ((enrollmentData.data ?? []) as TrainingEnrollmentRow[]).map(mapTrainingEnrollmentRecord),
    workspaces: ((workspaceData.data ?? []) as TrainingLabWorkspaceRow[]).map(mapTrainingLabWorkspaceRecord),
    submissions: ((submissionData.data ?? []) as TrainingSubmissionRow[]).map(mapTrainingSubmissionRecord),
  };
}

async function ensureTrainingParticipantEnrollments(input: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  cohortRow: TrainingCohortRow;
  participantRow: TrainingParticipantRow;
  inviteCode: string;
  now: string;
}) {
  const { data: moduleData } = await input.admin
    .from("training_modules")
    .select("*")
    .eq("programme_id", input.cohortRow.programme_id)
    .order("sequence", { ascending: true });

  const modules = (moduleData ?? []) as TrainingModuleRow[];
  if (modules.length === 0) {
    return true;
  }

  const orgId = await resolveTrainingWriteOrgId(input.admin, input.cohortRow.org_id);
  const enrollmentMutation = await input.admin.from("training_enrollments").upsert(
    modules.map((module) => ({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      cohort_id: input.cohortRow.id,
      participant_id: input.participantRow.id,
      module_id: module.id,
      status: "enrolled",
      progress_percent: 0,
      checked_in_at: input.now,
      last_event_at: input.now,
    })),
    { onConflict: "participant_id,module_id" },
  );
  if (enrollmentMutation.error) {
    return false;
  }

  const { data: firstEnrollment } = await input.admin
    .from("training_enrollments")
    .select("*")
    .eq("participant_id", input.participantRow.id)
    .eq("module_id", modules[0].id)
    .maybeSingle();

  const progressMutation = await input.admin.from("training_progress_events").insert({
    org_id: orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    cohort_id: input.cohortRow.id,
    participant_id: input.participantRow.id,
    enrollment_id: (firstEnrollment as TrainingEnrollmentRow | null)?.id ?? null,
    module_id: modules[0].id,
    event_type: "check_in",
    progress_percent: 0,
    metadata: { inviteCode: input.inviteCode },
    occurred_at: input.now,
  });
  if (progressMutation.error) {
    return false;
  }

  return true;
}

async function findTrainingParticipantForInvite(input: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  cohortId: string;
  authUserId: string;
  email?: string | null;
}) {
  const normalisedEmail = input.email?.trim().toLowerCase() ?? null;
  const [authMatch, emailMatch] = await Promise.all([
    input.admin
      .from("training_participants")
      .select("*")
      .eq("cohort_id", input.cohortId)
      .eq("auth_user_id", input.authUserId)
      .maybeSingle(),
    normalisedEmail
      ? input.admin
          .from("training_participants")
          .select("*")
          .eq("cohort_id", input.cohortId)
          .eq("email", normalisedEmail)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return ((authMatch.data ?? emailMatch.data) as TrainingParticipantRow | null) ?? null;
}

export async function getTrainingParticipantByInviteForAuthUser(input: {
  inviteCode: string;
  authUserId: string;
  email?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const cohortRow = await resolveTrainingCohortRowByInviteCode(admin, input.inviteCode);
  if (!cohortRow) {
    return null;
  }

  const participantRow = await findTrainingParticipantForInvite({
    admin,
    cohortId: cohortRow.id,
    authUserId: input.authUserId,
    email: input.email ?? null,
  });
  if (!participantRow) {
    return null;
  }

  return getTrainingParticipantSessionByRow({
    admin,
    participantRow,
  });
}

export async function submitTrainingParticipantWork(input: {
  participantId: string;
  moduleId: string;
  orgId?: string | null;
  contentItemId?: string | null;
  summary?: string | null;
  artifactUrl?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("training_submissions")
    .insert({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      module_id: input.moduleId,
      participant_id: input.participantId,
      content_item_id: input.contentItemId ?? null,
      status: "submitted",
      artifact_url: input.artifactUrl ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? {},
      submitted_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTrainingSubmissionRecord(data as TrainingSubmissionRow);
}

export async function getLatestTrainingLabWorkspace(input: {
  participantId: string;
  moduleId: string;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("training_lab_workspaces")
    .select("*")
    .eq("participant_id", input.participantId)
    .eq("module_id", input.moduleId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapTrainingLabWorkspaceRecord(data as TrainingLabWorkspaceRow) : null;
}

export async function upsertTrainingLabWorkspace(input: {
  workspaceId?: string;
  participantId: string;
  moduleId: string;
  orgId?: string | null;
  contentItemId?: string | null;
  provider: string;
  status: "provisioning" | "active" | "paused" | "stopped" | "error";
  launchUrl?: string | null;
  notebookPath?: string | null;
  runtimeImage?: string | null;
  metadata?: Record<string, unknown>;
  lastHeartbeatAt?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);
  const mutation = input.workspaceId
    ? admin
        .from("training_lab_workspaces")
        .update({
          org_id: orgId,
          provider: input.provider,
          status: input.status,
          launch_url: input.launchUrl ?? null,
          notebook_path: input.notebookPath ?? null,
          runtime_image: input.runtimeImage ?? null,
          metadata: input.metadata ?? {},
          last_heartbeat_at: input.lastHeartbeatAt ?? null,
        })
        .eq("id", input.workspaceId)
        .select("*")
        .single()
    : admin
        .from("training_lab_workspaces")
        .insert({
          org_id: orgId,
          platform_key: PLATFORM_TRAINING_KEY,
          module_id: input.moduleId,
          participant_id: input.participantId,
          content_item_id: input.contentItemId ?? null,
          provider: input.provider,
          status: input.status,
          launch_url: input.launchUrl ?? null,
          notebook_path: input.notebookPath ?? null,
          runtime_image: input.runtimeImage ?? null,
          metadata: input.metadata ?? {},
          last_heartbeat_at: input.lastHeartbeatAt ?? null,
        })
        .select("*")
        .single();

  const { data, error } = await mutation;
  if (error || !data) {
    return null;
  }

  return mapTrainingLabWorkspaceRecord(data as TrainingLabWorkspaceRow);
}

export async function claimTrainingParticipantAccess(input: {
  inviteCode: string;
  authUserId: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
}): Promise<TrainingParticipantAuthResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, reason: "invite_not_found" as const };

  const cohortRow = await resolveTrainingCohortRowByInviteCode(admin, input.inviteCode);
  if (!cohortRow) {
    return { ok: false as const, reason: "invite_not_found" as const };
  }

  const normalisedEmail = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existingParticipantRow = await findTrainingParticipantForInvite({
    admin,
    cohortId: cohortRow.id,
    authUserId: input.authUserId,
    email: normalisedEmail,
  });
  if (existingParticipantRow?.auth_user_id && existingParticipantRow.auth_user_id !== input.authUserId) {
    return { ok: false as const, reason: "already_linked" as const };
  }

  const nextToken = existingParticipantRow?.check_in_token ?? randomUUID();
  const orgId = await resolveTrainingWriteOrgId(admin, cohortRow.org_id);
  const participantPayload = {
    org_id: orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    auth_user_id: input.authUserId,
    cohort_id: cohortRow.id,
    full_name: input.fullName.trim(),
    email: normalisedEmail,
    employee_id: input.employeeId?.trim() || null,
    status: "checked_in",
    check_in_token: nextToken,
    checked_in_at: existingParticipantRow?.checked_in_at ?? now,
    last_seen_at: now,
  };

  const participantMutation = existingParticipantRow
    ? admin
        .from("training_participants")
        .update(participantPayload)
        .eq("id", existingParticipantRow.id)
        .select("*")
        .single()
    : admin.from("training_participants").insert(participantPayload).select("*").single();

  const { data: participantData, error: participantError } = await participantMutation;
  if (participantError || !participantData) {
    return { ok: false, reason: "write_failed" };
  }

  const participantRow = participantData as TrainingParticipantRow;
  const enrollmentsEnsured = await ensureTrainingParticipantEnrollments({
    admin,
    cohortRow,
    participantRow,
    inviteCode: input.inviteCode,
    now,
  });
  if (!enrollmentsEnsured) {
    return { ok: false, reason: "write_failed" };
  }

  return buildTrainingParticipantAuthSuccess({
    admin,
    cohortRow,
    participantRow,
    checkInToken: nextToken,
  });
}

export async function resumeTrainingParticipantSession(input: {
  inviteCode: string;
  authUserId: string;
  email?: string | null;
}): Promise<TrainingParticipantAuthResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "invite_not_found" };

  const cohortRow = await resolveTrainingCohortRowByInviteCode(admin, input.inviteCode);
  if (!cohortRow) {
    return { ok: false, reason: "invite_not_found" };
  }

  const participantRow = await findTrainingParticipantForInvite({
    admin,
    cohortId: cohortRow.id,
    authUserId: input.authUserId,
    email: input.email ?? null,
  });
  if (!participantRow) {
    return { ok: false, reason: "participant_not_found" };
  }

  if (participantRow.auth_user_id && participantRow.auth_user_id !== input.authUserId) {
    return { ok: false, reason: "already_linked" };
  }

  const now = new Date().toISOString();
  const nextToken = participantRow.check_in_token ?? randomUUID();
  const { data: refreshedParticipantData, error: refreshedParticipantError } = await admin
    .from("training_participants")
    .update({
      auth_user_id: input.authUserId,
      check_in_token: nextToken,
      checked_in_at: participantRow.checked_in_at ?? now,
      last_seen_at: now,
      status: participantRow.status === "completed" ? "completed" : "checked_in",
    })
    .eq("id", participantRow.id)
    .select("*")
    .single();

  if (refreshedParticipantError || !refreshedParticipantData) {
    return { ok: false, reason: "write_failed" };
  }

  return buildTrainingParticipantAuthSuccess({
    admin,
    cohortRow,
    participantRow: refreshedParticipantData as TrainingParticipantRow,
    checkInToken: nextToken,
  });
}

export async function recordTrainingParticipantProgress(input: {
  participantId: string;
  cohortId: string;
  orgId?: string | null;
  enrollments: TrainingEnrollmentRecord[];
  moduleId: string;
  eventType:
    | "check_in"
    | "slide_viewed"
    | "slide_completed"
    | "lab_launched"
    | "lab_completed"
    | "assessment_started"
    | "assessment_submitted"
    | "module_completed";
  contentItemId?: string | null;
  progressPercent?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return false;

  const enrollment = input.enrollments.find((candidate) => candidate.moduleId === input.moduleId) ?? null;
  const now = new Date().toISOString();
  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);

  const { error } = await admin.from("training_progress_events").insert({
    org_id: orgId,
    platform_key: PLATFORM_TRAINING_KEY,
    cohort_id: input.cohortId,
    participant_id: input.participantId,
    enrollment_id: enrollment?.id ?? null,
    module_id: input.moduleId,
    content_item_id: input.contentItemId ?? null,
    event_type: input.eventType,
    progress_percent: input.progressPercent ?? null,
    metadata: input.metadata ?? {},
    occurred_at: now,
  });

  if (error) {
    return false;
  }

  await admin
    .from("training_participants")
    .update({ last_seen_at: now, status: input.eventType === "module_completed" ? "completed" : "active" })
    .eq("id", input.participantId);

  if (enrollment) {
    await admin
      .from("training_enrollments")
      .update({
        status: input.eventType === "module_completed" ? "completed" : "in_progress",
        progress_percent: input.progressPercent ?? enrollment.progressPercent,
        last_event_at: now,
        completed_at: input.eventType === "module_completed" ? now : null,
      })
      .eq("id", enrollment.id);
  }

  return true;
}
