-- Participant workbench: persistent per-scope notes, plus scope/kind columns on
-- training_submissions so workspace evidence (snapshots, artifacts, model
-- cards, prompt variants) can be linked back to specific checkpoints, tasks,
-- assessment questions, and notebooks.

create table if not exists public.training_participant_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  scope text not null,
  scope_id text not null default '',
  body_markdown text not null default '',
  body_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, module_id, scope, scope_id),
  constraint training_participant_notes_scope_check check (
    scope in ('module', 'checkpoint', 'task', 'assessment_question', 'notebook')
  )
);

create index if not exists training_participant_notes_module_scope_idx
  on public.training_participant_notes (module_id, scope, scope_id);

create index if not exists training_participant_notes_participant_module_idx
  on public.training_participant_notes (participant_id, module_id, updated_at desc);

alter table public.training_participant_notes enable row level security;

create policy "training_participant_notes_select" on public.training_participant_notes
  for select using (org_id is null or org_id = public.current_org_id());
create policy "training_participant_notes_insert" on public.training_participant_notes
  for insert with check (org_id is null or org_id = public.current_org_id());
create policy "training_participant_notes_update" on public.training_participant_notes
  for update using (org_id is null or org_id = public.current_org_id());
create policy "training_participant_notes_delete" on public.training_participant_notes
  for delete using (org_id is null or org_id = public.current_org_id());

drop trigger if exists set_updated_at_training_participant_notes on public.training_participant_notes;
create trigger set_updated_at_training_participant_notes
  before update on public.training_participant_notes
  for each row execute function public.set_updated_at();

create trigger audit_training_participant_notes after insert or update on public.training_participant_notes
  for each row execute function public.audit_trigger();

-- Extend training_submissions with scope/scope_id/kind so the workbench can
-- attach evidence to specific tasks, checkpoints, assessment questions, or
-- notebooks. Defaults are non-breaking for existing rows.

alter table public.training_submissions
  add column if not exists scope text not null default 'module',
  add column if not exists scope_id text,
  add column if not exists kind text;

update public.training_submissions
  set scope = coalesce(scope, 'module')
  where scope is null;

alter table public.training_submissions
  drop constraint if exists training_submissions_scope_check;
alter table public.training_submissions
  add constraint training_submissions_scope_check check (
    scope in ('module', 'checkpoint', 'task', 'assessment_question', 'notebook')
  );

alter table public.training_submissions
  drop constraint if exists training_submissions_kind_check;
alter table public.training_submissions
  add constraint training_submissions_kind_check check (
    kind is null or kind in (
      'notebook_snapshot',
      'artifact_link',
      'file_upload',
      'workbench_state',
      'prompt_variant',
      'model_card',
      'chart_spec',
      'flow_design',
      'strategy_canvas'
    )
  );

create index if not exists training_submissions_participant_scope_idx
  on public.training_submissions (participant_id, module_id, scope, scope_id, submitted_at desc);
