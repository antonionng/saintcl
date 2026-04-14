create table if not exists public.training_programmes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  name text not null,
  client_name text,
  description text not null default '',
  audience text not null default '',
  status text not null default 'planning',
  delivery_mode text not null default 'online',
  target_slide_count integer not null default 80,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug),
  constraint training_programmes_status_check check (status in ('planning', 'active', 'archived')),
  constraint training_programmes_delivery_mode_check check (delivery_mode in ('online', 'hybrid', 'in_person')),
  constraint training_programmes_target_slides_check check (target_slide_count > 0)
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  programme_id uuid not null references public.training_programmes(id) on delete cascade,
  slug text not null,
  title text not null,
  sequence integer not null,
  summary text not null default '',
  status text not null default 'draft',
  delivery_mode text not null default 'online',
  duration_days integer not null default 1,
  hours_per_day numeric(4,2) not null default 4,
  start_date date,
  end_date date,
  target_slide_count integer not null default 80,
  learning_objectives jsonb not null default '[]'::jsonb,
  key_themes jsonb not null default '[]'::jsonb,
  source_root text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, slug),
  unique (programme_id, sequence),
  constraint training_modules_status_check check (status in ('draft', 'scheduled', 'ready', 'live', 'complete')),
  constraint training_modules_delivery_mode_check check (delivery_mode in ('online', 'hybrid', 'in_person')),
  constraint training_modules_duration_days_check check (duration_days > 0),
  constraint training_modules_hours_per_day_check check (hours_per_day > 0),
  constraint training_modules_target_slides_check check (target_slide_count > 0)
);

create table if not exists public.training_cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  programme_id uuid not null references public.training_programmes(id) on delete cascade,
  slug text not null,
  name text not null,
  audience text not null default '',
  client_name text,
  status text not null default 'draft',
  invite_code text,
  starts_on date,
  ends_on date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug),
  unique (org_id, invite_code),
  constraint training_cohorts_status_check check (status in ('draft', 'scheduled', 'active', 'complete'))
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  session_day integer not null,
  title text not null,
  delivery_mode text not null default 'online',
  starts_at timestamptz,
  ends_at timestamptz,
  facilitator_name text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, module_id, session_day),
  constraint training_sessions_status_check check (status in ('scheduled', 'live', 'complete', 'cancelled')),
  constraint training_sessions_delivery_mode_check check (delivery_mode in ('online', 'hybrid', 'in_person')),
  constraint training_sessions_day_check check (session_day > 0)
);

create table if not exists public.training_content_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  kind text not null,
  slug text not null,
  title text not null,
  sequence integer not null,
  estimated_minutes integer,
  storage_path text,
  body_markdown text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, sequence, kind),
  constraint training_content_items_kind_check check (
    kind in ('slide', 'lab', 'assessment', 'dataset', 'notebook', 'workbook', 'facilitator_guide', 'solution')
  )
);

create table if not exists public.training_participants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  full_name text not null,
  email text not null,
  employee_id text,
  status text not null default 'invited',
  check_in_token text,
  checked_in_at timestamptz,
  last_seen_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, email),
  unique (cohort_id, employee_id),
  unique (cohort_id, check_in_token),
  constraint training_participants_status_check check (status in ('invited', 'checked_in', 'active', 'completed'))
);

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  status text not null default 'enrolled',
  progress_percent numeric(5,2) not null default 0,
  checked_in_at timestamptz,
  last_event_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, module_id),
  constraint training_enrollments_status_check check (status in ('enrolled', 'in_progress', 'completed')),
  constraint training_enrollments_progress_check check (progress_percent >= 0 and progress_percent <= 100)
);

create table if not exists public.training_progress_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cohort_id uuid not null references public.training_cohorts(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  enrollment_id uuid references public.training_enrollments(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  content_item_id uuid references public.training_content_items(id) on delete set null,
  event_type text not null,
  progress_percent numeric(5,2),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint training_progress_events_type_check check (
    event_type in (
      'check_in',
      'slide_viewed',
      'slide_completed',
      'lab_launched',
      'lab_completed',
      'assessment_started',
      'assessment_submitted',
      'module_completed'
    )
  ),
  constraint training_progress_events_progress_check check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  )
);

create table if not exists public.training_lab_workspaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  content_item_id uuid references public.training_content_items(id) on delete set null,
  provider text not null,
  status text not null default 'provisioning',
  runtime_image text,
  launch_url text,
  notebook_path text,
  metadata jsonb not null default '{}'::jsonb,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_lab_workspaces_status_check check (
    status in ('provisioning', 'active', 'paused', 'stopped', 'error')
  )
);

create table if not exists public.training_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  content_item_id uuid references public.training_content_items(id) on delete set null,
  status text not null default 'draft',
  score_band text,
  score numeric(5,2),
  artifact_url text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_submissions_status_check check (status in ('draft', 'submitted', 'reviewed')),
  constraint training_submissions_score_band_check check (
    score_band is null or score_band in ('competent', 'strong', 'exceptional')
  )
);

create index if not exists training_programmes_org_status_idx
  on public.training_programmes (org_id, status, updated_at desc);

create index if not exists training_modules_programme_sequence_idx
  on public.training_modules (programme_id, sequence);

create index if not exists training_cohorts_programme_status_idx
  on public.training_cohorts (programme_id, status, starts_on);

create index if not exists training_sessions_cohort_module_idx
  on public.training_sessions (cohort_id, module_id, session_day);

create index if not exists training_content_items_module_kind_sequence_idx
  on public.training_content_items (module_id, kind, sequence);

