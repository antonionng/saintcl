import { randomUUID } from "node:crypto";

import type {
  TrainingCohortPostRecord,
  TrainingCohortRecord,
  TrainingEnrollmentRecord,
  TrainingLiveSessionRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingLabWorkspaceRecord,
  TrainingModuleRecord,
  TrainingParticipantNoteRecord,
  TrainingParticipantRecord,
  TrainingProgrammeRecord,
  TrainingScope,
  TrainingSubmissionKind,
  TrainingSubmissionRecord,
} from "@/types";
import { resolveTrainingLabCheckpoints } from "@/lib/training-lab-checkpoints";
import { ajbTrainingProgramme } from "@/lib/training";
import {
  type AssessmentBlueprint,
  moduleAssessmentBlueprints,
} from "@/lib/training-assessments";
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
  metadata: Record<string, unknown> | null;
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
  display_name: string | null;
  role_at_company: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingCohortPostRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  cohort_id: string;
  participant_id: string | null;
  facilitator_user_id: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
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
  scope: TrainingScope | null;
  scope_id: string | null;
  kind: TrainingSubmissionKind | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingParticipantNoteRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  participant_id: string;
  module_id: string;
  scope: TrainingScope;
  scope_id: string;
  body_markdown: string;
  body_json: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
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
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
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
    checkInToken: row.check_in_token,
    checkedInAt: row.checked_in_at,
    lastSeenAt: row.last_seen_at,
    displayName: row.display_name,
    roleAtCompany: row.role_at_company,
    bio: row.bio,
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
    scope: row.scope ?? "module",
    scopeId: row.scope_id,
    kind: row.kind,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrainingParticipantNoteRecord(row: TrainingParticipantNoteRow): TrainingParticipantNoteRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    participantId: row.participant_id,
    moduleId: row.module_id,
    scope: row.scope,
    scopeId: row.scope_id,
    bodyMarkdown: row.body_markdown ?? "",
    bodyJson: row.body_json ?? {},
    metadata: row.metadata ?? {},
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

  const modulesByslug = ((modulesData ?? []) as TrainingModuleRow[])
    .map(mapTrainingModuleRecord)
    .sort((left, right) => left.sequence - right.sequence);

  const seededAssessments = await seedTrainingAssessmentsInternal({
    admin,
    orgId,
    programmeId: programme.id,
    modules: modulesByslug,
    createdBy: createdBy ?? null,
  });

  return {
    programme,
    modules: modulesByslug,
    assessments: seededAssessments,
  };
}

type TrainingAssessmentRow = {
  id: string;
  org_id: string | null;
  platform_key: string;
  programme_id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string;
  kind: "activity" | "homework" | "quiz" | "module_test";
  sequence: number;
  estimated_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  is_required: boolean;
  blocks_module_completion: boolean;
  facilitator_review_required: boolean;
  metadata: Record<string, unknown>;
  source_blueprint: string | null;
  created_at: string;
  updated_at: string;
};

async function seedTrainingAssessmentsInternal(input: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  orgId: string | null;
  programmeId: string;
  modules: TrainingModuleRecord[];
  createdBy?: string | null;
}) {
  const moduleBySlug = new Map(input.modules.map((module) => [module.slug, module]));
  const assessmentRows: Array<{
    org_id: string | null;
    platform_key: string;
    programme_id: string;
    module_id: string;
    slug: string;
    title: string;
    description: string;
    kind: AssessmentBlueprint["kind"];
    sequence: number;
    estimated_minutes: number | null;
    passing_score: number;
    max_attempts: number | null;
    is_required: boolean;
    blocks_module_completion: boolean;
    facilitator_review_required: boolean;
    source_blueprint: string;
    created_by: string | null;
  }> = [];

  for (const blueprint of moduleAssessmentBlueprints) {
    const module = moduleBySlug.get(blueprint.moduleSlug);
    if (!module) continue;

    blueprint.assessments.forEach((assessment, index) => {
      assessmentRows.push({
        org_id: input.orgId,
        platform_key: PLATFORM_TRAINING_KEY,
        programme_id: input.programmeId,
        module_id: module.id,
        slug: assessment.slug,
        title: assessment.title,
        description: assessment.description,
        kind: assessment.kind,
        sequence: index,
        estimated_minutes: assessment.estimatedMinutes ?? null,
        passing_score: assessment.passingScore ?? 70,
        max_attempts: assessment.maxAttempts ?? null,
        is_required: assessment.isRequired ?? true,
        blocks_module_completion: assessment.blocksModuleCompletion ?? false,
        facilitator_review_required: assessment.facilitatorReviewRequired ?? false,
        source_blueprint: "src/lib/training-assessments.ts",
        created_by: input.createdBy ?? null,
      });
    });
  }

  if (assessmentRows.length === 0) {
    return [];
  }

  const { data: assessmentData } = await input.admin
    .from("training_assessments")
    .upsert(assessmentRows, { onConflict: "module_id,slug" })
    .select("*");

  const persistedAssessments = (assessmentData ?? []) as TrainingAssessmentRow[];
  const persistedById = new Map<string, TrainingAssessmentRow>(
    persistedAssessments.map((row) => [`${row.module_id}::${row.slug}`, row]),
  );

  const questionRows: Array<{
    org_id: string | null;
    platform_key: string;
    assessment_id: string;
    slug: string;
    prompt: string;
    question_type: string;
    sequence: number;
    points: number;
    rubric: unknown;
    options: unknown;
    correct_answer: unknown;
    validators: unknown;
    facilitator_notes: string | null;
  }> = [];

  for (const blueprint of moduleAssessmentBlueprints) {
    const module = moduleBySlug.get(blueprint.moduleSlug);
    if (!module) continue;

    for (const assessment of blueprint.assessments) {
      const persisted = persistedById.get(`${module.id}::${assessment.slug}`);
      if (!persisted) continue;

      assessment.questions.forEach((question, index) => {
        questionRows.push({
          org_id: input.orgId,
          platform_key: PLATFORM_TRAINING_KEY,
          assessment_id: persisted.id,
          slug: question.slug,
          prompt: question.prompt,
          question_type: question.questionType,
          sequence: index,
          points: question.points ?? 1,
          rubric: question.rubric ?? [],
          options: question.options ?? [],
          correct_answer: question.correctAnswer ?? null,
          validators: question.validators ?? [],
          facilitator_notes: question.facilitatorNotes ?? null,
        });
      });
    }
  }

  if (questionRows.length > 0) {
    await input.admin
      .from("training_assessment_questions")
      .upsert(questionRows, { onConflict: "assessment_id,slug" });
  }

  return persistedAssessments;
}

