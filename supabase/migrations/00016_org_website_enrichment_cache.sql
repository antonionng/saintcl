alter table public.orgs
  add column if not exists website_enriched_url text,
  add column if not exists website_enriched_at timestamptz;
