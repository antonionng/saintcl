create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  what_i_do text not null default '',
  agent_brief text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists display_name text not null default '',
  add column if not exists what_i_do text not null default '',
  add column if not exists agent_brief text not null default '',
  add column if not exists avatar_path text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.user_profiles
set
  user_id = coalesce(user_id, id),
  display_name = case
    when coalesce(display_name, '') = '' then coalesce(nullif(name, ''), '')
    else display_name
  end,
  what_i_do = case
    when coalesce(what_i_do, '') = '' then coalesce(nullif(job_title, ''), '')
    else what_i_do
  end,
  agent_brief = case
    when coalesce(agent_brief, '') = '' then coalesce(nullif(bio, ''), '')
    else agent_brief
  end,
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

create unique index if not exists user_profiles_user_id_key on public.user_profiles (user_id);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;

create policy "user_profiles_select_own" on public.user_profiles
  for select using (coalesce(user_id, id) = auth.uid());
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (coalesce(user_id, id) = auth.uid());
create policy "user_profiles_update_own" on public.user_profiles
  for update using (coalesce(user_id, id) = auth.uid());

drop trigger if exists set_updated_at_user_profiles on public.user_profiles;
create trigger set_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'account-avatars',
  'account-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "account_avatars_select_own" on storage.objects;
create policy "account_avatars_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "account_avatars_insert_own" on storage.objects;
create policy "account_avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "account_avatars_update_own" on storage.objects;
create policy "account_avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "account_avatars_delete_own" on storage.objects;
create policy "account_avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
