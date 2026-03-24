create table if not exists public.agent_terminal_repo_allowlists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  repo_path text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (agent_id, repo_path)
);

create index if not exists agent_terminal_repo_allowlists_org_agent_idx
  on public.agent_terminal_repo_allowlists (org_id, agent_id, created_at desc);

alter table public.agent_terminal_repo_allowlists enable row level security;

create policy "agent_terminal_repo_allowlists_select" on public.agent_terminal_repo_allowlists
  for select using (org_id = public.current_org_id());

create policy "agent_terminal_repo_allowlists_insert" on public.agent_terminal_repo_allowlists
  for insert with check (org_id = public.current_org_id());

create policy "agent_terminal_repo_allowlists_update" on public.agent_terminal_repo_allowlists
  for update using (org_id = public.current_org_id());

create policy "agent_terminal_repo_allowlists_delete" on public.agent_terminal_repo_allowlists
  for delete using (org_id = public.current_org_id());

create trigger audit_agent_terminal_repo_allowlists after insert or update on public.agent_terminal_repo_allowlists
  for each row execute function public.audit_trigger();
