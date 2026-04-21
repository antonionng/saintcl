-- Training assessment engine: activities, homework, quizzes, end-of-module tests,
-- and program certificates. Layered on top of the existing training schema.

create table if not exists public.training_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  programme_id uuid not null references public.training_programmes(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  kind text not null,
  sequence integer not null default 0,
  estimated_minutes integer,
  passing_score numeric(5,2) not null default 70,
  max_attempts integer,
  is_required boolean not null default true,
  blocks_module_completion boolean not null default false,
  facilitator_review_required boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  source_blueprint text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  constraint training_assessments_kind_check check (
    kind in ('activity', 'homework', 'quiz', 'module_test')
  ),
  constraint training_assessments_passing_score_check check (
    passing_score >= 0 and passing_score <= 100
  ),
  constraint training_assessments_max_attempts_check check (
    max_attempts is null or max_attempts > 0
  )
);

create table if not exists public.training_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  assessment_id uuid not null references public.training_assessments(id) on delete cascade,
  slug text not null,
  prompt text not null,
  question_type text not null,
  sequence integer not null default 0,
  points numeric(6,2) not null default 1,
  rubric jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  validators jsonb not null default '[]'::jsonb,
  facilitator_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, slug),
  unique (assessment_id, sequence),
  constraint training_assessment_questions_type_check check (
    question_type in (
      'multiple_choice',
      'multi_select',
      'short_answer',
      'long_answer',
      'code',
      'notebook_task',
      'file_upload'
    )
  ),
  constraint training_assessment_questions_points_check check (points >= 0)
);

create table if not exists public.training_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  assessment_id uuid not null references public.training_assessments(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  enrollment_id uuid references public.training_enrollments(id) on delete set null,
  attempt_number integer not null default 1,
  status text not null default 'in_progress',
  score numeric(6,2),
  max_score numeric(6,2),
  passed boolean,
  auto_graded boolean not null default false,
  facilitator_review_status text not null default 'not_required',
  facilitator_user_id uuid references auth.users(id) on delete set null,
  facilitator_feedback text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, participant_id, attempt_number),
  constraint training_assessment_attempts_status_check check (
    status in ('in_progress', 'submitted', 'graded', 'returned', 'abandoned')
  ),
  constraint training_assessment_attempts_review_check check (
    facilitator_review_status in ('not_required', 'pending', 'approved', 'changes_requested')
  ),
  constraint training_assessment_attempts_score_check check (
    score is null or score >= 0
  ),
  constraint training_assessment_attempts_attempt_number_check check (attempt_number > 0)
);

create table if not exists public.training_assessment_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  attempt_id uuid not null references public.training_assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.training_assessment_questions(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  awarded_points numeric(6,2),
  auto_grade_summary jsonb,
  facilitator_feedback text,
  flagged_for_review boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  responded_at timestamptz not null default now(),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  constraint training_assessment_responses_points_check check (
    awarded_points is null or awarded_points >= 0
  )
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  programme_id uuid not null references public.training_programmes(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  status text not null default 'issued',
  serial text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  module_breakdown jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, participant_id),
  unique (serial),
  constraint training_certificates_status_check check (status in ('issued', 'revoked'))
);

create index if not exists training_assessments_module_kind_idx
  on public.training_assessments (module_id, kind, sequence);

create index if not exists training_assessments_programme_idx
  on public.training_assessments (programme_id, kind);

create index if not exists training_assessment_questions_assessment_seq_idx
  on public.training_assessment_questions (assessment_id, sequence);

create index if not exists training_assessment_attempts_participant_idx
  on public.training_assessment_attempts (participant_id, status, updated_at desc);

create index if not exists training_assessment_attempts_cohort_idx
  on public.training_assessment_attempts (cohort_id, assessment_id, status);

create index if not exists training_assessment_responses_attempt_idx
  on public.training_assessment_responses (attempt_id, question_id);

