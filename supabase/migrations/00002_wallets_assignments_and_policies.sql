create or replace function public.current_org_role()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'org_role', '')
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_org_role() in ('owner', 'admin'), false)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.org_wallets (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  balance_cents bigint not null default 0,
  currency text not null default 'usd',
  low_balance_threshold_cents bigint not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  source_type text not null,
  direction text not null check (direction in ('credit', 'debit')),
  amount_cents bigint not null check (amount_cents >= 0),
  balance_after_cents bigint,
  description text not null default '',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  event_type text not null,
  quantity numeric not null default 1,
  unit text not null default 'operation',
  amount_cents bigint not null default 0,
  session_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null unique references public.agents(id) on delete cascade,
  assignee_type text not null check (assignee_type in ('employee', 'team', 'org')),
  assignee_ref text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.org_policies (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  mission text not null default '',
  reason_for_agents text not null default '',
  guardrails jsonb not null default '{}'::jsonb,
  default_model text,
  require_approval_on_spend boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_budget_overrides (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  soft_limit_cents bigint,
  hard_limit_cents bigint,
  alert_threshold_cents bigint,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.stripe_events (
  id text primary key,
  org_id uuid references public.orgs(id) on delete set null,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.org_wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.usage_events enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.org_policies enable row level security;
alter table public.user_budget_overrides enable row level security;
alter table public.stripe_events enable row level security;

create policy "org_wallets_select" on public.org_wallets
  for select using (org_id = public.current_org_id());
create policy "org_wallets_insert" on public.org_wallets
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "org_wallets_update" on public.org_wallets
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "wallet_ledger_select" on public.wallet_ledger
  for select using (org_id = public.current_org_id());
create policy "wallet_ledger_insert" on public.wallet_ledger
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());

create policy "usage_events_select" on public.usage_events
  for select using (org_id = public.current_org_id());
create policy "usage_events_insert" on public.usage_events
  for insert with check (org_id = public.current_org_id());

create policy "agent_assignments_select" on public.agent_assignments
  for select using (org_id = public.current_org_id());
create policy "agent_assignments_insert" on public.agent_assignments
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "agent_assignments_update" on public.agent_assignments
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "org_policies_select" on public.org_policies
  for select using (org_id = public.current_org_id());
create policy "org_policies_insert" on public.org_policies
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "org_policies_update" on public.org_policies
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "user_budget_overrides_select" on public.user_budget_overrides
  for select using (org_id = public.current_org_id());
create policy "user_budget_overrides_insert" on public.user_budget_overrides
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());
create policy "user_budget_overrides_update" on public.user_budget_overrides
  for update using (org_id = public.current_org_id() and public.is_org_admin());

create policy "stripe_events_select" on public.stripe_events
  for select using (org_id = public.current_org_id());
create policy "stripe_events_insert" on public.stripe_events
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());

create trigger set_updated_at_org_wallets
  before update on public.org_wallets
  for each row execute function public.set_updated_at();

create trigger set_updated_at_org_policies
  before update on public.org_policies
  for each row execute function public.set_updated_at();

create trigger audit_org_wallets after insert or update on public.org_wallets
  for each row execute function public.audit_trigger();
create trigger audit_wallet_ledger after insert or update on public.wallet_ledger
  for each row execute function public.audit_trigger();
create trigger audit_usage_events after insert or update on public.usage_events
  for each row execute function public.audit_trigger();
create trigger audit_agent_assignments after insert or update on public.agent_assignments
  for each row execute function public.audit_trigger();
create trigger audit_org_policies after insert or update on public.org_policies
  for each row execute function public.audit_trigger();
create trigger audit_user_budget_overrides after insert or update on public.user_budget_overrides
  for each row execute function public.audit_trigger();

insert into public.org_wallets (org_id)
select id from public.orgs
on conflict (org_id) do nothing;

insert into public.org_policies (org_id, default_model)
select id, 'anthropic/claude-sonnet-4' from public.orgs
on conflict (org_id) do nothing;
