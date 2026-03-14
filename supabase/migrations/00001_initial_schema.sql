create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stripe_customer_id text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.openclaw_runtimes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  state_root text not null,
  config_path text not null,
  workspace_root text not null,
  gateway_port integer not null,
  gateway_token text,
  status text not null default 'stopped',
  pid integer,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  openclaw_runtime_id uuid references public.openclaw_runtimes(id) on delete set null,
  name text not null,
  openclaw_agent_id text not null unique,
  model text not null,
  status text not null default 'provisioning',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  type text not null,
  credentials jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  connected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.repo_allowlists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  pattern text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.terminal_approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  command text not null,
  repo text,
  status text not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.terminal_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  approval_id uuid references public.terminal_approvals(id) on delete set null,
  command text not null,
  exit_code integer not null default 0,
  stdout_excerpt text not null default '',
  stderr_excerpt text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_key text,
  role text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.knowledge_docs(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.openclaw_runtimes enable row level security;
alter table public.agents enable row level security;
alter table public.channels enable row level security;
alter table public.repo_allowlists enable row level security;
alter table public.terminal_approvals enable row level security;
alter table public.terminal_runs enable row level security;
alter table public.agent_logs enable row level security;
alter table public.knowledge_docs enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'org_id', '')::uuid
$$;

create policy "orgs_select" on public.orgs
  for select using (id = public.current_org_id());

create policy "org_members_select" on public.org_members
  for select using (org_id = public.current_org_id());

create policy "openclaw_runtimes_select" on public.openclaw_runtimes
  for select using (org_id = public.current_org_id());
create policy "openclaw_runtimes_insert" on public.openclaw_runtimes
  for insert with check (org_id = public.current_org_id());
create policy "openclaw_runtimes_update" on public.openclaw_runtimes
  for update using (org_id = public.current_org_id());

create policy "agents_select" on public.agents
  for select using (org_id = public.current_org_id());
create policy "agents_insert" on public.agents
  for insert with check (org_id = public.current_org_id());
create policy "agents_update" on public.agents
  for update using (org_id = public.current_org_id());

create policy "channels_select" on public.channels
  for select using (org_id = public.current_org_id());
create policy "channels_insert" on public.channels
  for insert with check (org_id = public.current_org_id());
create policy "channels_update" on public.channels
  for update using (org_id = public.current_org_id());

create policy "repo_allowlists_select" on public.repo_allowlists
  for select using (org_id = public.current_org_id());
create policy "repo_allowlists_insert" on public.repo_allowlists
  for insert with check (org_id = public.current_org_id());
create policy "repo_allowlists_update" on public.repo_allowlists
  for update using (org_id = public.current_org_id());

create policy "terminal_approvals_select" on public.terminal_approvals
  for select using (org_id = public.current_org_id());
create policy "terminal_approvals_insert" on public.terminal_approvals
  for insert with check (org_id = public.current_org_id());
create policy "terminal_approvals_update" on public.terminal_approvals
  for update using (org_id = public.current_org_id());

create policy "terminal_runs_select" on public.terminal_runs
  for select using (org_id = public.current_org_id());
create policy "terminal_runs_insert" on public.terminal_runs
  for insert with check (org_id = public.current_org_id());

create policy "agent_logs_select" on public.agent_logs
  for select using (org_id = public.current_org_id());
create policy "knowledge_docs_select" on public.knowledge_docs
  for select using (org_id = public.current_org_id());
create policy "knowledge_chunks_select" on public.knowledge_chunks
  for select using (org_id = public.current_org_id());
create policy "audit_logs_select" on public.audit_logs
  for select using (org_id = public.current_org_id());

create or replace function public.audit_trigger()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_logs (org_id, user_id, action, details)
  values (
    coalesce(new.org_id, old.org_id),
    auth.uid(),
    tg_table_name || ':' || tg_op,
    jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old))
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_openclaw_runtimes after insert or update on public.openclaw_runtimes
  for each row execute function public.audit_trigger();
create trigger audit_agents after insert or update on public.agents
  for each row execute function public.audit_trigger();
create trigger audit_channels after insert or update on public.channels
  for each row execute function public.audit_trigger();
create trigger audit_repo_allowlists after insert or update on public.repo_allowlists
  for each row execute function public.audit_trigger();
create trigger audit_terminal_approvals after insert or update on public.terminal_approvals
  for each row execute function public.audit_trigger();
create trigger audit_terminal_runs after insert or update on public.terminal_runs
  for each row execute function public.audit_trigger();
