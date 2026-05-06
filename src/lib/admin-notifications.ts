import { env } from "@/lib/env";
import { sendSupportEmail } from "@/lib/email/client";
import { getBaseUrl, formatCurrency, titleCase } from "@/lib/utils";
import type { OrgRole } from "@/types";

type DetailValue = string | number | boolean | null | undefined | Record<string, unknown>;

type AdminNotificationInput = {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  details: Record<string, DetailValue>;
};

type SignupNotificationInput = {
  userId: string;
  email?: string | null;
  createdAt?: string | null;
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: OrgRole;
  trialPlan?: string | null;
  billingInterval?: string | null;
  trialEndsAt?: string | null;
  userMetadata?: Record<string, unknown> | null;
  appMetadata?: Record<string, unknown> | null;
};

type InviteNotificationInput = {
  event: "sent" | "accepted";
  orgId: string;
  orgName: string;
  inviteId: string;
  invitedEmail: string;
  role: OrgRole;
  teamId?: string | null;
  teamName?: string | null;
  invitedByUserId?: string | null;
  invitedByEmail?: string | null;
  acceptedByUserId?: string | null;
  acceptedByEmail?: string | null;
  billedAmountCents?: number | null;
  billingStatus?: string | null;
};

type BillingNotificationInput = {
  event: "wallet_topup" | "subscription_started" | "subscription_renewed";
  orgId: string;
  orgName?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  amountCents?: number | null;
  planId?: string | null;
  interval?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  invoiceId?: string | null;
  checkoutSessionId?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stringifyDetail(value: DetailValue) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function formatMoney(value?: number | null) {
  return typeof value === "number" ? formatCurrency(value / 100) : null;
}

function renderAdminNotification(input: AdminNotificationInput) {
  const rows = Object.entries(input.details)
    .map(([label, value]) => {
      const renderedValue = stringifyDetail(value);
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#f4f4f5;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(renderedValue)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#09090b;color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:32px 20px;">
      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);padding:28px;">
        <p style="margin:0 0 10px 0;color:#a1a1aa;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
        <h1 style="margin:0 0 14px 0;color:#ffffff;font-size:28px;line-height:1.15;">${escapeHtml(input.title)}</h1>
        <p style="margin:0 0 22px 0;color:#d4d4d8;font-size:15px;line-height:1.7;">${escapeHtml(input.intro)}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </body>
</html>`;

  const text = `${input.title}\n\n${input.intro}\n\n${Object.entries(input.details)
    .map(([label, value]) => `${label}: ${stringifyDetail(value)}`)
    .join("\n")}`;

  return { html, text };
}

async function sendAdminNotification(input: AdminNotificationInput) {
  const { html, text } = renderAdminNotification(input);
  return sendSupportEmail({
    to: env.adminNotifyEmail,
    subject: input.subject,
    html,
    text,
  });
}

export async function notifyAdminOfSignup(input: SignupNotificationInput) {
  return sendAdminNotification({
    subject: `New Saint AGI signup: ${input.email ?? input.userId}`,
    eyebrow: "New signup",
    title: "A new user signed up",
    intro: "A new Saint AGI workspace owner completed signup and workspace creation.",
    details: {
      "User email": input.email,
      "User ID": input.userId,
      "User created": input.createdAt,
      "Workspace": input.orgName,
      "Workspace ID": input.orgId,
      "Workspace slug": input.orgSlug,
      "Role": titleCase(input.role),
      "Trial plan": input.trialPlan,
      "Billing interval": input.billingInterval,
      "Trial ends": input.trialEndsAt,
      "User metadata": input.userMetadata ?? {},
      "App metadata": input.appMetadata ?? {},
      "Dashboard": `${getBaseUrl()}/settings`,
    },
  });
}

export async function notifyAdminOfInvite(input: InviteNotificationInput) {
  const accepted = input.event === "accepted";
  return sendAdminNotification({
    subject: accepted
      ? `Workspace invite accepted: ${input.invitedEmail}`
      : `Workspace invite sent: ${input.invitedEmail}`,
    eyebrow: accepted ? "Invite accepted" : "Workspace invite",
    title: accepted ? "A workspace invite was accepted" : "A workspace user invite was sent",
    intro: accepted
      ? "An invited user joined a Saint AGI workspace."
      : "A workspace admin invited a new user to Saint AGI.",
    details: {
      "Workspace": input.orgName,
      "Workspace ID": input.orgId,
      "Invite ID": input.inviteId,
      "Invited email": input.invitedEmail,
      "Role": titleCase(input.role),
      "Team": input.teamName ?? input.teamId,
      "Invited by user ID": input.invitedByUserId,
      "Invited by email": input.invitedByEmail,
      "Accepted by user ID": input.acceptedByUserId,
      "Accepted by email": input.acceptedByEmail,
      "Seat charge": formatMoney(input.billedAmountCents),
      "Billing status": input.billingStatus,
      "Workspace settings": `${getBaseUrl()}/settings?tab=members`,
    },
  });
}

export async function notifyAdminOfBilling(input: BillingNotificationInput) {
  const titleByEvent = {
    wallet_topup: "A customer topped up their wallet",
    subscription_started: "A customer started a subscription",
    subscription_renewed: "A customer paid a subscription renewal",
  } satisfies Record<BillingNotificationInput["event"], string>;

  return sendAdminNotification({
    subject: `Saint AGI billing: ${titleByEvent[input.event]}`,
    eyebrow: "Billing",
    title: titleByEvent[input.event],
    intro: "Stripe reported a successful billing event for a Saint AGI workspace.",
    details: {
      "Event": input.event,
      "Workspace": input.orgName,
      "Workspace ID": input.orgId,
      "User ID": input.userId,
      "User email": input.userEmail,
      "Amount": formatMoney(input.amountCents),
      "Plan": input.planId,
      "Interval": input.interval,
      "Status": input.status,
      "Stripe customer": input.customerId,
      "Stripe subscription": input.subscriptionId,
      "Stripe invoice": input.invoiceId,
      "Stripe checkout session": input.checkoutSessionId,
      "Metadata": input.metadata ?? {},
      "Billing settings": `${getBaseUrl()}/settings?tab=billing`,
    },
  });
}
