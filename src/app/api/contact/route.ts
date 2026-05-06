import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { classifyAndDraftSupportReply } from "@/lib/support/ai";
import { sendAiSupportReply, sendContactAdminNotification, sendContactConfirmation, sendSupportEscalation } from "@/lib/support/email";
import {
  createSupportTicket,
  createSupportMessage,
  escalateSupportTicket,
  markSupportTicketOutbound,
} from "@/lib/support/tickets";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(240),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
  website: z.string().trim().max(0).optional(),
});

export async function POST(request: Request) {
  const payload = contactSchema.parse(await request.json());
  if (payload.website) {
    return NextResponse.json({ error: { message: "Invalid request." } }, { status: 400 });
  }

  const ticket = await createSupportTicket({
    requesterEmail: payload.email,
    requesterName: payload.name,
    company: payload.company || null,
    subject: payload.subject,
    message: payload.message,
    metadata: {
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  });

  const [confirmation, adminNotification] = await Promise.all([
    sendContactConfirmation({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject: ticket.subject,
      message: payload.message,
    }),
    sendContactAdminNotification({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject: ticket.subject,
      message: payload.message,
    }),
  ]);

  await Promise.all([
    createSupportMessage({
      ticketId: ticket.id,
      direction: "outbound",
      authorType: "system",
      fromEmail: "support",
      toEmails: [ticket.requester_email],
      subject: `We have your Saint AGI request [SC-${ticket.public_token}]`,
      bodyText: "Contact confirmation sent.",
      resendMessageId: confirmation.resendMessageId,
    }),
    createSupportMessage({
      ticketId: ticket.id,
      direction: "internal",
      authorType: "system",
      fromEmail: "support",
      toEmails: ["staff"],
      subject: `New Saint AGI contact request: ${ticket.subject}`,
      bodyText: "Staff notification sent.",
      resendMessageId: adminNotification.resendMessageId,
    }),
    markSupportTicketOutbound({ ticketId: ticket.id }),
  ]);

  let aiAction: "auto_replied" | "escalated" | "skipped" = "skipped";
  try {
    const decision = await classifyAndDraftSupportReply({
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      subject: ticket.subject,
      message: payload.message,
      previousSummary: ticket.summary,
    });

    if (decision.action === "auto_reply") {
      const sent = await sendAiSupportReply({
        ticketId: ticket.id,
        publicToken: ticket.public_token,
        requesterEmail: ticket.requester_email,
        requesterName: ticket.requester_name,
        subject: ticket.subject,
        reply: decision.reply,
      });
      await createSupportMessage({
        ticketId: ticket.id,
        direction: "outbound",
        authorType: "ai",
        fromEmail: "support",
        toEmails: [ticket.requester_email],
        bccEmails: [env.supportBccEmail],
        subject: `Re: ${ticket.subject}`,
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
      aiAction = "auto_replied";
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
        requesterEmail: ticket.requester_email,
        requesterName: ticket.requester_name,
        company: ticket.company,
        subject: ticket.subject,
        message: payload.message,
        reason: decision.reason,
      });
      aiAction = "escalated";
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI support triage failed.";
    await escalateSupportTicket({ ticketId: ticket.id, reason, summary: ticket.summary });
    await sendSupportEscalation({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject: ticket.subject,
      message: payload.message,
      reason,
    });
    aiAction = "escalated";
  }

  return NextResponse.json({
    data: {
      ticketId: ticket.id,
      reference: `SC-${ticket.public_token}`,
      aiAction,
    },
  });
}
