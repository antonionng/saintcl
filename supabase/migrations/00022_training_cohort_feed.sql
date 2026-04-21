-- Cohort feed: a per-cohort message stream that participants and facilitators
-- can post to without leaving the academy. Authors are identified by their
-- training_participants row (token-based) or by an auth.users facilitator id;
-- exactly one of those must be present per post.
--
-- Also extends training_participants with a small editable profile shape
-- (display name, role, one-line intro) so the feed can render real people
-- instead of raw email addresses and so participants can fill in their
-- profile from the academy page without a Saint account.

alter table public.training_participants
  add column if not exists display_name text,
  add column if not exists role_at_company text,
  add column if not exists bio text;

create table if not exists public.training_cohort_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  platform_key text not null default 'saintagi-training',
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  participant_id uuid references public.training_participants(id) on delete cascade,
  facilitator_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_cohort_posts_author_check check (
    (participant_id is not null and facilitator_user_id is null)
    or (participant_id is null and facilitator_user_id is not null)
  ),
  constraint training_cohort_posts_body_length_check check (
    char_length(body) between 1 and 2000
  )
);

create index if not exists training_cohort_posts_cohort_created_idx
  on public.training_cohort_posts (cohort_id, created_at desc);

create index if not exists training_cohort_posts_participant_idx
  on public.training_cohort_posts (participant_id, created_at desc);

alter table public.training_cohort_posts enable row level security;

create policy "training_cohort_posts_select" on public.training_cohort_posts
  for select using (org_id is null or org_id = public.current_org_id());

create policy "training_cohort_posts_insert" on public.training_cohort_posts
  for insert with check (org_id is null or org_id = public.current_org_id());

create policy "training_cohort_posts_update" on public.training_cohort_posts
  for update using (org_id is null or org_id = public.current_org_id());

create policy "training_cohort_posts_delete" on public.training_cohort_posts
  for delete using (
    (org_id is null or org_id = public.current_org_id()) and public.is_org_admin()
  );

drop trigger if exists set_updated_at_training_cohort_posts on public.training_cohort_posts;
create trigger set_updated_at_training_cohort_posts
  before update on public.training_cohort_posts
  for each row execute function public.set_updated_at();

create trigger audit_training_cohort_posts after insert or update on public.training_cohort_posts
  for each row execute function public.audit_trigger();