export async function syncTrainingAssessmentsForProgramme(programmeId: string, createdBy?: string | null) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data: programmeRow } = await admin
    .from("training_programmes")
    .select("id, org_id")
    .eq("id", programmeId)
    .maybeSingle();
  if (!programmeRow) return [];

  const { data: moduleData } = await admin
    .from("training_modules")
    .select("*")
    .eq("programme_id", programmeId)
    .order("sequence", { ascending: true });

  const modules = ((moduleData ?? []) as TrainingModuleRow[]).map(mapTrainingModuleRecord);

  return seedTrainingAssessmentsInternal({
    admin,
    orgId: (programmeRow as { org_id: string | null }).org_id,
    programmeId,
    modules,
    createdBy: createdBy ?? null,
  });
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

export async function getTrainingParticipantSessionsByAuthUser(input: {
  authUserId: string;
  email?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return [];

  const normalisedEmail = input.email?.trim().toLowerCase() ?? null;

  const [authMatches, emailMatches] = await Promise.all([
    admin
      .from("training_participants")
      .select("*")
      .eq("auth_user_id", input.authUserId),
    normalisedEmail
      ? admin.from("training_participants").select("*").eq("email", normalisedEmail)
      : Promise.resolve({ data: [] as TrainingParticipantRow[] }),
  ]);

  const seenIds = new Set<string>();
  const participantRows: TrainingParticipantRow[] = [];
  for (const row of [
    ...((authMatches.data ?? []) as TrainingParticipantRow[]),
    ...((emailMatches.data ?? []) as TrainingParticipantRow[]),
  ]) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    participantRows.push(row);
  }

  const sessions = await Promise.all(
    participantRows.map((participantRow) =>
      getTrainingParticipantSessionByRow({ admin, participantRow }),
    ),
  );

  return sessions.filter((session): session is NonNullable<typeof session> => session !== null);
}

