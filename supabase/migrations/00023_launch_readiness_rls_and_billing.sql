alter table public.stripe_events
  add column if not exists status text not null default 'processing',
  add column if not exists processed_at timestamptz,
  add column if not exists error_message text;

alter table public.stripe_events
  drop constraint if exists stripe_events_status_check;

alter table public.stripe_events
  add constraint stripe_events_status_check
  check (status in ('processing', 'processed', 'failed'));

create or replace function app_private.is_team_member(target_org_id uuid, target_team_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_team_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then exists (
        select 1
        from public.team_members
        where org_id = target_org_id
          and team_id = target_team_id::uuid
          and user_id = auth.uid()
      )
    else false
  end;
$$;

create or replace function app_private.is_team_member_text(target_org_id text, target_team_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_org_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then app_private.is_team_member(target_org_id::uuid, target_team_id)
    else false
  end;
$$;

create or replace function app_private.can_access_assignment(
  target_org_id uuid,
  target_assignee_type text,
  target_assignee_ref text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app_private.is_org_admin(target_org_id)
    or (
      app_private.is_org_member(target_org_id)
      and (
        target_assignee_type = 'org'
        or (
          target_assignee_type = 'employee'
          and (
            target_assignee_ref = auth.uid()::text
            or target_assignee_ref = coalesce(auth.jwt() ->> 'email', '')
          )
        )
        or (
          target_assignee_type = 'team'
          and app_private.is_team_member(target_org_id, target_assignee_ref)
        )
      )
    );
$$;

grant execute on function app_private.is_team_member(uuid, text) to authenticated;
grant execute on function app_private.is_team_member_text(text, text) to authenticated;
grant execute on function app_private.can_access_assignment(uuid, text, text) to authenticated;
grant usage on schema app_private to service_role;

drop policy if exists "agents_select" on public.agents;
drop policy if exists "agents_select_by_membership" on public.agents;
create policy "agents_select_by_assignment" on public.agents
  for select using (
    app_private.is_org_admin(org_id)
    or exists (
      select 1
      from public.agent_assignments aa
      where aa.agent_id = agents.id
        and aa.org_id = agents.org_id
        and app_private.can_access_assignment(aa.org_id, aa.assignee_type, aa.assignee_ref)
    )
  );

drop policy if exists "agent_assignments_select" on public.agent_assignments;
drop policy if exists "agent_assignments_select_by_membership" on public.agent_assignments;
create policy "agent_assignments_select_by_assignment" on public.agent_assignments
  for select using (
    app_private.can_access_assignment(org_id, assignee_type, assignee_ref)
  );

drop policy if exists "knowledge_docs_select" on public.knowledge_docs;
drop policy if exists "knowledge_docs_select_by_membership" on public.knowledge_docs;
create policy "knowledge_docs_select_by_scope" on public.knowledge_docs
  for select using (
    app_private.is_org_admin(org_id)
    or (
      app_private.is_org_member(org_id)
      and (
        scope_type = 'org'
        or (scope_type = 'user' and user_id = auth.uid())
        or (scope_type = 'team' and app_private.is_team_member(org_id, team_id::text))
      )
    )
  );

drop policy if exists "knowledge_chunks_select" on public.knowledge_chunks;
drop policy if exists "knowledge_chunks_select_by_membership" on public.knowledge_chunks;
create policy "knowledge_chunks_select_by_doc_scope" on public.knowledge_chunks
  for select using (
    exists (
      select 1
      from public.knowledge_docs kd
      where kd.id = knowledge_chunks.doc_id
        and kd.org_id = knowledge_chunks.org_id
        and (
          app_private.is_org_admin(kd.org_id)
          or (
            app_private.is_org_member(kd.org_id)
            and (
              kd.scope_type = 'org'
              or (kd.scope_type = 'user' and kd.user_id = auth.uid())
              or (kd.scope_type = 'team' and app_private.is_team_member(kd.org_id, kd.team_id::text))
            )
          )
        )
    )
  );

drop policy if exists "knowledge_docs_storage_select" on storage.objects;
drop policy if exists "knowledge_docs_storage_select_by_membership" on storage.objects;
create policy "knowledge_docs_storage_select_by_scope" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'knowledge-docs'
    and app_private.is_org_member_text((storage.foldername(name))[1])
    and (
      (storage.foldername(name))[2] = 'org'
      or (
        (storage.foldername(name))[2] = 'user'
        and (storage.foldername(name))[3] = auth.uid()::text
      )
      or (
        (storage.foldername(name))[2] = 'team'
        and app_private.is_team_member_text((storage.foldername(name))[1], (storage.foldername(name))[3])
      )
    )
  );

create or replace function app_private.mutate_wallet(
  p_org_id uuid,
  p_amount_cents bigint,
  p_direction text,
  p_source_type text,
  p_description text,
  p_user_id uuid default null,
  p_agent_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_stripe_checkout_session_id text default null,
  p_stripe_payment_intent_id text default null
)
returns public.wallet_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.org_wallets%rowtype;
  v_next_balance bigint;
  v_ledger public.wallet_ledger%rowtype;
begin
  if p_amount_cents < 0 then
    raise exception 'Wallet amount must be non-negative.';
  end if;

  if p_direction not in ('credit', 'debit') then
    raise exception 'Invalid wallet direction.';
  end if;

  insert into public.org_wallets (org_id)
  values (p_org_id)
  on conflict (org_id) do nothing;

  select *
  into v_wallet
  from public.org_wallets
  where org_id = p_org_id
  for update;

  if not found then
    raise exception 'Wallet is unavailable.';
  end if;

  if p_direction = 'credit' then
    v_next_balance := v_wallet.balance_cents + p_amount_cents;
  else
    v_next_balance := v_wallet.balance_cents - p_amount_cents;
  end if;

  if p_direction = 'debit' and v_next_balance < 0 then
    raise exception 'Insufficient wallet balance.';
  end if;

  update public.org_wallets
  set balance_cents = v_next_balance
  where org_id = p_org_id;

  insert into public.wallet_ledger (
    org_id,
    user_id,
    agent_id,
    source_type,
    direction,
    amount_cents,
    balance_after_cents,
    description,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    metadata
  )
  values (
    p_org_id,
    p_user_id,
    p_agent_id,
    p_source_type,
    p_direction,
    p_amount_cents,
    v_next_balance,
    p_description,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_ledger;

  return v_ledger;
end;
$$;

create or replace function app_private.record_usage_charge(
  p_org_id uuid,
  p_event_type text,
  p_amount_cents bigint,
  p_description text,
  p_user_id uuid default null,
  p_agent_id uuid default null,
  p_quantity numeric default 1,
  p_unit text default 'operation',
  p_session_key text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_checkpoint_total_cost_usd numeric default null,
  p_checkpoint_total_tokens bigint default null,
  p_checkpoint_model text default null,
  p_checkpoint_provider text default null,
  p_checkpoint_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_events%rowtype;
  v_ledger public.wallet_ledger%rowtype;
  v_wallet public.org_wallets%rowtype;
begin
  insert into public.usage_events (
    org_id,
    user_id,
    agent_id,
    event_type,
    quantity,
    unit,
    amount_cents,
    session_key,
    metadata
  )
  values (
    p_org_id,
    p_user_id,
    p_agent_id,
    p_event_type,
    coalesce(p_quantity, 1),
    coalesce(p_unit, 'operation'),
    p_amount_cents,
    p_session_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_usage;

  v_ledger := app_private.mutate_wallet(
    p_org_id,
    p_amount_cents,
    'debit',
    p_event_type,
    p_description,
    p_user_id,
    p_agent_id,
    coalesce(p_metadata, '{}'::jsonb),
    null,
    null
  );

  if p_session_key is not null and p_checkpoint_total_cost_usd is not null then
    insert into public.session_usage_checkpoints (
      org_id,
      session_key,
      agent_id,
      model,
      provider,
      last_total_cost_usd,
      last_total_tokens,
      last_synced_at,
      metadata
    )
    values (
      p_org_id,
      p_session_key,
      p_agent_id,
      p_checkpoint_model,
      p_checkpoint_provider,
      p_checkpoint_total_cost_usd,
      coalesce(p_checkpoint_total_tokens, 0),
      now(),
      coalesce(p_checkpoint_metadata, '{}'::jsonb)
    )
    on conflict (org_id, session_key) do update
    set
      agent_id = excluded.agent_id,
      model = excluded.model,
      provider = excluded.provider,
      last_total_cost_usd = excluded.last_total_cost_usd,
      last_total_tokens = excluded.last_total_tokens,
      last_synced_at = excluded.last_synced_at,
      metadata = excluded.metadata;
  end if;

  select *
  into v_wallet
  from public.org_wallets
  where org_id = p_org_id;

  return jsonb_build_object(
    'usageEvent', to_jsonb(v_usage),
    'ledgerEntry', to_jsonb(v_ledger),
    'lowBalance', v_wallet.balance_cents <= v_wallet.low_balance_threshold_cents
  );
end;
$$;

grant execute on function app_private.mutate_wallet(
  uuid,
  bigint,
  text,
  text,
  text,
  uuid,
  uuid,
  jsonb,
  text,
  text
) to service_role;

grant execute on function app_private.record_usage_charge(
  uuid,
  text,
  bigint,
  text,
  uuid,
  uuid,
  numeric,
  text,
  text,
  jsonb,
  numeric,
  bigint,
  text,
  text,
  jsonb
) to service_role;
