create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text not null default '',
  instructions text not null,
  icon text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists personas_org_updated_idx
  on public.personas (org_id, updated_at desc);

alter table public.personas enable row level security;

create policy "personas_select" on public.personas
  for select using (org_id = public.current_org_id());

create policy "personas_insert" on public.personas
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());

create policy "personas_update" on public.personas
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "personas_delete" on public.personas
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

drop trigger if exists set_updated_at_personas on public.personas;
create trigger set_updated_at_personas
  before update on public.personas
  for each row execute function public.set_updated_at();

create trigger audit_personas after insert or update on public.personas
  for each row execute function public.audit_trigger();