export async function submitTrainingParticipantWork(input: {
  participantId: string;
  moduleId: string;
  orgId?: string | null;
  contentItemId?: string | null;
  summary?: string | null;
  artifactUrl?: string | null;
  metadata?: Record<string, unknown>;
  scope?: TrainingScope;
  scopeId?: string | null;
  kind?: TrainingSubmissionKind | null;
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
      scope: input.scope ?? "module",
      scope_id: input.scopeId ?? null,
      kind: input.kind ?? null,
      submitted_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTrainingSubmissionRecord(data as TrainingSubmissionRow);
}

export async function getTrainingSubmissionsForParticipant(input: {
  participantId: string;
  moduleId: string;
  scope?: TrainingScope;
  scopeId?: string | null;
  limit?: number;
}): Promise<TrainingSubmissionRecord[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("training_submissions")
    .select("*")
    .eq("participant_id", input.participantId)
    .eq("module_id", input.moduleId)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(input.limit ?? 100);

  if (input.scope) {
    query = query.eq("scope", input.scope);
  }
  if (typeof input.scopeId === "string") {
    query = query.eq("scope_id", input.scopeId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }
  return (data as TrainingSubmissionRow[]).map(mapTrainingSubmissionRecord);
}

export async function upsertTrainingParticipantNote(input: {
  participantId: string;
  moduleId: string;
  orgId?: string | null;
  scope: TrainingScope;
  scopeId?: string | null;
  bodyMarkdown?: string;
  bodyJson?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<TrainingParticipantNoteRecord | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);
  const scopeId = input.scopeId ?? "";

  const { data, error } = await admin
    .from("training_participant_notes")
    .upsert(
      {
        org_id: orgId,
        platform_key: PLATFORM_TRAINING_KEY,
        participant_id: input.participantId,
        module_id: input.moduleId,
        scope: input.scope,
        scope_id: scopeId,
        body_markdown: input.bodyMarkdown ?? "",
        body_json: input.bodyJson ?? {},
        metadata: input.metadata ?? {},
      },
      { onConflict: "participant_id,module_id,scope,scope_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTrainingParticipantNoteRecord(data as TrainingParticipantNoteRow);
}

export type TrainingEvidenceSummary = {
  byParticipant: Record<
    string,
    {
      participantId: string;
      submissionCount: number;
      notesCount: number;
      sharedNotesCount: number;
      lastSubmissionAt: string | null;
      lastNoteAt: string | null;
    }
  >;
  byCheckpoint: Record<
    string,
    {
      checkpointSlug: string;
      submissionCount: number;
      participantCount: number;
      notesCount: number;
      lastSubmissionAt: string | null;
    }
  >;
  recentSubmissions: TrainingSubmissionRecord[];
};

export async function getTrainingEvidenceSummaryByInvite(input: {
  inviteCode: string;
  moduleSlug: string;
  recentLimit?: number;
}): Promise<TrainingEvidenceSummary | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const resolved = await resolveTrainingCohortAndModuleByInvite(input);
  if (!resolved) {
    return null;
  }

  const participantsResult = await admin
    .from("training_participants")
    .select("id")
    .eq("cohort_id", resolved.cohort.id);

  const participantIdList = ((participantsResult.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const participantIds = new Set(participantIdList);

  if (participantIdList.length === 0) {
    return {
      byParticipant: {},
      byCheckpoint: {},
      recentSubmissions: [],
    };
  }

  const [submissionsResult, notesResult] = await Promise.all([
    admin
      .from("training_submissions")
      .select("*")
      .eq("module_id", resolved.module.id)
      .in("participant_id", participantIdList)
      .order("submitted_at", { ascending: false, nullsFirst: false }),
    admin
      .from("training_participant_notes")
      .select("*")
      .eq("module_id", resolved.module.id)
      .in("participant_id", participantIdList)
      .order("updated_at", { ascending: false }),
  ]);

  const submissionRows = (submissionsResult.data ?? []) as TrainingSubmissionRow[];
  const noteRows = (notesResult.data ?? []) as TrainingParticipantNoteRow[];

  const submissions = submissionRows.map(mapTrainingSubmissionRecord);
  const notes = noteRows.map(mapTrainingParticipantNoteRecord);

  const byParticipant: TrainingEvidenceSummary["byParticipant"] = {};
  for (const id of participantIds) {
    byParticipant[id] = {
      participantId: id,
      submissionCount: 0,
      notesCount: 0,
      sharedNotesCount: 0,
      lastSubmissionAt: null,
      lastNoteAt: null,
    };
  }

  for (const submission of submissions) {
    const entry = byParticipant[submission.participantId];
    if (!entry) continue;
    entry.submissionCount += 1;
    if (
      !entry.lastSubmissionAt ||
      (submission.submittedAt && submission.submittedAt > entry.lastSubmissionAt)
    ) {
      entry.lastSubmissionAt = submission.submittedAt ?? entry.lastSubmissionAt;
    }
  }

  for (const note of notes) {
    const entry = byParticipant[note.participantId];
    if (!entry) continue;
    entry.notesCount += 1;
    const sharedFlag = (note.metadata as Record<string, unknown> | null)?.sharedWithFacilitator;
    if (sharedFlag === true) {
      entry.sharedNotesCount += 1;
    }
    if (!entry.lastNoteAt || (note.updatedAt && note.updatedAt > entry.lastNoteAt)) {
      entry.lastNoteAt = note.updatedAt ?? entry.lastNoteAt;
    }
  }

  const byCheckpoint: TrainingEvidenceSummary["byCheckpoint"] = {};
  function getCheckpointEntry(slug: string) {
    if (!byCheckpoint[slug]) {
      byCheckpoint[slug] = {
        checkpointSlug: slug,
        submissionCount: 0,
        participantCount: 0,
        notesCount: 0,
        lastSubmissionAt: null,
      };
    }
    return byCheckpoint[slug];
  }

  const checkpointParticipants: Record<string, Set<string>> = {};
  for (const submission of submissions) {
    let slug: string | null = null;
    if (submission.scope === "checkpoint" && submission.scopeId) {
      slug = submission.scopeId;
    } else if (submission.scope === "task") {
      const meta = submission.metadata as Record<string, unknown> | null;
      const checkpointSlug = meta?.checkpointSlug;
      if (typeof checkpointSlug === "string") {
        slug = checkpointSlug;
      }
    }
    if (!slug) continue;
    const entry = getCheckpointEntry(slug);
    entry.submissionCount += 1;
    if (
      !entry.lastSubmissionAt ||
      (submission.submittedAt && submission.submittedAt > entry.lastSubmissionAt)
    ) {
      entry.lastSubmissionAt = submission.submittedAt ?? entry.lastSubmissionAt;
    }
    if (!checkpointParticipants[slug]) {
      checkpointParticipants[slug] = new Set();
    }
    checkpointParticipants[slug].add(submission.participantId);
  }

  for (const note of notes) {
    let slug: string | null = null;
    if (note.scope === "checkpoint" && note.scopeId) {
      slug = note.scopeId;
    } else if (note.scope === "task") {
      const meta = note.metadata as Record<string, unknown> | null;
      const checkpointSlug = meta?.checkpointSlug;
      if (typeof checkpointSlug === "string") {
        slug = checkpointSlug;
      }
    }
    if (!slug) continue;
    const entry = getCheckpointEntry(slug);
    entry.notesCount += 1;
  }

  for (const [slug, participants] of Object.entries(checkpointParticipants)) {
    const entry = getCheckpointEntry(slug);
    entry.participantCount = participants.size;
  }

  const recentSubmissions = submissions.slice(0, input.recentLimit ?? 25);

  return { byParticipant, byCheckpoint, recentSubmissions };
}

export async function getTrainingParticipantNotes(input: {
  participantId: string;
  moduleId: string;
  scope?: TrainingScope;
  scopeId?: string | null;
}): Promise<TrainingParticipantNoteRecord[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("training_participant_notes")
    .select("*")
    .eq("participant_id", input.participantId)
    .eq("module_id", input.moduleId)
    .order("updated_at", { ascending: false });

  if (input.scope) {
    query = query.eq("scope", input.scope);
  }
  if (typeof input.scopeId === "string") {
    query = query.eq("scope_id", input.scopeId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }
  return (data as TrainingParticipantNoteRow[]).map(mapTrainingParticipantNoteRecord);
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

export type ProvisionedTrainingParticipant = {
  participant: TrainingParticipantRecord;
  checkInToken: string;
  created: boolean;
};

export type ProvisionInvitedParticipantsResult =
  | { ok: true; cohort: TrainingCohortRecord; participants: ProvisionedTrainingParticipant[] }
  | { ok: false; reason: "invite_not_found" | "write_failed"; message?: string };

export async function provisionInvitedTrainingParticipants(input: {
  inviteCode: string;
  participants: Array<{ fullName: string; email: string; employeeId?: string | null }>;
}): Promise<ProvisionInvitedParticipantsResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, reason: "write_failed", message: "Supabase admin client unavailable." };
  }

  const cohortRow = await resolveTrainingCohortRowByInviteCode(admin, input.inviteCode);
  if (!cohortRow) {
    return { ok: false, reason: "invite_not_found" };
  }

  const orgId = await resolveTrainingWriteOrgId(admin, cohortRow.org_id);
  const now = new Date().toISOString();
  const provisioned: ProvisionedTrainingParticipant[] = [];

  for (const entry of input.participants) {
    const fullName = entry.fullName.trim();
    const normalisedEmail = entry.email.trim().toLowerCase();
    if (!fullName || !normalisedEmail) {
      continue;
    }

    const { data: existingData } = await admin
      .from("training_participants")
      .select("*")
      .eq("cohort_id", cohortRow.id)
      .eq("email", normalisedEmail)
      .maybeSingle();

    const existingRow = (existingData as TrainingParticipantRow | null) ?? null;
    const checkInToken = existingRow?.check_in_token ?? randomUUID();

    const payload: Record<string, unknown> = {
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      cohort_id: cohortRow.id,
      full_name: fullName,
      email: normalisedEmail,
      employee_id: entry.employeeId?.trim() || existingRow?.employee_id || null,
      check_in_token: checkInToken,
      last_seen_at: existingRow?.last_seen_at ?? null,
    };

    if (!existingRow) {
      payload.auth_user_id = null;
      payload.status = "invited";
      payload.checked_in_at = null;
    } else if (!existingRow.check_in_token) {
      payload.status = existingRow.status;
    }

    const mutation = existingRow
      ? admin
          .from("training_participants")
          .update(payload)
          .eq("id", existingRow.id)
          .select("*")
          .single()
      : admin.from("training_participants").insert(payload).select("*").single();

    const { data: participantData, error: participantError } = await mutation;
    if (participantError || !participantData) {
      return {
        ok: false,
        reason: "write_failed",
        message: participantError?.message ?? "Failed to write participant row.",
      };
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
      return { ok: false, reason: "write_failed", message: "Failed to ensure enrollments." };
    }

    provisioned.push({
      participant: mapTrainingParticipantRecord(participantRow),
      checkInToken,
      created: !existingRow,
    });
  }

  return {
    ok: true,
    cohort: mapTrainingCohortRecord(cohortRow),
    participants: provisioned,
  };
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
    | "assessment_response_saved"
    | "assessment_submitted"
    | "assessment_graded"
    | "module_completed"
    | "certificate_issued";
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

export type AssessmentRecord = {
  id: string;
  orgId: string | null;
  programmeId: string;
  moduleId: string;
  slug: string;
  title: string;
  description: string;
  kind: "activity" | "homework" | "quiz" | "module_test";
  sequence: number;
  estimatedMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  isRequired: boolean;
  blocksModuleCompletion: boolean;
  facilitatorReviewRequired: boolean;
  metadata: Record<string, unknown>;
};

export type AssessmentQuestionRecord = {
  id: string;
  assessmentId: string;
  slug: string;
  prompt: string;
  questionType:
    | "multiple_choice"
    | "multi_select"
    | "short_answer"
    | "long_answer"
    | "code"
    | "notebook_task"
    | "file_upload";
  sequence: number;
  points: number;
  rubric: Array<{ criterion: string; weight: number; descriptor: string }>;
  options: Array<{ id: string; label: string }>;
  correctAnswer: unknown;
  validators: Array<Record<string, unknown>>;
  facilitatorNotes: string | null;
};

export type AssessmentAttemptRecord = {
  id: string;
  orgId: string | null;
  cohortId: string;
  assessmentId: string;
  participantId: string;
  enrollmentId: string | null;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "graded" | "returned" | "abandoned";
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  autoGraded: boolean;
  facilitatorReviewStatus: "not_required" | "pending" | "approved" | "changes_requested";
  facilitatorUserId: string | null;
  facilitatorFeedback: string | null;
  metadata: Record<string, unknown>;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentResponseRecord = {
  id: string;
  orgId: string | null;
  attemptId: string;
  questionId: string;
  response: Record<string, unknown>;
  isCorrect: boolean | null;
  awardedPoints: number | null;
  autoGradeSummary: Record<string, unknown> | null;
  facilitatorFeedback: string | null;
  flaggedForReview: boolean;
  metadata: Record<string, unknown>;
  respondedAt: string;
  gradedAt: string | null;
};

type TrainingAssessmentDbRow = {
  id: string;
  org_id: string | null;
  programme_id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string;
  kind: AssessmentRecord["kind"];
  sequence: number;
  estimated_minutes: number | null;
  passing_score: number | string;
  max_attempts: number | null;
  is_required: boolean;
  blocks_module_completion: boolean;
  facilitator_review_required: boolean;
  metadata: Record<string, unknown> | null;
};

type TrainingAssessmentQuestionDbRow = {
  id: string;
  assessment_id: string;
  slug: string;
  prompt: string;
  question_type: AssessmentQuestionRecord["questionType"];
  sequence: number;
  points: number | string;
  rubric: AssessmentQuestionRecord["rubric"] | null;
  options: AssessmentQuestionRecord["options"] | null;
  correct_answer: unknown;
  validators: Array<Record<string, unknown>> | null;
  facilitator_notes: string | null;
};

type TrainingAssessmentAttemptDbRow = {
  id: string;
  org_id: string | null;
  cohort_id: string;
  assessment_id: string;
  participant_id: string;
  enrollment_id: string | null;
  attempt_number: number;
  status: AssessmentAttemptRecord["status"];
  score: number | string | null;
  max_score: number | string | null;
  passed: boolean | null;
  auto_graded: boolean;
  facilitator_review_status: AssessmentAttemptRecord["facilitatorReviewStatus"];
  facilitator_user_id: string | null;
  facilitator_feedback: string | null;
  metadata: Record<string, unknown> | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrainingAssessmentResponseDbRow = {
  id: string;
  org_id: string | null;
  attempt_id: string;
  question_id: string;
  response: Record<string, unknown> | null;
  is_correct: boolean | null;
  awarded_points: number | string | null;
  auto_grade_summary: Record<string, unknown> | null;
  facilitator_feedback: string | null;
  flagged_for_review: boolean;
  metadata: Record<string, unknown> | null;
  responded_at: string;
  graded_at: string | null;
};

function mapAssessmentRecord(row: TrainingAssessmentDbRow): AssessmentRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    programmeId: row.programme_id,
    moduleId: row.module_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    sequence: row.sequence,
    estimatedMinutes: row.estimated_minutes,
    passingScore: Number(row.passing_score),
    maxAttempts: row.max_attempts,
    isRequired: row.is_required,
    blocksModuleCompletion: row.blocks_module_completion,
    facilitatorReviewRequired: row.facilitator_review_required,
    metadata: row.metadata ?? {},
  };
}

function mapAssessmentQuestionRecord(row: TrainingAssessmentQuestionDbRow): AssessmentQuestionRecord {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    slug: row.slug,
    prompt: row.prompt,
    questionType: row.question_type,
    sequence: row.sequence,
    points: Number(row.points),
    rubric: row.rubric ?? [],
    options: row.options ?? [],
    correctAnswer: row.correct_answer,
    validators: row.validators ?? [],
    facilitatorNotes: row.facilitator_notes,
  };
}

function mapAssessmentAttemptRecord(row: TrainingAssessmentAttemptDbRow): AssessmentAttemptRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    cohortId: row.cohort_id,
    assessmentId: row.assessment_id,
    participantId: row.participant_id,
    enrollmentId: row.enrollment_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    score: row.score === null ? null : Number(row.score),
    maxScore: row.max_score === null ? null : Number(row.max_score),
    passed: row.passed,
    autoGraded: row.auto_graded,
    facilitatorReviewStatus: row.facilitator_review_status,
    facilitatorUserId: row.facilitator_user_id,
    facilitatorFeedback: row.facilitator_feedback,
    metadata: row.metadata ?? {},
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    gradedAt: row.graded_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAssessmentResponseRecord(row: TrainingAssessmentResponseDbRow): AssessmentResponseRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    attemptId: row.attempt_id,
    questionId: row.question_id,
    response: row.response ?? {},
    isCorrect: row.is_correct,
    awardedPoints: row.awarded_points === null ? null : Number(row.awarded_points),
    autoGradeSummary: row.auto_grade_summary,
    facilitatorFeedback: row.facilitator_feedback,
    flaggedForReview: row.flagged_for_review,
    metadata: row.metadata ?? {},
    respondedAt: row.responded_at,
    gradedAt: row.graded_at,
  };
}

export async function getAssessmentsForModule(moduleId: string): Promise<{
  assessments: AssessmentRecord[];
  questionsByAssessmentId: Record<string, AssessmentQuestionRecord[]>;
}> {
  const admin = createAdminClient();
  if (!admin) return { assessments: [], questionsByAssessmentId: {} };

  const { data: assessmentRows } = await admin
    .from("training_assessments")
    .select("*")
    .eq("module_id", moduleId)
    .order("sequence", { ascending: true });

  const assessments = ((assessmentRows ?? []) as TrainingAssessmentDbRow[]).map(mapAssessmentRecord);
  if (assessments.length === 0) {
    return { assessments, questionsByAssessmentId: {} };
  }

  const { data: questionRows } = await admin
    .from("training_assessment_questions")
    .select("*")
    .in(
      "assessment_id",
      assessments.map((assessment) => assessment.id),
    )
    .order("sequence", { ascending: true });

  const questionsByAssessmentId: Record<string, AssessmentQuestionRecord[]> = {};
  for (const row of (questionRows ?? []) as TrainingAssessmentQuestionDbRow[]) {
    const record = mapAssessmentQuestionRecord(row);
    if (!questionsByAssessmentId[record.assessmentId]) {
      questionsByAssessmentId[record.assessmentId] = [];
    }
    questionsByAssessmentId[record.assessmentId].push(record);
  }

  return { assessments, questionsByAssessmentId };
}

export async function getAssessmentBySlug(input: { moduleId: string; slug: string }) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: assessmentRow } = await admin
    .from("training_assessments")
    .select("*")
    .eq("module_id", input.moduleId)
    .eq("slug", input.slug)
    .maybeSingle();

  if (!assessmentRow) return null;
  const assessment = mapAssessmentRecord(assessmentRow as TrainingAssessmentDbRow);

  const { data: questionRows } = await admin
    .from("training_assessment_questions")
    .select("*")
    .eq("assessment_id", assessment.id)
    .order("sequence", { ascending: true });

  const questions = ((questionRows ?? []) as TrainingAssessmentQuestionDbRow[]).map(mapAssessmentQuestionRecord);
  return { assessment, questions };
}

