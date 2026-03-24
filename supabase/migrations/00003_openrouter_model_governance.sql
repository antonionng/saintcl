alter table public.org_policies
  add column if not exists approved_models jsonb not null default '[]'::jsonb,
  add column if not exists blocked_models jsonb not null default '[]'::jsonb,
  add column if not exists model_guardrails jsonb not null default jsonb_build_object(
    'allowAgentOverride', true,
    'allowSessionOverride', true,
    'requireApprovalForPremiumModels', false
  );

create table if not exists public.session_model_overrides (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  session_key text not null,
  model text not null,
  provider text,
  changed_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.session_usage_checkpoints (
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_key text not null,
  agent_id uuid references public.agents(id) on delete set null,
  model text,
  provider text,
  last_total_cost_usd numeric not null default 0,
  last_total_tokens bigint not null default 0,
  last_synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, session_key)
);

create table if not exists public.usage_sync_states (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  last_synced_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.session_model_overrides enable row level security;
alter table public.session_usage_checkpoints enable row level security;
alter table public.usage_sync_states enable row level security;

create policy "session_model_overrides_select" on public.session_model_overrides
  for select using (org_id = public.current_org_id());
create policy "session_model_overrides_insert" on public.session_model_overrides
  for insert with check (org_id = public.current_org_id());

create policy "session_usage_checkpoints_select" on public.session_usage_checkpoints
  for select using (org_id = public.current_org_id());
create policy "session_usage_checkpoints_insert" on public.session_usage_checkpoints
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "session_usage_checkpoints_update" on public.session_usage_checkpoints
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "usage_sync_states_select" on public.usage_sync_states
  for select using (org_id = public.current_org_id());
create policy "usage_sync_states_insert" on public.usage_sync_states
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "usage_sync_states_update" on public.usage_sync_states
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create trigger set_updated_at_session_usage_checkpoints
  before update on public.session_usage_checkpoints
  for each row execute function public.set_updated_at();

create trigger set_updated_at_usage_sync_states
  before update on public.usage_sync_states
  for each row execute function public.set_updated_at();

create trigger audit_session_model_overrides after insert or update on public.session_model_overrides
  for each row execute function public.audit_trigger();
create trigger audit_session_usage_checkpoints after insert or update on public.session_usage_checkpoints
  for each row execute function public.audit_trigger();
create trigger audit_usage_sync_states after insert or update on public.usage_sync_states
  for each row execute function public.audit_trigger();

update public.org_policies
set approved_models = jsonb_build_array(
  jsonb_build_object(
    'id', default_model,
    'label', default_model,
    'provider', split_part(default_model, '/', 1)
  )
)
where default_model is not null
  and jsonb_typeof(approved_models) = 'array'
  and jsonb_array_length(approved_models) = 0;

update public.org_policies
set model_guardrails = model_guardrails || jsonb_build_object(
  'allowAgentOverride', coalesce((model_guardrails ->> 'allowAgentOverride')::boolean, true),
  'allowSessionOverride', coalesce((model_guardrails ->> 'allowSessionOverride')::boolean, true),
  'requireApprovalForPremiumModels', coalesce((model_guardrails ->> 'requireApprovalForPremiumModels')::boolean, false)
);
