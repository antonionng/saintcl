update public.orgs
set trial_ends_at = trial_started_at + interval '7 days'
where trial_status = 'active'
  and trial_started_at is not null
  and (
    trial_ends_at is null
    or trial_ends_at > trial_started_at + interval '7 days'
  );

update public.orgs
set trial_ends_at = created_at + interval '7 days'
where trial_status = 'active'
  and trial_started_at is null
  and (
    trial_ends_at is null
    or trial_ends_at > created_at + interval '7 days'
  );
