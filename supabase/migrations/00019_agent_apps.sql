create table if not exists public.agent_apps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  app_id text not null,
  installer text not null,
  status text not null default 'installed',
  config jsonb not null default '{}'::jsonb,
  installed_by uuid references auth.users(id) on delete set null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, agent_id, app_id)
);

create index if not exists agent_apps_org_idx
  on public.agent_apps (org_id, installed_at desc);

create index if not exists agent_apps_agent_idx
  on public.agent_apps (agent_id);

alter table public.agent_apps enable row level security;

create policy "agent_apps_select" on public.agent_apps
  for select using (org_id = public.current_org_id());

create policy "agent_apps_insert" on public.agent_apps
  for insert with check (org_id = public.current_org_id());

create policy "agent_apps_update" on public.agent_apps
  for update using (org_id = public.current_org_id());

create policy "agent_apps_delete" on public.agent_apps
  for delete using (org_id = public.current_org_id());

create trigger audit_agent_apps after insert or update on public.agent_apps
  for each row execute function public.audit_trigger();

create table if not exists public.app_install_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  app_id text not null,
  requested_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists app_install_requests_org_idx
  on public.app_install_requests (org_id, created_at desc);

alter table public.app_install_requests enable row level security;

create policy "app_install_requests_select" on public.app_install_requests
  for select using (org_id = public.current_org_id());

create policy "app_install_requests_insert" on public.app_install_requests
  for insert with check (org_id = public.current_org_id());

create table if not exists public.org_mcp_servers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  app_id text not null,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, app_id)
);

create index if not exists org_mcp_servers_org_idx
  on public.org_mcp_servers (org_id, created_at desc);

alter table public.org_mcp_servers enable row level security;

create policy "org_mcp_servers_select" on public.org_mcp_servers
  for select using (org_id = public.current_org_id());

create policy "org_mcp_servers_insert" on public.org_mcp_servers
  for insert with check (org_id = public.current_org_id());

create policy "org_mcp_servers_update" on public.org_mcp_servers
  for update using (org_id = public.current_org_id());

create policy "org_mcp_servers_delete" on public.org_mcp_servers
  for delete using (org_id = public.current_org_id());
