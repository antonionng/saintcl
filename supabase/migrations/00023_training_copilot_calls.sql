-- Per-call audit log for the participant Copilot. Every OpenRouter call made
-- from a notebook or the academy Studio writes one row here so facilitators
-- can see how each participant is using GenAI per module and per exercise,
-- and so any AJB review can reconstruct what was sent and what came back.
--
-- This is intentionally a separate table from request_events because:
--   * request_events writes are gated on is_org_admin() and are scoped to
--     real org runtime traffic, while training participants are not org
--     members and platform training rows often have org_id = null.
--   * The Copilot needs richer per-exercise scoping (scope, scope_id,
--     exercise_id) and a record of the exact prompt characters seen.

create table if not exists public.training_copilot_calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  request_id uuid not null default gen_random_uuid(),
  scope text not null default 'notebook',
  scope_id text,
  exercise_id text,
  surface text not null default 'notebook',
  intent text not null default 'ask',
  model text not null,
  default_model text,
  requested_model text,
  system_prompt text,
  prompt_chars integer not null default 0,
  output_chars integer not null default 0,
  prompt_redacted boolean not null default false,
  redactions integer not null default 0,
  temperature numeric,
  max_tokens integer,
  input_tokens bigint,
  output_tokens bigint,
  total_tokens bigint,
  cost_usd numeric,
  latency_ms integer,
  status text not null default 'completed',
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint training_copilot_calls_scope_check check (
    scope in ('module', 'checkpoint', 'task', 'assessment_question', 'notebook')
  ),
  constraint training_copilot_calls_intent_check check (
    intent in ('ask', 'compare', 'critique', 'explain')
  ),
  constraint training_copilot_calls_status_check check (
    status in ('completed', 'failed', 'blocked')
  ),
  constraint training_copilot_calls_surface_check check (
    surface in ('notebook', 'studio', 'workbook', 'facilitator')
  )
);

create index if not exists training_copilot_calls_participant_module_idx
  on public.training_copilot_calls (participant_id, module_id, created_at desc);

create index if not exists training_copilot_calls_cohort_module_idx
  on public.training_copilot_calls (cohort_id, module_id, created_at desc);

create index if not exists training_copilot_calls_module_exercise_idx
  on public.training_copilot_calls (module_id, exercise_id, created_at desc);

create index if not exists training_copilot_calls_status_idx
  on public.training_copilot_calls (status, created_at desc);

alter table public.training_copilot_calls enable row level security;

create policy "training_copilot_calls_select" on public.training_copilot_calls
  for select using (org_id is null or org_id = public.current_org_id());

create policy "training_copilot_calls_insert" on public.training_copilot_calls
  for insert with check (org_id is null or org_id = public.current_org_id());

create policy "training_copilot_calls_update" on public.training_copilot_calls
  for update using (
    (org_id is null or org_id = public.current_org_id()) and public.is_org_admin()
  );

create policy "training_copilot_calls_delete" on public.training_copilot_calls
  for delete using (
    (org_id is null or org_id = public.current_org_id()) and public.is_org_admin()
  );

create trigger audit_training_copilot_calls after insert or update on public.training_copilot_calls
  for each row execute function public.audit_trigger();
