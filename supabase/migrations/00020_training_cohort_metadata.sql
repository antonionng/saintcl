-- Add a metadata jsonb column to training_cohorts so per-cohort feature
-- flags (e.g. the training UX v2 opt-in) can be stored without bespoke
-- columns. The default empty object keeps existing rows safe.

alter table public.training_cohorts
  add column if not exists metadata jsonb not null default '{}'::jsonb;