create index if not exists training_participants_cohort_status_idx
  on public.training_participants (cohort_id, status, full_name);

create index if not exists training_enrollments_module_status_idx
  on public.training_enrollments (module_id, status, progress_percent desc);

create index if not exists training_progress_events_participant_occurred_idx
  on public.training_progress_events (participant_id, occurred_at desc);

create index if not exists training_lab_workspaces_participant_status_idx
  on public.training_lab_workspaces (participant_id, status, updated_at desc);

create index if not exists training_submissions_module_status_idx
  on public.training_submissions (module_id, status, submitted_at desc);

alter table public.training_programmes enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_cohorts enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_content_items enable row level security;
alter table public.training_participants enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_progress_events enable row level security;
alter table public.training_lab_workspaces enable row level security;
alter table public.training_submissions enable row level security;

create policy "training_programmes_select" on public.training_programmes
  for select using (org_id = public.current_org_id());
create policy "training_programmes_insert" on public.training_programmes
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_programmes_update" on public.training_programmes
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_programmes_delete" on public.training_programmes
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_modules_select" on public.training_modules
  for select using (org_id = public.current_org_id());
create policy "training_modules_insert" on public.training_modules
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_modules_update" on public.training_modules
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_modules_delete" on public.training_modules
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_cohorts_select" on public.training_cohorts
  for select using (org_id = public.current_org_id());
create policy "training_cohorts_insert" on public.training_cohorts
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_cohorts_update" on public.training_cohorts
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_cohorts_delete" on public.training_cohorts
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_sessions_select" on public.training_sessions
  for select using (org_id = public.current_org_id());
create policy "training_sessions_insert" on public.training_sessions
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_sessions_update" on public.training_sessions
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_sessions_delete" on public.training_sessions
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_content_items_select" on public.training_content_items
  for select using (org_id = public.current_org_id());
create policy "training_content_items_insert" on public.training_content_items
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_content_items_update" on public.training_content_items
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_content_items_delete" on public.training_content_items
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_participants_select" on public.training_participants
  for select using (org_id = public.current_org_id());
create policy "training_participants_insert" on public.training_participants
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_participants_update" on public.training_participants
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_participants_delete" on public.training_participants
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_enrollments_select" on public.training_enrollments
  for select using (org_id = public.current_org_id());
create policy "training_enrollments_insert" on public.training_enrollments
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_enrollments_update" on public.training_enrollments
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_enrollments_delete" on public.training_enrollments
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_progress_events_select" on public.training_progress_events
  for select using (org_id = public.current_org_id());
create policy "training_progress_events_insert" on public.training_progress_events
  for insert with check (org_id = public.current_org_id());

create policy "training_lab_workspaces_select" on public.training_lab_workspaces
  for select using (org_id = public.current_org_id());
create policy "training_lab_workspaces_insert" on public.training_lab_workspaces
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_lab_workspaces_update" on public.training_lab_workspaces
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_lab_workspaces_delete" on public.training_lab_workspaces
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

create policy "training_submissions_select" on public.training_submissions
  for select using (org_id = public.current_org_id());
create policy "training_submissions_insert" on public.training_submissions
  for insert with check (org_id = public.current_org_id());
create policy "training_submissions_update" on public.training_submissions
  for update using (org_id = public.current_org_id() and public.is_org_admin());
create policy "training_submissions_delete" on public.training_submissions
  for delete using (org_id = public.current_org_id() and public.is_org_admin());

drop trigger if exists set_updated_at_training_programmes on public.training_programmes;
create trigger set_updated_at_training_programmes
  before update on public.training_programmes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_modules on public.training_modules;
create trigger set_updated_at_training_modules
  before update on public.training_modules
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_cohorts on public.training_cohorts;
create trigger set_updated_at_training_cohorts
  before update on public.training_cohorts
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_sessions on public.training_sessions;
create trigger set_updated_at_training_sessions
  before update on public.training_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_content_items on public.training_content_items;
create trigger set_updated_at_training_content_items
  before update on public.training_content_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_participants on public.training_participants;
create trigger set_updated_at_training_participants
  before update on public.training_participants
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_enrollments on public.training_enrollments;
create trigger set_updated_at_training_enrollments
  before update on public.training_enrollments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_lab_workspaces on public.training_lab_workspaces;
create trigger set_updated_at_training_lab_workspaces
  before update on public.training_lab_workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_training_submissions on public.training_submissions;
create trigger set_updated_at_training_submissions
  before update on public.training_submissions
  for each row execute function public.set_updated_at();

create trigger audit_training_programmes after insert or update on public.training_programmes
  for each row execute function public.audit_trigger();
create trigger audit_training_modules after insert or update on public.training_modules
  for each row execute function public.audit_trigger();
create trigger audit_training_cohorts after insert or update on public.training_cohorts
  for each row execute function public.audit_trigger();
create trigger audit_training_sessions after insert or update on public.training_sessions
  for each row execute function public.audit_trigger();
create trigger audit_training_content_items after insert or update on public.training_content_items
  for each row execute function public.audit_trigger();
create trigger audit_training_participants after insert or update on public.training_participants
  for each row execute function public.audit_trigger();
create trigger audit_training_enrollments after insert or update on public.training_enrollments
  for each row execute function public.audit_trigger();
create trigger audit_training_lab_workspaces after insert or update on public.training_lab_workspaces
  for each row execute function public.audit_trigger();
create trigger audit_training_submissions after insert or update on public.training_submissions
  for each row execute function public.audit_trigger();