export async function getAssessmentAttemptsForParticipant(input: {
  participantId: string;
  assessmentId?: string;
}) {
  const admin = createAdminClient();
  if (!admin) return [] as AssessmentAttemptRecord[];

  const query = admin
    .from("training_assessment_attempts")
    .select("*")
    .eq("participant_id", input.participantId)
    .order("attempt_number", { ascending: false });

  if (input.assessmentId) {
    query.eq("assessment_id", input.assessmentId);
  }

  const { data } = await query;
  return ((data ?? []) as TrainingAssessmentAttemptDbRow[]).map(mapAssessmentAttemptRecord);
}

export async function getAssessmentResponsesForAttempt(attemptId: string) {
  const admin = createAdminClient();
  if (!admin) return [] as AssessmentResponseRecord[];

  const { data } = await admin
    .from("training_assessment_responses")
    .select("*")
    .eq("attempt_id", attemptId);

  return ((data ?? []) as TrainingAssessmentResponseDbRow[]).map(mapAssessmentResponseRecord);
}

export async function startOrResumeAssessmentAttempt(input: {
  assessment: AssessmentRecord;
  cohortId: string;
  participantId: string;
  enrollmentId: string | null;
  orgId?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const existing = await admin
    .from("training_assessment_attempts")
    .select("*")
    .eq("assessment_id", input.assessment.id)
    .eq("participant_id", input.participantId)
    .order("attempt_number", { ascending: false });

  const attempts = ((existing.data ?? []) as TrainingAssessmentAttemptDbRow[]).map(mapAssessmentAttemptRecord);
  const inProgress = attempts.find((attempt) => attempt.status === "in_progress");
  if (inProgress) {
    return inProgress;
  }

  const completedCount = attempts.filter((attempt) =>
    ["submitted", "graded", "returned"].includes(attempt.status),
  ).length;
  if (input.assessment.maxAttempts !== null && completedCount >= input.assessment.maxAttempts) {
    return null;
  }

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);

  const { data } = await admin
    .from("training_assessment_attempts")
    .insert({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      cohort_id: input.cohortId,
      assessment_id: input.assessment.id,
      participant_id: input.participantId,
      enrollment_id: input.enrollmentId,
      attempt_number: completedCount + 1,
      status: "in_progress",
      auto_graded: false,
      facilitator_review_status: input.assessment.facilitatorReviewRequired ? "pending" : "not_required",
    })
    .select("*")
    .single();

  return data ? mapAssessmentAttemptRecord(data as TrainingAssessmentAttemptDbRow) : null;
}

