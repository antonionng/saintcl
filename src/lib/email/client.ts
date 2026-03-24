import { env, isResendConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEmailActionToken } from "@/lib/email/tokens";
import { type EmailTemplateKey, renderEmailTemplate } from "@/lib/email/templates";
import { getBaseUrl } from "@/lib/utils";

type SendTemplatedEmailInput = {
  orgId: string;
  userId?: string | null;
  inviteId?: string | null;
  email: string;
  templateKey: EmailTemplateKey;
  campaignKey?: string | null;
  dedupeKey?: string | null;
  recipientName?: string | null;
  orgName: string;
  orgWebsite?: string | null;
  orgLogoUrl?: string | null;
  inviterName?: string | null;
  inviteRoleLabel?: string | null;
  inviteUrl?: string | null;
  billedAmountCents?: number | null;
  preferenceForUnsubscribe?: "marketing" | "weekly" | "welcome" | null;
  metadata?: Record<string, unknown>;
  ctaUrl?: string | null;
};

export function buildUnsubscribeUrl(input: {
  orgId: string;
  userId: string;
  email: string;
  preference: "marketing" | "weekly" | "welcome";
}) {
  const token = createEmailActionToken({
    kind: "unsubscribe",
    orgId: input.orgId,
    userId: input.userId,
    email: input.email,
    preference: input.preference,
  });
  return `${getBaseUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function reserveEmailEvent(input: {
  orgId: string;
  userId?: string | null;
  inviteId?: string | null;
  email: string;
  templateKey: string;
  campaignKey?: string | null;
  dedupeKey?: string | null;
  subject: string;
  category: "transactional" | "marketing";
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  if (input.dedupeKey) {
    const existing = await admin
      .from("email_events")
      .select("id, resend_message_id, status")
      .eq("dedupe_key", input.dedupeKey)
      .maybeSingle();
    if (existing.data?.id) {
      return {
        id: existing.data.id,
        duplicate: true,
        resendMessageId: existing.data.resend_message_id,
        status: existing.data.status,
      };
    }
  }

  const { data, error } = await admin
    .from("email_events")
    .insert({
      org_id: input.orgId,
      user_id: input.userId ?? null,
      invite_id: input.inviteId ?? null,
      email: input.email,
      template_key: input.templateKey,
      campaign_key: input.campaignKey ?? null,
      category: input.category,
      status: "queued",
      dedupe_key: input.dedupeKey ?? null,
      subject: input.subject,
      metadata: input.metadata ?? {},
    })
    .select("id, resend_message_id, status")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to reserve email event.");
  }

  return {
    id: data.id,
    duplicate: false,
    resendMessageId: data.resend_message_id,
    status: data.status,
  };
}

async function updateEmailEvent(
  eventId: string,
  input: {
    status: "sent" | "failed" | "skipped";
    resendMessageId?: string | null;
    errorMessage?: string | null;
  },
) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  await admin
    .from("email_events")
    .update({
      status: input.status,
      resend_message_id: input.resendMessageId ?? null,
      error_message: input.errorMessage ?? null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", eventId);

  return true;
}

export async function sendTemplatedEmail(input: SendTemplatedEmailInput) {
  const unsubscribeUrl =
    input.preferenceForUnsubscribe && input.userId
      ? buildUnsubscribeUrl({
          orgId: input.orgId,
          userId: input.userId,
          email: input.email,
          preference: input.preferenceForUnsubscribe,
        })
      : null;

  const rendered = renderEmailTemplate({
    templateKey: input.templateKey,
    recipientName: input.recipientName,
    recipientEmail: input.email,
    orgName: input.orgName,
    orgWebsite: input.orgWebsite,
    orgLogoUrl: input.orgLogoUrl,
    inviterName: input.inviterName,
    inviteRoleLabel: input.inviteRoleLabel,
    inviteUrl: input.inviteUrl,
    billedAmountCents: input.billedAmountCents,
    unsubscribeUrl,
    ctaUrl: input.ctaUrl,
  });

  const event = await reserveEmailEvent({
    orgId: input.orgId,
    userId: input.userId,
    inviteId: input.inviteId,
    email: input.email,
    templateKey: input.templateKey,
    campaignKey: input.campaignKey,
    dedupeKey: input.dedupeKey,
    subject: rendered.subject,
    category: rendered.category,
    metadata: {
      ...(input.metadata ?? {}),
      unsubscribeUrl,
    },
  });

  if (event.duplicate && event.status === "sent") {
    return { ok: true as const, eventId: event.id, duplicate: true, resendMessageId: event.resendMessageId ?? null };
  }

  if (!isResendConfigured() || !env.resendApiKey) {
    await updateEmailEvent(event.id, {
      status: "failed",
      errorMessage: "Resend is not configured.",
    });
    throw new Error("Resend is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFrom,
      reply_to: env.emailReplyTo,
      to: [input.email],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }),
  });

  const body = (await response.json()) as { id?: string; message?: string; error?: { message?: string } };
  if (!response.ok || !body.id) {
    const errorMessage = body.error?.message || body.message || "Unable to send email.";
    await updateEmailEvent(event.id, {
      status: "failed",
      errorMessage,
    });
    throw new Error(errorMessage);
  }

  await updateEmailEvent(event.id, {
    status: "sent",
    resendMessageId: body.id,
  });

  return { ok: true as const, eventId: event.id, duplicate: false, resendMessageId: body.id };
}
