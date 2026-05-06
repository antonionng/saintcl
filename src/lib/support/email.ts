import { companyProfile } from "@/components/landing/content";
import { env } from "@/lib/env";
import { sendSupportEmail } from "@/lib/email/client";
import { getBaseUrl } from "@/lib/utils";

type SupportTicketEmailInput = {
  ticketId: string;
  publicToken: string;
  requesterEmail: string;
  requesterName?: string | null;
  company?: string | null;
  subject: string;
  message: string;
};

type SupportAiReplyInput = {
  ticketId: string;
  publicToken: string;
  requesterEmail: string;
  requesterName?: string | null;
  subject: string;
  reply: string;
  inReplyTo?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSupportShell(input: {
  eyebrow: string;
  title: string;
  body: string;
  reference?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}) {
  const logoUrl = `${getBaseUrl()}/saint-agi-mark.svg`;
  const reference = input.reference
    ? `<span style="display:inline-block;margin-top:14px;border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:7px 11px;color:#f4f4f5;background:#09090b;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(input.reference)}</span>`
    : "";
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:28px 0 0 0;"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;border-radius:999px;background:#ffffff;color:#09090b;padding:12px 20px;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(input.ctaLabel)}</a></p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#000000;color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:36px 20px;">
      <div style="border:1px solid rgba(255,255,255,0.10);border-radius:30px;background:#09090b;padding:34px;box-shadow:0 28px 80px rgba(0,0,0,0.45);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">
          <img src="${escapeHtml(logoUrl)}" alt="Saint AGI" style="height:42px;width:auto;display:block;" />
          <div>
            <p style="margin:0;color:#a1a1aa;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
            <p style="margin:6px 0 0 0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">${escapeHtml(companyProfile.brandName)}</p>
          </div>
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:34px;line-height:1.08;letter-spacing:-0.04em;">${escapeHtml(input.title)}</h1>
        ${reference}
        <div style="margin:28px 0 0 0;border:1px solid rgba(255,255,255,0.08);border-radius:22px;background:#000000;padding:22px;color:#e4e4e7;font-size:15px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(input.body)}</div>
        ${cta}
        ${
          input.footer
            ? `<p style="margin:30px 0 0 0;color:#a1a1aa;font-size:13px;line-height:1.7;">${escapeHtml(input.footer)}</p>`
            : ""
        }
        <p style="margin:22px 0 0 0;color:#71717a;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">SAINTAGI.COM</p>
      </div>
    </div>
  </body>
</html>`;
}

function buildReplyHeaders(input: { publicToken: string; inReplyTo?: string | null }) {
  const headers: Record<string, string> = {
    "X-Saint-Support-Token": input.publicToken,
  };
  if (input.inReplyTo) {
    headers["In-Reply-To"] = input.inReplyTo;
    headers.References = input.inReplyTo;
  }
  return headers;
}

export function getSupportReplyAddress(publicToken: string) {
  const replyTo = env.emailReplyTo || env.supportNotifyEmail;
  const [localPart, domain] = replyTo.split("@");
  if (!localPart || !domain) {
    return replyTo;
  }
  return `${localPart}+support-${publicToken}@${domain}`;
}

export async function sendContactConfirmation(input: SupportTicketEmailInput) {
  const subject = `We have your Saint AGI request [SC-${input.publicToken}]`;
  const body = `Hi ${input.requesterName || "there"},

Thanks for getting in touch. We have your request and will come back to you as soon as we can.

Request:
${input.subject}

You can reply directly to this email if you want to add anything else.`;

  return sendSupportEmail({
    to: input.requesterEmail,
    replyTo: getSupportReplyAddress(input.publicToken),
    subject,
    text: body,
    html: renderSupportShell({
      eyebrow: "Request received",
      title: "We have your request.",
      body,
      reference: `SC-${input.publicToken}`,
      footer: companyProfile.tagline,
    }),
    headers: buildReplyHeaders({ publicToken: input.publicToken }),
  });
}

export async function sendContactAdminNotification(input: SupportTicketEmailInput) {
  const ticketUrl = `${getBaseUrl()}/support`;
  const subject = `New Saint AGI contact request: ${input.subject}`;
  const body = `A new contact request was submitted.

Name: ${input.requesterName || "Not provided"}
Email: ${input.requesterEmail}
Company: ${input.company || "Not provided"}
Ticket: ${input.ticketId}

Message:
${input.message}

Open queue: ${ticketUrl}`;

  return sendSupportEmail({
    to: env.supportNotifyEmail,
    replyTo: input.requesterEmail,
    subject,
    text: body,
    html: renderSupportShell({
      eyebrow: "New contact request",
      title: input.subject,
      body,
      reference: `SC-${input.publicToken}`,
      ctaLabel: "Open support queue",
      ctaUrl: ticketUrl,
      footer: "This message was generated from the Saint AGI contact form.",
    }),
    headers: buildReplyHeaders({ publicToken: input.publicToken }),
  });
}

export async function sendAiSupportReply(input: SupportAiReplyInput) {
  const subject = input.subject.toLowerCase().startsWith("re:") ? input.subject : `Re: ${input.subject}`;
  const body = input.reply.trim();

  return sendSupportEmail({
    to: input.requesterEmail,
    bcc: env.supportBccEmail,
    replyTo: getSupportReplyAddress(input.publicToken),
    subject,
    text: body,
    html: renderSupportShell({
      eyebrow: "Saint AGI support",
      title: "Quick reply from Saint AGI",
      body,
      reference: `SC-${input.publicToken}`,
      footer: "A human on the team is copied on AI-assisted support replies.",
    }),
    headers: buildReplyHeaders({ publicToken: input.publicToken, inReplyTo: input.inReplyTo }),
  });
}

export async function sendSupportEscalation(input: SupportTicketEmailInput & { reason: string }) {
  const ticketUrl = `${getBaseUrl()}/support`;
  const subject = `Urgent Saint AGI support ticket: ${input.subject}`;
  const body = `A contact thread needs human attention.

Reason: ${input.reason}
Name: ${input.requesterName || "Not provided"}
Email: ${input.requesterEmail}
Company: ${input.company || "Not provided"}
Ticket: ${input.ticketId}

Latest message:
${input.message}

Open queue: ${ticketUrl}`;

  return sendSupportEmail({
    to: env.supportNotifyEmail,
    subject,
    text: body,
    html: renderSupportShell({
      eyebrow: "Urgent support",
      title: input.subject,
      body,
      reference: `SC-${input.publicToken}`,
      ctaLabel: "Open support queue",
      ctaUrl: ticketUrl,
      footer: "This thread was escalated by the AI support classifier.",
    }),
    headers: buildReplyHeaders({ publicToken: input.publicToken }),
  });
}