export async function upsertAssessmentResponse(input: {
  attemptId: string;
  questionId: string;
  response: Record<string, unknown>;
  isCorrect?: boolean | null;
  awardedPoints?: number | null;
  autoGradeSummary?: Record<string, unknown> | null;
  flaggedForReview?: boolean;
  orgId?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);

  const { data } = await admin
    .from("training_assessment_responses")
    .upsert(
      {
        org_id: orgId,
        platform_key: PLATFORM_TRAINING_KEY,
        attempt_id: input.attemptId,
        question_id: input.questionId,
        response: input.response,
        is_correct: input.isCorrect ?? null,
        awarded_points: input.awardedPoints ?? null,
        auto_grade_summary: input.autoGradeSummary ?? null,
        flagged_for_review: input.flaggedForReview ?? false,
        responded_at: new Date().toISOString(),
        graded_at: input.isCorrect !== null && input.isCorrect !== undefined ? new Date().toISOString() : null,
      },
      { onConflict: "attempt_id,question_id" },
    )
    .select("*")
    .single();

  return data ? mapAssessmentResponseRecord(data as TrainingAssessmentResponseDbRow) : null;
}

export async function finalizeAssessmentAttempt(input: {
  attemptId: string;
  status: AssessmentAttemptRecord["status"];
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  autoGraded: boolean;
  facilitatorReviewStatus?: AssessmentAttemptRecord["facilitatorReviewStatus"];
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: input.status,
    score: input.score,
    max_score: input.maxScore,
    passed: input.passed,
    auto_graded: input.autoGraded,
    submitted_at: now,
  };

  if (input.facilitatorReviewStatus) {
    update.facilitator_review_status = input.facilitatorReviewStatus;
  }
  if (input.status === "graded") {
    update.graded_at = now;
  }
  if (input.metadata) {
    update.metadata = input.metadata;
  }

  const { data } = await admin
    .from("training_assessment_attempts")
    .update(update)
    .eq("id", input.attemptId)
    .select("*")
    .single();

  return data ? mapAssessmentAttemptRecord(data as TrainingAssessmentAttemptDbRow) : null;
}

