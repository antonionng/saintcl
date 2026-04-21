-- Phase 1 of the training UX rethink: expose live session and progress events
-- on the supabase_realtime publication. Today's facilitator and participant
-- clients consume updates over Realtime broadcast channels (routed via the
-- HTTP broadcast API), but enabling replication keeps the door open for
-- richer postgres_changes subscriptions in later phases.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_live_sessions'
    ) then
      alter publication supabase_realtime add table public.training_live_sessions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'training_progress_events'
    ) then
      alter publication supabase_realtime add table public.training_progress_events;
    end if;
  end if;
end$$;
