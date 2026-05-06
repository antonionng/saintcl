import { NextResponse } from "next/server";
import { z } from "zod";

import { sendWaitlistAdminNotification, sendWaitlistConfirmation } from "@/lib/support/email";
import { createSupportMessage, createSupportTicket, markSupportTicketOutbound } from "@/lib/support/tickets";

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(240),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  teamSize: z.string().trim().max(80).optional().or(z.literal("")),
  useCase: z.string().trim().min(10).max(5000),
  website: z.string().trim().max(0).optional(),
});

function buildWaitlistMessage(input: z.infer<typeof waitlistSchema>) {
  return `Team size: ${input.teamSize || "Not provided"}

Use case:
${input.useCase}`;
}

export async function POST(request: Request) {
  const parsed = waitlistSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Check the waitlist form and try again." } },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  if (payload.website) {
    return NextResponse.json({ error: { message: "Invalid request." } }, { status: 400 });
  }

  const message = buildWaitlistMessage(payload);
  const ticket = await createSupportTicket({
    requesterEmail: payload.email,
    requesterName: payload.name,
    company: payload.company || null,
    subject: "Waiting list signup",
    message,
    metadata: {
      kind: "waitlist",
      teamSize: payload.teamSize || null,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  });

  const [confirmation, adminNotification] = await Promise.all([
    sendWaitlistConfirmation({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject: ticket.subject,
      message,
    }),
    sendWaitlistAdminNotification({
      ticketId: ticket.id,
      publicToken: ticket.public_token,
      requesterEmail: ticket.requester_email,
      requesterName: ticket.requester_name,
      company: ticket.company,
      subject: ticket.subject,
      message,
    }),
  ]);

  await Promise.all([
    createSupportMessage({
      ticketId: ticket.id,
      direction: "outbound",
      authorType: "system",
      fromEmail: "support",
      toEmails: [ticket.requester_email],
      subject: `You are on the Saint AGI waiting list [SC-${ticket.public_token}]`,
      bodyText: "Waitlist confirmation sent.",
      resendMessageId: confirmation.resendMessageId,
      metadata: { kind: "waitlist_confirmation" },
    }),
    createSupportMessage({
      ticketId: ticket.id,
      direction: "internal",
      authorType: "system",
      fromEmail: "support",
      toEmails: ["staff"],
      subject: `New Saint AGI waitlist signup: ${ticket.requester_email}`,
      bodyText: "Staff waitlist notification sent.",
      resendMessageId: adminNotification.resendMessageId,
      metadata: { kind: "waitlist_notification" },
    }),
    markSupportTicketOutbound({ ticketId: ticket.id, status: "waiting_on_team", aiDecision: "skipped" }),
  ]);

  return NextResponse.json({
    data: {
      ticketId: ticket.id,
      reference: `SC-${ticket.public_token}`,
    },
  });
}
