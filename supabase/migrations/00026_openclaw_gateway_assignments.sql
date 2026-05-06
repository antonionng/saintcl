create table if not exists public.openclaw_gateway_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  shard_id text,
  ws_url text,
  token_env_key text,
  status text not null default 'active' check (status in ('active', 'draining', 'disabled')),
  dedicated boolean not null default true,
  assignment_reason text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id),
  check (nullif(trim(coalesce(shard_id, '')), '') is not null or nullif(trim(coalesce(ws_url, '')), '') is not null)
);

create index if not exists openclaw_gateway_assignments_status_idx
  on public.openclaw_gateway_assignments (status);

create index if not exists openclaw_gateway_assignments_shard_id_idx
  on public.openclaw_gateway_assignments (shard_id);

alter table public.openclaw_gateway_assignments enable row level security;

drop policy if exists "openclaw_gateway_assignments_select_by_membership" on public.openclaw_gateway_assignments;
create policy "openclaw_gateway_assignments_select_by_membership" on public.openclaw_gateway_assignments
  for select using (app_private.is_org_member(org_id));

drop policy if exists "openclaw_gateway_assignments_insert_by_org_admin" on public.openclaw_gateway_assignments;
create policy "openclaw_gateway_assignments_insert_by_org_admin" on public.openclaw_gateway_assignments
  for insert with check (app_private.is_org_admin(org_id));

drop policy if exists "openclaw_gateway_assignments_update_by_org_admin" on public.openclaw_gateway_assignments;
create policy "openclaw_gateway_assignments_update_by_org_admin" on public.openclaw_gateway_assignments
  for update using (app_private.is_org_admin(org_id)) with check (app_private.is_org_admin(org_id));

drop policy if exists "openclaw_gateway_assignments_delete_by_org_admin" on public.openclaw_gateway_assignments;
create policy "openclaw_gateway_assignments_delete_by_org_admin" on public.openclaw_gateway_assignments
  for delete using (app_private.is_org_admin(org_id));