export async function listAssessmentAttemptsForCohort(input: {
  cohortId: string;
  status?: AssessmentAttemptRecord["status"][];
}) {
  const admin = createAdminClient();
  if (!admin) return [] as AssessmentAttemptRecord[];

  const query = admin
    .from("training_assessment_attempts")
    .select("*")
    .eq("cohort_id", input.cohortId)
    .order("submitted_at", { ascending: false });

  if (input.status && input.status.length > 0) {
    query.in("status", input.status);
  }

  const { data } = await query;
  return ((data ?? []) as TrainingAssessmentAttemptDbRow[]).map(mapAssessmentAttemptRecord);
}

export async function listAssessmentAttemptsPendingReview() {
  const admin = createAdminClient();
  if (!admin) return [] as AssessmentAttemptRecord[];

  const { data } = await admin
    .from("training_assessment_attempts")
    .select("*")
    .eq("facilitator_review_status", "pending")
    .order("submitted_at", { ascending: false });

  return ((data ?? []) as TrainingAssessmentAttemptDbRow[]).map(mapAssessmentAttemptRecord);
}

export async function recordFacilitatorAssessmentReview(input: {
  attemptId: string;
  facilitatorUserId: string;
  decision: "approved" | "changes_requested";
  feedback?: string | null;
  scoreOverride?: number | null;
  passed?: boolean | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    facilitator_review_status: input.decision,
    facilitator_user_id: input.facilitatorUserId,
    facilitator_feedback: input.feedback ?? null,
    reviewed_at: now,
  };

  if (input.decision === "approved") {
    update.status = "graded";
    update.graded_at = now;
    if (typeof input.scoreOverride === "number") {
      update.score = input.scoreOverride;
    }
    if (typeof input.passed === "boolean") {
      update.passed = input.passed;
    }
  } else {
    update.status = "returned";
    update.passed = false;
  }

  const { data } = await admin
    .from("training_assessment_attempts")
    .update(update)
    .eq("id", input.attemptId)
    .select("*")
    .single();

  return data ? mapAssessmentAttemptRecord(data as TrainingAssessmentAttemptDbRow) : null;
}

export type TrainingCertificateRecord = {
  id: string;
  orgId: string | null;
  programmeId: string;
  cohortId: string;
  participantId: string;
  status: "issued" | "revoked";
  serial: string;
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  moduleBreakdown: Array<{
    moduleSlug: string;
    moduleTitle: string;
    score: number | null;
    passedAt: string | null;
  }>;
  metadata: Record<string, unknown>;
};

