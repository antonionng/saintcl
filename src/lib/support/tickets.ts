import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type SupportTicketStatus = "open" | "waiting_on_customer" | "waiting_on_team" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportMessageDirection = "inbound" | "outbound" | "internal";
export type SupportMessageAuthorType = "requester" | "ai" | "team" | "system";
export type SupportAiDecision = "auto_replied" | "escalated" | "drafted" | "skipped";

export type SupportTicket = {
  id: string;
  public_token: string;
  requester_email: string;
  requester_name: string | null;
  company: string | null;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  source: string;
  summary: string | null;
  latest_message_preview: string | null;
  ai_last_decision: SupportAiDecision | null;
  ai_last_decision_reason: string | null;
  ai_auto_replies_count: number;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  escalated_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  direction: SupportMessageDirection;
  author_type: SupportMessageAuthorType;
  from_email: string | null;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  resend_message_id: string | null;
  resend_received_email_id: string | null;
  email_message_id: string | null;
  in_reply_to: string | null;
  ai_model: string | null;
  ai_decision: SupportAiDecision | null;
  ai_decision_reason: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type CreateSupportTicketInput = {
  requesterEmail: string;
  requesterName?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  source?: "contact_form" | "email_reply" | "manual";
  metadata?: Record<string, unknown>;
};

export type CreateSupportMessageInput = {
  ticketId: string;
  direction: SupportMessageDirection;
  authorType: SupportMessageAuthorType;
  fromEmail?: string | null;
  toEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  subject?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  resendMessageId?: string | null;
  resendReceivedEmailId?: string | null;
  emailMessageId?: string | null;
  inReplyTo?: string | null;
  aiModel?: string | null;
  aiDecision?: SupportAiDecision | null;
  aiDecisionReason?: string | null;
  metadata?: Record<string, unknown>;
};

function getAdminClientOrThrow() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }
  return admin;
}

function buildPublicToken() {
  return randomBytes(5).toString("hex").toUpperCase();
}

function preview(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const admin = getAdminClientOrThrow();
  const publicToken = buildPublicToken();
  const now = new Date().toISOString();

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      public_token: publicToken,
      requester_email: input.requesterEmail,
      requester_name: input.requesterName ?? null,
      company: input.company ?? null,
      subject: input.subject,
      source: input.source ?? "contact_form",
      latest_message_preview: preview(input.message),
      last_inbound_at: now,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !ticket) {
    throw error ?? new Error("Unable to create support ticket.");
  }

  await createSupportMessage({
    ticketId: ticket.id,
    direction: "inbound",
    authorType: "requester",
    fromEmail: input.requesterEmail,
    toEmails: ["support"],
    subject: input.subject,
    bodyText: input.message,
    metadata: { source: input.source ?? "contact_form" },
  });

  return ticket as SupportTicket;
}

export async function createSupportMessage(input: CreateSupportMessageInput) {
  const admin = getAdminClientOrThrow();
  const { data, error } = await admin
    .from("support_messages")
    .insert({
      ticket_id: input.ticketId,
      direction: input.direction,
      author_type: input.authorType,
      from_email: input.fromEmail ?? null,
      to_emails: input.toEmails ?? [],
      cc_emails: input.ccEmails ?? [],
      bcc_emails: input.bccEmails ?? [],
      subject: input.subject ?? null,
      body_text: input.bodyText ?? null,
      body_html: input.bodyHtml ?? null,
      resend_message_id: input.resendMessageId ?? null,
      resend_received_email_id: input.resendReceivedEmailId ?? null,
      email_message_id: input.emailMessageId ?? null,
      in_reply_to: input.inReplyTo ?? null,
      ai_model: input.aiModel ?? null,
      ai_decision: input.aiDecision ?? null,
      ai_decision_reason: input.aiDecisionReason ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create support message.");
  }

  return data as SupportMessage;
}

export async function markSupportTicketOutbound(input: {
  ticketId: string;
  status?: SupportTicketStatus;
  aiDecision?: SupportAiDecision;
  aiDecisionReason?: string | null;
  incrementAiReplies?: boolean;
}) {
  const admin = getAdminClientOrThrow();
  const patch: Record<string, unknown> = {
    last_outbound_at: new Date().toISOString(),
  };
  if (input.status) patch.status = input.status;
  if (input.aiDecision) patch.ai_last_decision = input.aiDecision;
  if (input.aiDecisionReason !== undefined) patch.ai_last_decision_reason = input.aiDecisionReason;
  if (input.incrementAiReplies) {
    const { data: ticket } = await admin
      .from("support_tickets")
      .select("ai_auto_replies_count")
      .eq("id", input.ticketId)
      .single();
    patch.ai_auto_replies_count = (ticket?.ai_auto_replies_count ?? 0) + 1;
  }

  await admin.from("support_tickets").update(patch).eq("id", input.ticketId);
}

export async function updateSupportTicketForInbound(input: {
  ticketId: string;
  latestMessage: string;
  status?: SupportTicketStatus;
}) {
  const admin = getAdminClientOrThrow();
  await admin
    .from("support_tickets")
    .update({
      latest_message_preview: preview(input.latestMessage),
      last_inbound_at: new Date().toISOString(),
      status: input.status ?? "open",
    })
    .eq("id", input.ticketId);
}

export async function escalateSupportTicket(input: {
  ticketId: string;
  priority?: SupportTicketPriority;
  reason: string;
  summary?: string | null;
}) {
  const admin = getAdminClientOrThrow();
  await admin
    .from("support_tickets")
    .update({
      priority: input.priority ?? "urgent",
      status: "waiting_on_team",
      escalated_at: new Date().toISOString(),
      ai_last_decision: "escalated",
      ai_last_decision_reason: input.reason,
      summary: input.summary ?? null,
    })
    .eq("id", input.ticketId);
}

export async function findSupportTicketByToken(token: string) {
  const admin = getAdminClientOrThrow();
  const { data } = await admin.from("support_tickets").select("*").eq("public_token", token).maybeSingle();
  return (data as SupportTicket | null) ?? null;
}

export async function findSupportTicketFromText(text: string) {
  const match = text.match(/SC-([A-Z0-9]{8,16})/i) ?? text.match(/support-([A-Z0-9]{8,16})/i);
  if (!match?.[1]) {
    return null;
  }
  return findSupportTicketByToken(match[1].toUpperCase());
}

export async function listSupportTickets() {
  const admin = getAdminClientOrThrow();
  const { data, error } = await admin
    .from("support_tickets")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) {
    throw error;
  }
  return (data ?? []) as SupportTicket[];
}

export async function getSupportTicketWithMessages(ticketId: string) {
  const admin = getAdminClientOrThrow();
  const [{ data: ticket, error: ticketError }, { data: messages, error: messagesError }] = await Promise.all([
    admin.from("support_tickets").select("*").eq("id", ticketId).single(),
    admin.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
  ]);
  if (ticketError || messagesError || !ticket) {
    throw ticketError ?? messagesError ?? new Error("Support ticket not found.");
  }
  return { ticket: ticket as SupportTicket, messages: (messages ?? []) as SupportMessage[] };
}
