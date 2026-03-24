alter table public.orgs
  add column if not exists billing_interval text not null default 'monthly',
  add column if not exists trial_status text not null default 'none',
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_plan text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_end timestamptz;

update public.orgs
set plan = case lower(plan)
  when 'free' then 'starter'
  when 'team' then 'business'
  else lower(plan)
end
where lower(plan) in ('free', 'pro', 'team');

update public.orgs
set billing_interval = 'monthly'
where billing_interval is null or billing_interval not in ('monthly', 'annual');

update public.orgs
set trial_status = 'none'
where trial_status is null or trial_status not in ('none', 'active', 'expired', 'converted');

alter table public.orgs
  alter column plan set default 'starter';

alter table public.orgs
  drop constraint if exists orgs_plan_check;

alter table public.orgs
  add constraint orgs_plan_check
  check (plan in ('starter', 'pro', 'business', 'enterprise'));

alter table public.orgs
  drop constraint if exists orgs_billing_interval_check;

alter table public.orgs
  add constraint orgs_billing_interval_check
  check (billing_interval in ('monthly', 'annual'));

alter table public.orgs
  drop constraint if exists orgs_trial_status_check;

alter table public.orgs
  add constraint orgs_trial_status_check
  check (trial_status in ('none', 'active', 'expired', 'converted'));
