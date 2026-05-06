import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";

import { env } from "@/lib/env";
import { classifyAndDraftSupportReply } from "@/lib/support/ai";
import { sendAiSupportReply, sendSupportEscalation } from "@/lib/support/email";
import {
  createSupportMessage,
  createSupportTicket,
  escalateSupportTicket,
  findSupportTicketFromText,
  markSupportTicketOutbound,
  updateSupportTicketForInbound,
  type SupportTicket,
} from "@/lib/support/tickets";

const inboundWebhookSchema = z.object({
  type: z.string().optional(),
  data: z
    .object({
      email_id: z.string().optional(),
      from: z.union([z.string(), z.object({ email: z.string().optional(), name: z.string().optional() })]).optional(),
      to: z.unknown().optional(),
      cc: z.unknown().optional(),
      bcc: z.unknown().optional(),
      subject: z.string().optional(),
      message_id: z.string().optional(),
    })
    .optional(),
});

type RetrievedEmail = {
  id?: string;
  from?: string | { email?: string; name?: string };
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
  subject?: string;
  text?: string;
  html?: string;
  message_id?: string;
  in_reply_to?: string;
  headers?: Record<string, string>;
};

function verifyInboundWebhook(request: Request, payload: string) {
  if (!env.supportInboundWebhookSecret) {
    return null;
  }

  if (
    request.headers.get("authorization") === `Bearer ${env.supportInboundWebhookSecret}` ||
    request.headers.get("x-support-webhook-secret") === env.supportInboundWebhookSecret
  ) {
    return JSON.parse(payload);
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return null;
  }

  return new Webhook(env.supportInboundWebhookSecret).verify(payload, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });
}

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function extractEmail(value: unknown) {
  if (typeof value === "string") {
    const match = value.match(/<([^>]+)>/);
    return normalizeEmail(match?.[1] ?? value);
  }
  if (value && typeof value === "object" && "email" in value) {
    return normalizeEmail((value as { email?: string }).email);
  }
  return "";
}

function extractName(value: unknown) {
  if (value && typeof value === "object" && "name" in value) {
    return (value as { name?: string }).name ?? null;
  }
  if (typeof value === "string" && value.includes("<")) {
    return value.split("<")[0]?.trim().replace(/^"|"$/g, "") || null;
  }
  return null;
}

function extractEmails(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => extractEmail(entry)).filter(Boolean);
  }
  const email = extractEmail(value);
  return email ? [email] : [];
}

function shouldIgnoreSender(email: string) {
  const ignored = [env.supportNotifyEmail, env.supportBccEmail, env.emailReplyTo].map(normalizeEmail).filter(Boolean);
  return ignored.includes(normalizeEmail(email));
}

