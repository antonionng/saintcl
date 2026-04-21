-- Add skill policy JSONB column to org_policies
alter table public.org_policies
  add column if not exists skill_policy jsonb default '{"allowedSources":["clawhub","github"],"allowedTrustTiers":["official","curated"],"requireApprovalForCommunity":true}'::jsonb;

-- Setup audit events table for channel, skill, and enrichment governance tracking
create table if not exists public.setup_audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid,
  user_id uuid,
  event_type text not null,
  category text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_setup_audit_org_id on public.setup_audit_events(org_id);
create index if not exists idx_setup_audit_event_type on public.setup_audit_events(event_type);
create index if not exists idx_setup_audit_created_at on public.setup_audit_events(created_at);

alter table public.setup_audit_events enable row level security;

create policy "Org members can read setup audit events"
  on public.setup_audit_events
  for select
  using (
    org_id in (
      select org_id from public.org_members where user_id = auth.uid()
    )
  );

-- Funnel metrics table for tracking setup completion rates
create table if not exists public.setup_funnel_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  funnel_step text not null,
  funnel_name text not null default 'agent_setup',
  completed boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_setup_funnel_org_id on public.setup_funnel_events(org_id);
create index if not exists idx_setup_funnel_step on public.setup_funnel_events(funnel_step);

alter table public.setup_funnel_events enable row level security;

create policy "Org members can read setup funnel events"
  on public.setup_funnel_events
  for select
  using (
    org_id in (
      select org_id from public.org_members where user_id = auth.uid()
    )
  );
