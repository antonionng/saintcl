alter table public.orgs
  add column if not exists website text not null default '',
  add column if not exists company_summary text not null default '',
  add column if not exists agent_brief text not null default '',
  add column if not exists logo_path text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at_orgs on public.orgs;
create trigger set_updated_at_orgs
  before update on public.orgs
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "org_logos_storage_select" on storage.objects;
create policy "org_logos_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "org_logos_storage_insert" on storage.objects;
create policy "org_logos_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "org_logos_storage_update" on storage.objects;
create policy "org_logos_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
