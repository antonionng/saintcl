create schema if not exists app_private;

create or replace function app_private.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = target_org_id
      and user_id = auth.uid()
  );
$$;

create or replace function app_private.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = target_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function app_private.is_org_member_text(target_org_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_org_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then app_private.is_org_member(target_org_id::uuid)
    else false
  end;
$$;

create or replace function app_private.is_org_admin_text(target_org_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_org_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then app_private.is_org_admin(target_org_id::uuid)
    else false
  end;
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_org_member(uuid) to authenticated;
grant execute on function app_private.is_org_admin(uuid) to authenticated;
grant execute on function app_private.is_org_member_text(text) to authenticated;
grant execute on function app_private.is_org_admin_text(text) to authenticated;

drop policy if exists "orgs_select_by_membership" on public.orgs;
create policy "orgs_select_by_membership" on public.orgs
  for select using (app_private.is_org_member(id));

drop policy if exists "org_members_select_by_membership" on public.org_members;
create policy "org_members_select_by_membership" on public.org_members
  for select using (app_private.is_org_member(org_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'openclaw_runtimes',
    'agents',
    'channels',
    'repo_allowlists',
    'terminal_approvals',
    'terminal_runs',
    'agent_logs',
    'knowledge_docs',
    'knowledge_chunks',
    'audit_logs',
    'org_wallets',
    'wallet_ledger',
    'usage_events',
    'agent_assignments',
    'org_policies',
    'user_budget_overrides',
    'stripe_events',
    'session_model_overrides',
    'session_usage_checkpoints',
    'usage_sync_states',
    'request_events',
    'session_activity_events',
    'teams',
    'team_members',
    'org_invites',
    'email_events',
    'agent_terminal_repo_allowlists',
    'personas',
    'setup_audit_events',
    'setup_funnel_events',
    'agent_apps',
    'app_install_requests',
    'org_mcp_servers',
    'shared_agent_sessions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_by_membership', table_name);
    execute format(
      'create policy %I on public.%I for select using (app_private.is_org_member(org_id))',
      table_name || '_select_by_membership',
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'openclaw_runtimes',
    'agents',
    'channels',
    'repo_allowlists',
    'terminal_approvals',
    'terminal_runs',
    'agent_logs',
    'knowledge_docs',
    'knowledge_chunks',
    'audit_logs',
    'org_wallets',
    'wallet_ledger',
    'usage_events',
    'agent_assignments',
    'org_policies',
    'user_budget_overrides',
    'stripe_events',
    'session_model_overrides',
    'session_usage_checkpoints',
    'usage_sync_states',
    'request_events',
    'session_activity_events',
    'teams',
    'team_members',
    'org_invites',
    'email_events',
    'agent_terminal_repo_allowlists',
    'personas',
    'agent_apps',
    'app_install_requests',
    'org_mcp_servers',
    'shared_agent_sessions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_by_org_admin', table_name);
    execute format(
      'create policy %I on public.%I for insert with check (app_private.is_org_admin(org_id))',
      table_name || '_insert_by_org_admin',
      table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_update_by_org_admin', table_name);
    execute format(
      'create policy %I on public.%I for update using (app_private.is_org_admin(org_id)) with check (app_private.is_org_admin(org_id))',
      table_name || '_update_by_org_admin',
      table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_delete_by_org_admin', table_name);
    execute format(
      'create policy %I on public.%I for delete using (app_private.is_org_admin(org_id))',
      table_name || '_delete_by_org_admin',
      table_name
    );
  end loop;
end $$;

drop policy if exists "email_preferences_select_by_membership" on public.email_preferences;
create policy "email_preferences_select_by_membership" on public.email_preferences
  for select using (
    app_private.is_org_member(org_id)
    and (user_id = auth.uid() or app_private.is_org_admin(org_id))
  );

drop policy if exists "email_preferences_insert_own" on public.email_preferences;
create policy "email_preferences_insert_own" on public.email_preferences
  for insert with check (
    app_private.is_org_member(org_id)
    and user_id = auth.uid()
  );

drop policy if exists "email_preferences_update_own" on public.email_preferences;
create policy "email_preferences_update_own" on public.email_preferences
  for update using (
    app_private.is_org_member(org_id)
    and user_id = auth.uid()
  )
  with check (
    app_private.is_org_member(org_id)
    and user_id = auth.uid()
  );

drop policy if exists "org_logos_storage_select_by_membership" on storage.objects;
create policy "org_logos_storage_select_by_membership" on storage.objects
  for select using (
    bucket_id = 'org-logos'
    and app_private.is_org_member_text((storage.foldername(name))[1])
  );

drop policy if exists "org_logos_storage_insert_by_admin" on storage.objects;
create policy "org_logos_storage_insert_by_admin" on storage.objects
  for insert with check (
    bucket_id = 'org-logos'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );

drop policy if exists "org_logos_storage_update_by_admin" on storage.objects;
create policy "org_logos_storage_update_by_admin" on storage.objects
  for update using (
    bucket_id = 'org-logos'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'org-logos'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );

drop policy if exists "org_logos_storage_delete_by_admin" on storage.objects;
create policy "org_logos_storage_delete_by_admin" on storage.objects
  for delete using (
    bucket_id = 'org-logos'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );

drop policy if exists "knowledge_docs_storage_select_by_membership" on storage.objects;
create policy "knowledge_docs_storage_select_by_membership" on storage.objects
  for select using (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_member_text((storage.foldername(name))[1])
  );

drop policy if exists "knowledge_docs_storage_insert_by_admin" on storage.objects;
create policy "knowledge_docs_storage_insert_by_admin" on storage.objects
  for insert with check (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );

drop policy if exists "knowledge_docs_storage_update_by_admin" on storage.objects;
create policy "knowledge_docs_storage_update_by_admin" on storage.objects
  for update using (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );

drop policy if exists "knowledge_docs_storage_delete_by_admin" on storage.objects;
create policy "knowledge_docs_storage_delete_by_admin" on storage.objects
  for delete using (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_admin_text((storage.foldername(name))[1])
  );
