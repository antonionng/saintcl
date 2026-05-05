-- PostgREST in this project only exposes the public schema, so the existing
-- app_private.mutate_wallet and app_private.record_usage_charge functions are
-- not callable via the supabase-js .rpc(...) bridge. Add thin SECURITY DEFINER
-- wrappers in the public schema that delegate to the app_private originals.
-- The wrappers preserve the same arguments and behaviour. Service role retains
-- execute access; anon and authenticated remain locked out.

create or replace function public.mutate_wallet(
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
set search_path = public, app_private
as $$
declare
  v_ledger public.wallet_ledger%rowtype;
begin
  v_ledger := app_private.mutate_wallet(
    p_org_id,
    p_amount_cents,
    p_direction,
    p_source_type,
    p_description,
    p_user_id,
    p_agent_id,
    p_metadata,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id
  );
  return v_ledger;
end;
$$;

create or replace function public.record_usage_charge(
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
set search_path = public, app_private
as $$
begin
  return app_private.record_usage_charge(
    p_org_id,
    p_event_type,
    p_amount_cents,
    p_description,
    p_user_id,
    p_agent_id,
    p_quantity,
    p_unit,
    p_session_key,
    p_metadata,
    p_checkpoint_total_cost_usd,
    p_checkpoint_total_tokens,
    p_checkpoint_model,
    p_checkpoint_provider,
    p_checkpoint_metadata
  );
end;
$$;

revoke execute on function public.mutate_wallet(
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
) from public, anon, authenticated;

revoke execute on function public.record_usage_charge(
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
) from public, anon, authenticated;

grant execute on function public.mutate_wallet(
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

grant execute on function public.record_usage_charge(
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
