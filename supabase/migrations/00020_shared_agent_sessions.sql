create table if not exists public.shared_agent_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  max_messages integer,
  message_count integer not null default 0,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shared_agent_sessions_org_idx
  on public.shared_agent_sessions (org_id, created_at desc);

create index if not exists shared_agent_sessions_agent_idx
  on public.shared_agent_sessions (agent_id);

alter table public.shared_agent_sessions enable row level security;

create policy "shared_agent_sessions_select" on public.shared_agent_sessions
  for select using (org_id = public.current_org_id());

create policy "shared_agent_sessions_insert" on public.shared_agent_sessions
  for insert with check (org_id = public.current_org_id());

create policy "shared_agent_sessions_update" on public.shared_agent_sessions
  for update using (org_id = public.current_org_id());

create policy "shared_agent_sessions_delete" on public.shared_agent_sessions
  for delete using (org_id = public.current_org_id());

create trigger audit_shared_agent_sessions after insert or update on public.shared_agent_sessions
  for each row execute function public.audit_trigger();