type TrainingCertificateDbRow = {
  id: string;
  org_id: string | null;
  programme_id: string;
  cohort_id: string;
  participant_id: string;
  status: TrainingCertificateRecord["status"];
  serial: string;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  module_breakdown: TrainingCertificateRecord["moduleBreakdown"] | null;
  metadata: Record<string, unknown> | null;
};

function mapCertificateRecord(row: TrainingCertificateDbRow): TrainingCertificateRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    programmeId: row.programme_id,
    cohortId: row.cohort_id,
    participantId: row.participant_id,
    status: row.status,
    serial: row.serial,
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
    moduleBreakdown: row.module_breakdown ?? [],
    metadata: row.metadata ?? {},
  };
}

export async function getCertificateForParticipant(input: { programmeId: string; participantId: string }) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("training_certificates")
    .select("*")
    .eq("programme_id", input.programmeId)
    .eq("participant_id", input.participantId)
    .maybeSingle();

  return data ? mapCertificateRecord(data as TrainingCertificateDbRow) : null;
}

export async function evaluateCertificateEligibility(input: {
  participantId: string;
  programmeId: string;
}): Promise<{
  eligible: boolean;
  modulesTotal: number;
  modulesPassed: number;
  breakdown: TrainingCertificateRecord["moduleBreakdown"];
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { eligible: false, modulesTotal: 0, modulesPassed: 0, breakdown: [] };
  }

  const { data: moduleRows } = await admin
    .from("training_modules")
    .select("id, slug, title")
    .eq("programme_id", input.programmeId)
    .order("sequence", { ascending: true });
  const modules = (moduleRows ?? []) as Array<{ id: string; slug: string; title: string }>;
  if (modules.length === 0) {
    return { eligible: false, modulesTotal: 0, modulesPassed: 0, breakdown: [] };
  }

  const moduleIds = modules.map((module) => module.id);

  const { data: assessmentRows } = await admin
    .from("training_assessments")
    .select("id, module_id, blocks_module_completion, kind")
    .in("module_id", moduleIds)
    .eq("kind", "module_test");
  const moduleTests = (assessmentRows ?? []) as Array<{
    id: string;
    module_id: string;
    blocks_module_completion: boolean;
    kind: string;
  }>;
  const moduleTestByModuleId = new Map<string, string>();
  for (const test of moduleTests) {
    moduleTestByModuleId.set(test.module_id, test.id);
  }

  const requiredAssessmentIds = moduleTests.map((test) => test.id);
  if (requiredAssessmentIds.length === 0) {
    return { eligible: false, modulesTotal: modules.length, modulesPassed: 0, breakdown: [] };
  }

  const { data: attemptRows } = await admin
    .from("training_assessment_attempts")
    .select("assessment_id, score, passed, status, graded_at")
    .eq("participant_id", input.participantId)
    .in("assessment_id", requiredAssessmentIds);

  const passedByAssessmentId = new Map<
    string,
    { score: number | null; passedAt: string | null }
  >();
  for (const attempt of (attemptRows ?? []) as Array<{
    assessment_id: string;
    score: number | string | null;
    passed: boolean | null;
    status: string;
    graded_at: string | null;
  }>) {
    if (attempt.passed === true && attempt.status === "graded") {
      const existing = passedByAssessmentId.get(attempt.assessment_id);
      const score = attempt.score === null ? null : Number(attempt.score);
      if (!existing || (score !== null && (existing.score ?? -1) < score)) {
        passedByAssessmentId.set(attempt.assessment_id, {
          score,
          passedAt: attempt.graded_at,
        });
      }
    }
  }

  const breakdown: TrainingCertificateRecord["moduleBreakdown"] = modules.map((module) => {
    const testId = moduleTestByModuleId.get(module.id) ?? null;
    const passedInfo = testId ? passedByAssessmentId.get(testId) ?? null : null;
    return {
      moduleSlug: module.slug,
      moduleTitle: module.title,
      score: passedInfo?.score ?? null,
      passedAt: passedInfo?.passedAt ?? null,
    };
  });

  const modulesPassed = breakdown.filter((entry) => entry.passedAt !== null).length;
  const eligible = modulesPassed === modules.length;

  return { eligible, modulesTotal: modules.length, modulesPassed, breakdown };
}

export async function issueCertificateIfEligible(input: {
  participantId: string;
  programmeId: string;
  cohortId: string;
  orgId?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const existing = await getCertificateForParticipant({
    programmeId: input.programmeId,
    participantId: input.participantId,
  });
  if (existing && existing.status === "issued") {
    return { certificate: existing, issuedNow: false };
  }

  const eligibility = await evaluateCertificateEligibility({
    participantId: input.participantId,
    programmeId: input.programmeId,
  });
  if (!eligibility.eligible) {
    return { certificate: null, issuedNow: false, eligibility };
  }

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);
  const serial = `${input.cohortId.slice(0, 8)}-${input.participantId.slice(0, 8)}-${Date.now().toString(36)}`.toUpperCase();

  const { data } = await admin
    .from("training_certificates")
    .insert({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      programme_id: input.programmeId,
      cohort_id: input.cohortId,
      participant_id: input.participantId,
      status: "issued",
      serial,
      module_breakdown: eligibility.breakdown,
      metadata: {
        modulesTotal: eligibility.modulesTotal,
        modulesPassed: eligibility.modulesPassed,
      },
    })
    .select("*")
    .single();

  if (!data) return { certificate: null, issuedNow: false, eligibility };
  return {
    certificate: mapCertificateRecord(data as TrainingCertificateDbRow),
    issuedNow: true,
    eligibility,
  };
}

