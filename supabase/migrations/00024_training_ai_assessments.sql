-- AI-primary assessor records. Each row is a structured AI evaluation of a
-- training submission. Rule-based check signals are stored alongside so
-- facilitators can see what the grader saw.

create table if not exists public.training_ai_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  submission_id uuid not null references public.training_submissions(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  task_id text,
  checkpoint_slug text,
  score_band text not null,
  criterion_scores jsonb not null default '[]'::jsonb,
  summary text not null default '',
  suggested_next_step text not null default '',
  rule_signals jsonb not null default '[]'::jsonb,
  model text,
  status text not null default 'completed',
  facilitator_override jsonb,
  facilitator_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_ai_assessments_score_band_check check (
    score_band in ('proficient', 'developing', 'needs_retry', 'not_graded')
  ),
  constraint training_ai_assessments_status_check check (
    status in ('completed', 'failed', 'skipped')
  )
);

create index if not exists training_ai_assessments_submission_idx
  on public.training_ai_assessments (submission_id);

create index if not exists training_ai_assessments_participant_module_idx
  on public.training_ai_assessments (participant_id, module_id, created_at desc);

alter table public.training_ai_assessments enable row level security;

-- Org-scoped read. Writes are server-only via service-role; we gate inserts
-- to the current org so the policy is symmetric with sibling tables.
create policy "training_ai_assessments_select" on public.training_ai_assessments
  for select using (org_id is null or org_id = public.current_org_id());
create policy "training_ai_assessments_insert" on public.training_ai_assessments
  for insert with check (org_id is null or org_id = public.current_org_id());
create policy "training_ai_assessments_update" on public.training_ai_assessments
  for update using (org_id is null or org_id = public.current_org_id());

drop trigger if exists set_updated_at_training_ai_assessments on public.training_ai_assessments;
create trigger set_updated_at_training_ai_assessments
  before update on public.training_ai_assessments
  for each row execute function public.set_updated_at();

create trigger audit_training_ai_assessments after insert or update on public.training_ai_assessments
  for each row execute function public.audit_trigger();
