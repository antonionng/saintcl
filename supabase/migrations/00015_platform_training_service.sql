alter table public.training_programmes
  add column if not exists platform_key text;

alter table public.training_modules
  add column if not exists platform_key text;

alter table public.training_cohorts
  add column if not exists platform_key text;

alter table public.training_participants
  add column if not exists platform_key text,
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

alter table public.training_enrollments
  add column if not exists platform_key text;

alter table public.training_content_items
  add column if not exists platform_key text;

alter table public.training_lab_workspaces
  add column if not exists platform_key text;

alter table public.training_submissions
  add column if not exists platform_key text;

alter table public.training_progress_events
  add column if not exists platform_key text;

alter table public.training_live_sessions
  add column if not exists platform_key text;

update public.training_programmes set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_modules set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_cohorts set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_participants set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_enrollments set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_content_items set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_lab_workspaces set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_submissions set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_progress_events set platform_key = coalesce(platform_key, 'saintagi-training');
update public.training_live_sessions set platform_key = coalesce(platform_key, 'saintagi-training');

alter table public.training_programmes
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_modules
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_cohorts
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_participants
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_enrollments
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_content_items
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_lab_workspaces
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_submissions
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_progress_events
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

alter table public.training_live_sessions
  alter column platform_key set default 'saintagi-training',
  alter column platform_key set not null,
  alter column org_id drop not null;

create unique index if not exists training_programmes_platform_slug_idx
  on public.training_programmes (platform_key, slug);

create unique index if not exists training_cohorts_platform_slug_idx
  on public.training_cohorts (platform_key, slug);

create unique index if not exists training_cohorts_platform_invite_code_idx
  on public.training_cohorts (platform_key, invite_code)
  where invite_code is not null;

create index if not exists training_participants_auth_user_idx
  on public.training_participants (auth_user_id);

create unique index if not exists training_participants_cohort_auth_user_idx
  on public.training_participants (cohort_id, auth_user_id)
  where auth_user_id is not null;
