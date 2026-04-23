-- Remove the training portal entirely. Drops all training-related tables,
-- triggers, indexes, and realtime publication entries created by the
-- former 00012-00015 and 00018-00024 migrations.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_live_sessions'
    ) then
      alter publication supabase_realtime drop table public.training_live_sessions;
    end if;

    if exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_progress_events'
    ) then
      alter publication supabase_realtime drop table public.training_progress_events;
    end if;
  end if;
end$$;

drop table if exists public.training_ai_assessments cascade;
drop table if exists public.training_copilot_calls cascade;
drop table if exists public.training_cohort_posts cascade;
drop table if exists public.training_participant_notes cascade;
drop table if exists public.training_certificates cascade;
drop table if exists public.training_assessment_responses cascade;
drop table if exists public.training_assessment_attempts cascade;
drop table if exists public.training_assessment_questions cascade;
drop table if exists public.training_assessments cascade;
drop table if exists public.training_live_sessions cascade;
drop table if exists public.training_submissions cascade;
drop table if exists public.training_lab_workspaces cascade;
drop table if exists public.training_progress_events cascade;
drop table if exists public.training_enrollments cascade;
drop table if exists public.training_participants cascade;
drop table if exists public.training_content_items cascade;
drop table if exists public.training_sessions cascade;
drop table if exists public.training_cohorts cascade;
drop table if exists public.training_modules cascade;
drop table if exists public.training_programmes cascade;