async function retrieveReceivedEmail(emailId: string) {
  if (!env.resendApiKey) {
    throw new Error("Resend is not configured.");
  }

  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${env.resendApiKey}` },
  });
  if (!response.ok) {
    throw new Error(`Unable to retrieve inbound email from Resend (${response.status}).`);
  }
  return (await response.json()) as RetrievedEmail;
}

async function resolveTicket(input: {
  subject: string;
  bodyText: string;
  lookupText: string;
  requesterEmail: string;
  requesterName?: string | null;
}) {
  const ticket = await findSupportTicketFromText(input.lookupText);
  if (ticket) {
    return ticket;
  }

  return createSupportTicket({
    requesterEmail: input.requesterEmail,
    requesterName: input.requesterName,
    subject: input.subject || "Inbound support email",
    message: input.bodyText || "(No text body)",
    source: "email_reply",
  });
}

export async function POST(request: Request) {
  if (!env.supportInboundWebhookSecret) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const payload = await request.text();
  let verifiedPayload: unknown;
  try {
    verifiedPayload = verifyInboundWebhook(request, payload);
  } catch {
    verifiedPayload = null;
  }

  if (!verifiedPayload) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const parsed = inboundWebhookSchema.parse(verifiedPayload);
  const webhookData = parsed.data ?? {};
  const emailId = webhookData.email_id;
  if (!emailId) {
    return NextResponse.json({ error: { message: "Missing email_id." } }, { status: 400 });
  }

  const received = await retrieveReceivedEmail(emailId);
  const from = received.from ?? webhookData.from;
  const requesterEmail = extractEmail(from);
  if (!requesterEmail || shouldIgnoreSender(requesterEmail)) {
    return NextResponse.json({ data: { ignored: true } });
  }

  const subject = received.subject ?? webhookData.subject ?? "Inbound support email";
  const bodyText = received.text?.trim() || "(No text body)";
  const bodyHtml = received.html ?? null;
  const toEmails = extractEmails(received.to ?? webhookData.to);
  const ccEmails = extractEmails(received.cc ?? webhookData.cc);
  const bccEmails = extractEmails(received.bcc ?? webhookData.bcc);
  const ticket = (await resolveTicket({
    subject,
    bodyText,
    lookupText: [subject, bodyText, ...toEmails, ...ccEmails, ...bccEmails].join("\n"),
    requesterEmail,
    requesterName: extractName(from),
  })) as SupportTicket;

  await updateSupportTicketForInbound({ ticketId: ticket.id, latestMessage: bodyText });
  await createSupportMessage({
    ticketId: ticket.id,
    direction: "inbound",
    authorType: "requester",
    fromEmail: requesterEmail,
    toEmails,
    ccEmails,
    bccEmails,
    subject,
    bodyText,
    bodyHtml,
    resendReceivedEmailId: emailId,
    emailMessageId: received.message_id ?? webhookData.message_id ?? null,
    inReplyTo: received.in_reply_to ?? received.headers?.["in-reply-to"] ?? null,
  });

  try {
    const decision = await classifyAndDraftSupportReply({
      requesterEmail,
      requesterName: ticket.requester_name,
      subject,
      message: bodyText,
      previousSummary: ticket.summary,
    });

    if (decision.action === "auto_reply") {
      const sent = await sendAiSupportReply({
        ticketId: ticket.id,
        publicToken: ticket.public_token,
        requesterEmail,
        requesterName: ticket.requester_name,
        subject,
        reply: decision.reply,
        inReplyTo: received.message_id ?? webhookData.message_id ?? null,
      });
      await createSupportMessage({
        ticketId: ticket.id,
        direction: "outbound",
        authorType: "ai",
        fromEmail: "support",
        toEmails: [requesterEmail],
        bccEmails: [env.supportBccEmail],
        subject: subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`,
        bodyText: decision.reply,
        resendMessageId: sent.resendMessageId,
        aiModel: env.supportAiModel,
        aiDecision: "auto_replied",
        aiDecisionReason: decision.reason,
      });
      await markSupportTicketOutbound({
        ticketId: ticket.id,
        status: "waiting_on_customer",
        aiDecision: "auto_replied",
        aiDecisionReason: decision.reason,
        incrementAiReplies: true,
      });
    } else {
      await escalateSupportTicket({
        ticketId: ticket.id,
        priority: decision.priority === "low" ? "normal" : decision.priority,
        reason: decision.reason,
        summary: decision.summary,
      });
      await sendSupportEscalation({
        ticketId: ticket.id,
        publicToken: ticket.public_token,
        requesterEmail,
        requesterName: ticket.requester_name,
        company: ticket.company,
        subject,
        message: bodyText,
        reason: decision.reason,
      });
    }

    return NextResponse.json({ data: { ticketId: ticket.id, action: decision.action } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI support triage failed.";
    await escalateSupportTicket({ ticketId: ticket.id, reason, summary: ticket.summary });
    await sendSupportEscalation({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject,
      message: bodyText,
      reason,
    });
    return NextResponse.json({ data: { ticketId: ticket.id, action: "escalated" } });
  }
}
