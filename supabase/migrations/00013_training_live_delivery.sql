create table if not exists public.training_live_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  facilitator_user_id uuid references auth.users(id) on delete set null,
  current_slide_id text,
  current_slide_index integer not null default 0,
  broadcast_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, module_id),
  constraint training_live_sessions_slide_index_check check (current_slide_index >= 0)
);

create index if not exists training_live_sessions_cohort_module_idx
  on public.training_live_sessions (cohort_id, module_id, updated_at desc);

alter table public.training_live_sessions enable row level security;

create policy "training_live_sessions_select" on public.training_live_sessions
  for select using (org_id = public.current_org_id());
create policy "training_live_sessions_insert" on public.training_live_sessions
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_live_sessions_update" on public.training_live_sessions
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_live_sessions_delete" on public.training_live_sessions
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

drop trigger if exists set_updated_at_training_live_sessions on public.training_live_sessions;
create trigger set_updated_at_training_live_sessions
  before update on public.training_live_sessions
  for each row execute function public.set_updated_at();

create trigger audit_training_live_sessions after insert or update on public.training_live_sessions
  for each row execute function public.audit_trigger();
