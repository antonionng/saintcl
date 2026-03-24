create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  team_id uuid references public.teams(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  invite_token_hash text not null unique,
  status text not null default 'pending',
  billing_status text not null default 'pending',
  billed_amount_cents bigint not null default 0 check (billed_amount_cents >= 0),
  billed_usage_event_id uuid references public.usage_events(id) on delete set null,
  billing_ledger_entry_id uuid references public.wallet_ledger(id) on delete set null,
  resend_message_id text,
  last_error text,
  expires_at timestamptz not null default (now() + interval '14 days'),
  sent_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role in ('owner', 'admin', 'member', 'employee')),
  check (status in ('pending', 'sent', 'accepted', 'revoked', 'expired', 'delivery_failed')),
  check (billing_status in ('pending', 'charged', 'reversed', 'not_required'))
);

create unique index if not exists org_invites_org_email_active_idx
  on public.org_invites (org_id, lower(email))
  where status in ('pending', 'sent');

create table if not exists public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  marketing_opt_in boolean not null default true,
  weekly_digest_opt_in boolean not null default true,
  welcome_series_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  invite_id uuid references public.org_invites(id) on delete set null,
  email text not null,
  template_key text not null,
  campaign_key text,
  category text not null default 'transactional',
  status text not null default 'queued',
  dedupe_key text unique,
  subject text not null default '',
  resend_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  check (category in ('transactional', 'marketing')),
  check (status in ('queued', 'sent', 'skipped', 'failed'))
);

alter table public.org_invites enable row level security;
alter table public.email_preferences enable row level security;
alter table public.email_events enable row level security;

create policy "org_invites_select" on public.org_invites
  for select using (org_id = public.current_org_id());
create policy "org_invites_insert" on public.org_invites
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "org_invites_update" on public.org_invites
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "email_preferences_select" on public.email_preferences
  for select using (org_id = public.current_org_id() and (user_id = auth.uid() or public.is_org_admin()));
create policy "email_preferences_insert" on public.email_preferences
  for insert with check (org_id = public.current_org_id() and user_id = auth.uid());
create policy "email_preferences_update" on public.email_preferences
  for update using (org_id = public.current_org_id() and user_id = auth.uid())
  with check (org_id = public.current_org_id() and user_id = auth.uid());

create policy "email_events_select" on public.email_events
  for select using (org_id = public.current_org_id() and (user_id = auth.uid() or public.is_org_admin()));
create policy "email_events_insert" on public.email_events
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "email_events_update" on public.email_events
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create trigger set_updated_at_org_invites
  before update on public.org_invites
  for each row execute function public.set_updated_at();

create trigger set_updated_at_email_preferences
  before update on public.email_preferences
  for each row execute function public.set_updated_at();

create trigger audit_org_invites after insert or update on public.org_invites
  for each row execute function public.audit_trigger();

create trigger audit_email_preferences after insert or update on public.email_preferences
  for each row execute function public.audit_trigger();

create trigger audit_email_events after insert or update on public.email_events
  for each row execute function public.audit_trigger();

insert into public.email_preferences (org_id, user_id)
select org_id, user_id
from public.org_members
on conflict (org_id, user_id) do nothing;
