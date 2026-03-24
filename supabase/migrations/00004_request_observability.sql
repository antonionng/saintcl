create table if not exists public.request_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  session_key text,
  request_id text,
  dedupe_key text not null,
  source text not null,
  event_type text not null default 'request.completed',
  path text,
  method text,
  provider text,
  model text,
  channel text,
  status text not null default 'completed',
  status_code integer,
  latency_ms integer,
  input_tokens bigint,
  output_tokens bigint,
  total_tokens bigint,
  cache_read_tokens bigint,
  cache_write_tokens bigint,
  cost_usd numeric,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, dedupe_key)
);

create table if not exists public.session_activity_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  session_key text,
  dedupe_key text not null,
  source text not null,
  event_type text not null,
  level text not null default 'info',
  role text,
  provider text,
  model text,
  channel text,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, dedupe_key)
);

create index if not exists request_events_org_occurred_at_idx
  on public.request_events (org_id, occurred_at desc);
create index if not exists request_events_agent_occurred_at_idx
  on public.request_events (agent_id, occurred_at desc);
create index if not exists request_events_session_key_idx
  on public.request_events (session_key);
create index if not exists request_events_model_idx
  on public.request_events (model);
create index if not exists request_events_provider_idx
  on public.request_events (provider);
create index if not exists request_events_status_idx
  on public.request_events (status);

create index if not exists session_activity_events_org_occurred_at_idx
  on public.session_activity_events (org_id, occurred_at desc);
create index if not exists session_activity_events_agent_occurred_at_idx
  on public.session_activity_events (agent_id, occurred_at desc);
create index if not exists session_activity_events_session_key_idx
  on public.session_activity_events (session_key);
create index if not exists session_activity_events_role_idx
  on public.session_activity_events (role);

alter table public.request_events enable row level security;
alter table public.session_activity_events enable row level security;

create policy "request_events_select" on public.request_events
  for select using (org_id = public.current_org_id());
create policy "request_events_insert" on public.request_events
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());

create policy "session_activity_events_select" on public.session_activity_events
  for select using (org_id = public.current_org_id());
create policy "session_activity_events_insert" on public.session_activity_events
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
