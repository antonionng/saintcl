create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete set null,
  public_token text not null unique,
  requester_email text not null,
  requester_name text,
  company text,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  source text not null default 'contact_form',
  summary text,
  latest_message_preview text,
  ai_last_decision text,
  ai_last_decision_reason text,
  ai_auto_replies_count integer not null default 0 check (ai_auto_replies_count >= 0),
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  escalated_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open', 'waiting_on_customer', 'waiting_on_team', 'closed')),
  check (priority in ('low', 'normal', 'high', 'urgent')),
  check (source in ('contact_form', 'email_reply', 'manual')),
  check (ai_last_decision is null or ai_last_decision in ('auto_replied', 'escalated', 'drafted', 'skipped'))
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc);

create index if not exists support_tickets_priority_created_idx
  on public.support_tickets (priority, created_at desc);

create index if not exists support_tickets_requester_email_idx
  on public.support_tickets (lower(requester_email));

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  org_id uuid references public.orgs(id) on delete set null,
  direction text not null,
  author_type text not null,
  from_email text,
  to_emails jsonb not null default '[]'::jsonb,
  cc_emails jsonb not null default '[]'::jsonb,
  bcc_emails jsonb not null default '[]'::jsonb,
  subject text,
  body_text text,
  body_html text,
  resend_message_id text,
  resend_received_email_id text,
  email_message_id text,
  in_reply_to text,
  ai_model text,
  ai_decision text,
  ai_decision_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (direction in ('inbound', 'outbound', 'internal')),
  check (author_type in ('requester', 'ai', 'team', 'system')),
  check (ai_decision is null or ai_decision in ('auto_replied', 'escalated', 'drafted', 'skipped'))
);

create index if not exists support_messages_ticket_created_idx
  on public.support_messages (ticket_id, created_at);

create index if not exists support_messages_resend_received_idx
  on public.support_messages (resend_received_email_id)
  where resend_received_email_id is not null;

create index if not exists support_messages_email_message_id_idx
  on public.support_messages (email_message_id)
  where email_message_id is not null;

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "support_tickets_no_client_access" on public.support_tickets
  for all using (false) with check (false);

create policy "support_messages_no_client_access" on public.support_messages
  for all using (false) with check (false);

create trigger set_updated_at_support_tickets
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