export async function getCompletedLabSnapshotForParticipant(input: {
  participantId: string;
  moduleId: string;
}) {
  const admin = createAdminClient();
  if (!admin) {
    return {
      taskCheckIds: new Set<string>(),
      labSlugsCompleted: new Set<string>(),
    };
  }

  const { data } = await admin
    .from("training_progress_events")
    .select("event_type, metadata")
    .eq("participant_id", input.participantId)
    .eq("module_id", input.moduleId)
    .in("event_type", ["lab_completed"]);

  const taskCheckIds = new Set<string>();
  const labSlugsCompleted = new Set<string>();

  for (const row of (data ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const metadata = row.metadata ?? {};
    if (typeof metadata.labSlug === "string") {
      labSlugsCompleted.add(metadata.labSlug);
    }
    if (Array.isArray(metadata.taskCheckIds)) {
      for (const id of metadata.taskCheckIds) {
        if (typeof id === "string") taskCheckIds.add(id);
      }
    }
    if (typeof metadata.taskCheckId === "string") {
      taskCheckIds.add(metadata.taskCheckId);
    }
  }

  return { taskCheckIds, labSlugsCompleted };
}

function deriveDisplayName(participant: TrainingParticipantRecord): string {
  const explicit = participant.displayName?.trim();
  if (explicit) return explicit;
  const full = participant.fullName?.trim();
  if (full) return full;
  return participant.email;
}

export async function updateTrainingParticipantProfile(input: {
  participantId: string;
  displayName?: string | null;
  roleAtCompany?: string | null;
  bio?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const update: Record<string, unknown> = {};
  if (input.displayName !== undefined) {
    const trimmed = input.displayName?.trim();
    update.display_name = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (input.roleAtCompany !== undefined) {
    const trimmed = input.roleAtCompany?.trim();
    update.role_at_company = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (input.bio !== undefined) {
    const trimmed = input.bio?.trim();
    update.bio = trimmed && trimmed.length > 0 ? trimmed : null;
  }

  if (Object.keys(update).length === 0) {
    const { data } = await admin
      .from("training_participants")
      .select("*")
      .eq("id", input.participantId)
      .maybeSingle();
    return data ? mapTrainingParticipantRecord(data as TrainingParticipantRow) : null;
  }

  const { data, error } = await admin
    .from("training_participants")
    .update(update)
    .eq("id", input.participantId)
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTrainingParticipantRecord(data as TrainingParticipantRow);
}

function mapCohortFeedPost(input: {
  row: TrainingCohortPostRow;
  participant?: TrainingParticipantRecord | null;
  facilitatorDisplayName?: string | null;
}): TrainingCohortPostRecord {
  if (input.row.participant_id && input.participant) {
    const displayName = deriveDisplayName(input.participant);
    return {
      id: input.row.id,
      orgId: input.row.org_id,
      cohortId: input.row.cohort_id,
      participantId: input.row.participant_id,
      facilitatorUserId: null,
      body: input.row.body,
      metadata: input.row.metadata ?? {},
      createdAt: input.row.created_at,
      updatedAt: input.row.updated_at,
      author: {
        kind: "participant",
        participantId: input.participant.id,
        displayName,
        roleAtCompany: input.participant.roleAtCompany ?? null,
      },
    };
  }

  return {
    id: input.row.id,
    orgId: input.row.org_id,
    cohortId: input.row.cohort_id,
    participantId: input.row.participant_id,
    facilitatorUserId: input.row.facilitator_user_id,
    body: input.row.body,
    metadata: input.row.metadata ?? {},
    createdAt: input.row.created_at,
    updatedAt: input.row.updated_at,
    author: {
      kind: "facilitator",
      facilitatorUserId: input.row.facilitator_user_id,
      displayName: input.facilitatorDisplayName?.trim() || "Facilitator",
      roleAtCompany: "Facilitator",
    },
  };
}

export async function listTrainingCohortFeed(input: {
  cohortId: string;
  limit?: number;
}): Promise<TrainingCohortPostRecord[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const { data: postRows } = await admin
    .from("training_cohort_posts")
    .select("*")
    .eq("cohort_id", input.cohortId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (postRows ?? []) as TrainingCohortPostRow[];
  if (rows.length === 0) return [];

  const participantIds = Array.from(
    new Set(rows.map((row) => row.participant_id).filter((value): value is string => Boolean(value))),
  );

  const participantById = new Map<string, TrainingParticipantRecord>();
  if (participantIds.length > 0) {
    const { data: participantRows } = await admin
      .from("training_participants")
      .select("*")
      .in("id", participantIds);

    for (const participantRow of (participantRows ?? []) as TrainingParticipantRow[]) {
      participantById.set(participantRow.id, mapTrainingParticipantRecord(participantRow));
    }
  }

  return rows.map((row) =>
    mapCohortFeedPost({
      row,
      participant: row.participant_id ? participantById.get(row.participant_id) ?? null : null,
    }),
  );
}

export async function createTrainingCohortPost(input: {
  cohortId: string;
  body: string;
  participantId?: string | null;
  facilitatorUserId?: string | null;
  orgId?: string | null;
}): Promise<TrainingCohortPostRecord | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const trimmedBody = input.body.trim();
  if (trimmedBody.length === 0) return null;

  const hasParticipant = Boolean(input.participantId);
  const hasFacilitator = Boolean(input.facilitatorUserId);
  if (hasParticipant === hasFacilitator) {
    return null;
  }

  const orgId = await resolveTrainingWriteOrgId(admin, input.orgId ?? null);

  const { data, error } = await admin
    .from("training_cohort_posts")
    .insert({
      org_id: orgId,
      platform_key: PLATFORM_TRAINING_KEY,
      cohort_id: input.cohortId,
      participant_id: input.participantId ?? null,
      facilitator_user_id: input.facilitatorUserId ?? null,
      body: trimmedBody,
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as TrainingCohortPostRow;
  let participant: TrainingParticipantRecord | null = null;
  if (row.participant_id) {
    const { data: participantData } = await admin
      .from("training_participants")
      .select("*")
      .eq("id", row.participant_id)
      .maybeSingle();
    participant = participantData
      ? mapTrainingParticipantRecord(participantData as TrainingParticipantRow)
      : null;
  }

  return mapCohortFeedPost({ row, participant });
}

