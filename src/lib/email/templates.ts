import { announcementCards, companyProfile, companyRoles } from "../../components/landing/content";
import { formatCurrency, getBaseUrl } from "../utils";

export type EmailTemplateKey =
  | "welcome-1"
  | "welcome-2"
  | "welcome-3"
  | "weekly-digest"
  | "owner-use-cases"
  | "team-invite";

type EmailTemplateInput = {
  templateKey: EmailTemplateKey;
  recipientName?: string | null;
  recipientEmail?: string | null;
  orgName: string;
  orgWebsite?: string | null;
  orgLogoUrl?: string | null;
  inviterName?: string | null;
  inviteRoleLabel?: string | null;
  inviteUrl?: string | null;
  billedAmountCents?: number | null;
  unsubscribeUrl?: string | null;
  ctaUrl?: string | null;
};

type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
  category: "transactional" | "marketing";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(items: string[]) {
  return items
    .map(
      (item) =>
        `<li style="margin:0 0 12px 0;padding:0;color:#d4d4d8;line-height:1.7;font-size:15px;">${escapeHtml(item)}</li>`,
    )
    .join("");
}

function renderShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaUrl?: string | null;
  outro?: string;
  unsubscribeUrl?: string | null;
  orgLogoUrl?: string | null;
}) {
  const logoUrl = input.orgLogoUrl || `${getBaseUrl()}/saintclaw-placeholder-logo.png`;
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:28px 0 0 0;"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#f4f4f5;color:#09090b;text-decoration:none;font-weight:600;">${escapeHtml(input.ctaLabel)}</a></p>`
      : "";
  const bullets = input.bullets?.length
    ? `<ul style="padding-left:20px;margin:24px 0;">${renderList(input.bullets)}</ul>`
    : "";
  const unsubscribe =
    input.unsubscribeUrl
      ? `<p style="margin:28px 0 0 0;font-size:12px;line-height:1.6;color:#71717a;">You can manage non-essential email preferences here: <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#d4d4d8;">unsubscribe</a>.</p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#09090b;color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));padding:32px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
          <img src="${escapeHtml(logoUrl)}" alt="Saint AGI" style="height:42px;width:auto;display:block;" />
          <div>
            <p style="margin:0;color:#a1a1aa;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
            <p style="margin:6px 0 0 0;font-size:18px;font-weight:600;color:#f4f4f5;">${escapeHtml(companyProfile.brandName)}</p>
          </div>
        </div>
        <h1 style="margin:0 0 16px 0;font-size:32px;line-height:1.1;color:#ffffff;">${escapeHtml(input.title)}</h1>
        <p style="margin:0;color:#d4d4d8;font-size:16px;line-height:1.8;">${escapeHtml(input.intro)}</p>
        ${bullets}
        ${cta}
        ${
          input.outro
            ? `<p style="margin:28px 0 0 0;color:#d4d4d8;font-size:15px;line-height:1.8;">${escapeHtml(input.outro)}</p>`
            : ""
        }
        <p style="margin:32px 0 0 0;color:#a1a1aa;font-size:13px;line-height:1.7;">${escapeHtml(companyProfile.tagline)}</p>
        ${unsubscribe}
      </div>
    </div>
  </body>
</html>`;
}

export function renderEmailTemplate(input: EmailTemplateInput): RenderedEmailTemplate {
  const recipient = input.recipientName || input.recipientEmail || "there";

  switch (input.templateKey) {
    case "welcome-1": {
      const subject = `Welcome to ${input.orgName}. Your Saint AGI workspace is live`;
      const bullets = [
        "Set your company profile so every agent has the same baseline context.",
        "Create your first governed agent and give it a clear operating brief.",
        "Upload a few high-signal docs so responses start grounded in your business.",
      ];
      return {
        subject,
        category: "transactional",
        html: renderShell({
          eyebrow: "Welcome",
          title: `Welcome, ${recipient}.`,
          intro: `${input.orgName} is now live in Saint AGI. You have everything you need to turn the first workspace into something your team can trust and actually use.`,
          bullets,
          ctaLabel: "Open workspace",
          ctaUrl: input.ctaUrl,
          outro: "Start simple. One useful agent, one clear workflow, and one team that can prove the value fast.",
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
    case "welcome-2": {
      const subject = `Three rollout moves for ${input.orgName}`;
      const bullets = [
        "Give the workspace a sharp company summary so agents understand the business.",
        "Set approval and billing controls early so scale does not create chaos later.",
        "Pick one team use case where response time, volume, or quality already hurts.",
      ];
      return {
        subject,
        category: "marketing",
        html: renderShell({
          eyebrow: "Rollout",
          title: `A clean rollout beats a noisy launch.`,
          intro: `${recipient}, the fastest way to make Saint AGI stick is to launch around one painful workflow, prove the win, then expand from there.`,
          bullets,
          ctaLabel: "Review settings",
          ctaUrl: input.ctaUrl,
          outro: "The teams that scale best are the ones that add policy, ownership, and spend controls before usage gets messy.",
          unsubscribeUrl: input.unsubscribeUrl,
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
    case "welcome-3": {
      const subject = `Use case ideas your team can ship this month`;
      const bullets = companyRoles.slice(0, 6).map((role) => `${role.title}: ${role.detail}`);
      return {
        subject,
        category: "marketing",
        html: renderShell({
          eyebrow: "Use cases",
          title: `Turn AI into visible leverage.`,
          intro: `${recipient}, here are strong first use cases teams are already rolling out with Saint AGI. The key is to anchor them in work that already repeats every week.`,
          bullets,
          ctaLabel: "See pricing and rollout ideas",
          ctaUrl: input.ctaUrl,
          outro: "Once one workflow is working, give owners a simple scoreboard for speed, quality, and coverage. That is where internal momentum starts.",
          unsubscribeUrl: input.unsubscribeUrl,
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
    case "weekly-digest": {
      const subject = `${companyProfile.brandName} weekly. What matters for AI rollout this week`;
      const bullets = announcementCards.slice(0, 3).map((card) => `${card.title}. ${card.summary}`);
      return {
        subject,
        category: "marketing",
        html: renderShell({
          eyebrow: "Weekly digest",
          title: `What matters this week for ${input.orgName}`,
          intro:
            "A short read on the model, governance, and rollout shifts that matter if you are putting AI to work across a real team.",
          bullets,
          ctaLabel: "Read the latest news",
          ctaUrl: `${getBaseUrl()}/news/${announcementCards[0]?.slug ?? ""}`,
          outro: "Keep the model layer flexible, the runtime governed, and the rollout tied to measurable work. That is still the winning operating pattern.",
          unsubscribeUrl: input.unsubscribeUrl,
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
    case "owner-use-cases": {
      const subject = `Owner brief. High-leverage Saint AGI use cases for ${input.orgName}`;
      const bullets = [
        "Sales leaders can equip reps with research, outreach prep, and CRM hygiene.",
        "Support leads can cut first-response time while improving escalation context.",
        "Ops owners can route requests, chase handoffs, and keep work moving without extra headcount.",
        "Leadership can track adoption, guardrails, and ROI from one governed control surface.",
      ];
      return {
        subject,
        category: "marketing",
        html: renderShell({
          eyebrow: "Owner brief",
          title: `Practical use cases for workspace owners and admins`,
          intro:
            "If you are deciding where to expand next, prioritize workflows where delay, inconsistency, or manual triage already create visible drag. That is where Saint AGI compounds quickly.",
          bullets,
          ctaLabel: "Open workspace settings",
          ctaUrl: input.ctaUrl,
          outro: "Owners usually get the fastest wins by pairing one operational workflow with one governance workflow so adoption and control grow together.",
          unsubscribeUrl: input.unsubscribeUrl,
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
    case "team-invite": {
      const billedLabel =
        typeof input.billedAmountCents === "number" ? formatCurrency(input.billedAmountCents / 100) : null;
      const subject = `${input.inviterName || input.orgName} invited you to ${input.orgName} on Saint AGI`;
      const bullets = [
        `You have been invited as ${input.inviteRoleLabel || "a teammate"} in ${input.orgName}.`,
        billedLabel ? `${input.orgName} was charged ${billedLabel} when this invite was sent.` : "This invite was sent from the workspace settings area.",
        "Accept the invite with the same email address this message was sent to.",
      ];
      return {
        subject,
        category: "transactional",
        html: renderShell({
          eyebrow: "Workspace invite",
          title: `You are invited to join ${input.orgName}`,
          intro: `${input.inviterName || "A workspace admin"} wants you inside Saint AGI so you can collaborate in the same governed workspace.`,
          bullets,
          ctaLabel: "Accept invite",
          ctaUrl: input.inviteUrl,
          outro: "If this was unexpected, you can ignore the email. The invite will expire automatically.",
          orgLogoUrl: input.orgLogoUrl,
        }),
        text: `${subject}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`,
      };
    }
  }
}