create index if not exists training_certificates_cohort_idx
  on public.training_certificates (cohort_id, status, issued_at desc);

alter table public.training_assessments enable row level security;
alter table public.training_assessment_questions enable row level security;
alter table public.training_assessment_attempts enable row level security;
alter table public.training_assessment_responses enable row level security;
alter table public.training_certificates enable row level security;

-- Blueprints: org members can browse, org admins can edit (mirrors training_modules).
create policy "training_assessments_select" on public.training_assessments
  for select using (org_id = public.current_org_id());
create policy "training_assessments_insert" on public.training_assessments
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_assessments_update" on public.training_assessments
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_assessments_delete" on public.training_assessments
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_assessment_questions_select" on public.training_assessment_questions
  for select using (org_id = public.current_org_id());
create policy "training_assessment_questions_insert" on public.training_assessment_questions
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_assessment_questions_update" on public.training_assessment_questions
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_assessment_questions_delete" on public.training_assessment_questions
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

-- Attempts and responses: org-scoped read, server-side writes via service-role.
-- Authenticated participants and facilitators read through org membership; the
-- API layer enforces participant <-> attempt ownership before returning rows.
create policy "training_assessment_attempts_select" on public.training_assessment_attempts
  for select using (org_id = public.current_org_id());
create policy "training_assessment_attempts_insert" on public.training_assessment_attempts
  for insert with check (org_id = public.current_org_id());
create policy "training_assessment_attempts_update" on public.training_assessment_attempts
  for update using (org_id = public.current_org_id());

create policy "training_assessment_responses_select" on public.training_assessment_responses
  for select using (org_id = public.current_org_id());
create policy "training_assessment_responses_insert" on public.training_assessment_responses
  for insert with check (org_id = public.current_org_id());
create policy "training_assessment_responses_update" on public.training_assessment_responses
  for update using (org_id = public.current_org_id());

create policy "training_certificates_select" on public.training_certificates
  for select using (org_id = public.current_org_id());
create policy "training_certificates_insert" on public.training_certificates
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_certificates_update" on public.training_certificates
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_certificates_delete" on public.training_certificates
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

drop trigger if exists set_updated_at_training_assessments on public.training_assessments;
create trigger set_updated_at_training_assessments
  before update on public.training_assessments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_assessment_questions on public.training_assessment_questions;
create trigger set_updated_at_training_assessment_questions
  before update on public.training_assessment_questions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_assessment_attempts on public.training_assessment_attempts;
create trigger set_updated_at_training_assessment_attempts
  before update on public.training_assessment_attempts
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_assessment_responses on public.training_assessment_responses;
create trigger set_updated_at_training_assessment_responses
  before update on public.training_assessment_responses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_certificates on public.training_certificates;
create trigger set_updated_at_training_certificates
  before update on public.training_certificates
  for each row execute function public.set_updated_at();

create trigger audit_training_assessments after insert or update on public.training_assessments
  for each row execute function public.audit_trigger();
create trigger audit_training_assessment_questions after insert or update on public.training_assessment_questions
  for each row execute function public.audit_trigger();
create trigger audit_training_assessment_attempts after insert or update on public.training_assessment_attempts
  for each row execute function public.audit_trigger();
create trigger audit_training_assessment_responses after insert or update on public.training_assessment_responses
  for each row execute function public.audit_trigger();
create trigger audit_training_certificates after insert or update on public.training_certificates
  for each row execute function public.audit_trigger();

-- Extend the progress event type allowlist to cover new assessment lifecycle events.
alter table public.training_progress_events
  drop constraint if exists training_progress_events_type_check;
alter table public.training_progress_events
  add constraint training_progress_events_type_check check (
    event_type in (
      'check_in',
      'slide_viewed',
      'slide_completed',
      'lab_launched',
      'lab_completed',
      'assessment_started',
      'assessment_response_saved',
      'assessment_submitted',
      'assessment_graded',
      'module_completed',
      'certificate_issued'
    )
  );
