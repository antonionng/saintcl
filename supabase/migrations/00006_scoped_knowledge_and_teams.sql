create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.knowledge_docs
  add column if not exists scope_type text not null default 'org',
  add column if not exists team_id uuid references public.teams(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists mime_type text,
  add column if not exists content_text text not null default '',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.knowledge_docs
  drop constraint if exists knowledge_docs_scope_type_check;

alter table public.knowledge_docs
  add constraint knowledge_docs_scope_type_check
  check (scope_type in ('org', 'team', 'user'));

alter table public.knowledge_chunks
  add column if not exists team_id uuid references public.teams(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "teams_select" on public.teams
  for select using (org_id = public.current_org_id());
create policy "teams_insert" on public.teams
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "teams_update" on public.teams
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "team_members_select" on public.team_members
  for select using (org_id = public.current_org_id());
create policy "team_members_insert" on public.team_members
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "team_members_update" on public.team_members
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "knowledge_docs_insert" on public.knowledge_docs
  for insert with check (
    org_id = public.current_org_id()
    and (
      public.is_org_admin()
      or (scope_type = 'user' and user_id = auth.uid())
    )
  );

create policy "knowledge_docs_update" on public.knowledge_docs
  for update using (
    org_id = public.current_org_id()
    and (
      public.is_org_admin()
      or (scope_type = 'user' and user_id = auth.uid())
    )
  );

create policy "knowledge_chunks_insert" on public.knowledge_chunks
  for insert with check (org_id = public.current_org_id());

drop trigger if exists set_updated_at_teams on public.teams;
create trigger set_updated_at_teams
  before update on public.teams
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_knowledge_docs on public.knowledge_docs;
create trigger set_updated_at_knowledge_docs
  before update on public.knowledge_docs
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-docs',
  'knowledge-docs',
  false,
  10485760,
  array['text/plain', 'text/markdown', 'text/csv', 'application/json']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "knowledge_docs_storage_select" on storage.objects;
create policy "knowledge_docs_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'knowledge-docs'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "knowledge_docs_storage_insert" on storage.objects;
create policy "knowledge_docs_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'knowledge-docs'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "knowledge_docs_storage_update" on storage.objects;
create policy "knowledge_docs_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'knowledge-docs'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'knowledge-docs'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
