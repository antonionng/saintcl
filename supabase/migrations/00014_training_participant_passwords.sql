alter table public.training_participants
  add column if not exists password_hash text,
  add column if not exists password_salt text,
  add column if not exists password_set_at timestamptz;

create index if not exists training_participants_cohort_email_password_idx
  on public.training_participants (cohort_id, email, password_set_at desc);
