import { getAccountProfileMetadata, getMetadataDisplayName } from "@/lib/account-profile";
import { getEmailPreferences } from "@/lib/email/preferences";
import { sendTemplatedEmail } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/utils";
import type { CurrentOrgSession, OrgRole } from "@/types";

type MembershipAudienceRow = {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  orgs:
    | {
        name: string;
        website?: string | null;
      }
    | {
        name: string;
        website?: string | null;
      }[]
    | null;
};

function getIsoWeekLabel(date = new Date()) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function getAuthUserSummary(userId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const result = await admin.auth.admin.getUserById(userId);
  const user = result.data.user;
  if (!user || !user.email) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    createdAt: user.created_at ?? new Date().toISOString(),
    displayName: getMetadataDisplayName(user) ?? getAccountProfileMetadata(user)?.display_name ?? null,
  };
}

async function getMembershipAudience(limit = 100) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("org_members")
    .select("org_id, user_id, role, created_at, orgs(name, website)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as MembershipAudienceRow[];
}

function getOrgData(row: MembershipAudienceRow) {
  const org = Array.isArray(row.orgs) ? row.orgs[0] : row.orgs;
  return {
    name: org?.name ?? "Saint AGI workspace",
    website: org?.website ?? null,
  };
}

export async function sendWelcomeEmailForSession(session: CurrentOrgSession) {
  if (!session.email) {
    return null;
  }

  const user = await getAuthUserSummary(session.userId);
  const preferences = await getEmailPreferences(session.org.id, session.userId);
  if (preferences && !preferences.welcomeSeriesOptIn) {
    return null;
  }

  return sendTemplatedEmail({
    orgId: session.org.id,
    userId: session.userId,
    email: session.email,
    templateKey: "welcome-1",
    campaignKey: "welcome-series",
    dedupeKey: `welcome-1:${session.org.id}:${session.userId}`,
    recipientName: user?.displayName ?? null,
    orgName: session.org.name,
    orgWebsite: session.org.website ?? null,
    ctaUrl: `${getBaseUrl()}/dashboard`,
    metadata: {
      trigger: "auth_callback",
    },
  }).catch(() => null);
}

export async function runLifecycleEmailSweep(limit = 100) {
  const memberships = await getMembershipAudience(limit);
  let processed = 0;
  let sent = 0;

  for (const membership of memberships) {
    processed += 1;
    const user = await getAuthUserSummary(membership.user_id);
    if (!user) {
      continue;
    }

    const preferences = await getEmailPreferences(membership.org_id, membership.user_id);
    if (preferences && !preferences.welcomeSeriesOptIn) {
      continue;
    }

    const membershipAgeMs = Date.now() - new Date(membership.created_at).getTime();
    const org = getOrgData(membership);

    if (membershipAgeMs >= 24 * 60 * 60 * 1000) {
      await sendTemplatedEmail({
        orgId: membership.org_id,
        userId: membership.user_id,
        email: user.email,
        templateKey: "welcome-2",
        campaignKey: "welcome-series",
        dedupeKey: `welcome-2:${membership.org_id}:${membership.user_id}`,
        recipientName: user.displayName,
        orgName: org.name,
        orgWebsite: org.website,
        ctaUrl: `${getBaseUrl()}/settings?tab=general`,
        preferenceForUnsubscribe: "welcome",
        metadata: {
          trigger: "lifecycle_cron",
        },
      }).then(() => {
        sent += 1;
      }).catch(() => null);
    }

    if (membershipAgeMs >= 4 * 24 * 60 * 60 * 1000) {
      await sendTemplatedEmail({
        orgId: membership.org_id,
        userId: membership.user_id,
        email: user.email,
        templateKey: "welcome-3",
        campaignKey: "welcome-series",
        dedupeKey: `welcome-3:${membership.org_id}:${membership.user_id}`,
        recipientName: user.displayName,
        orgName: org.name,
        orgWebsite: org.website,
        ctaUrl: `${getBaseUrl()}/pricing`,
        preferenceForUnsubscribe: "welcome",
        metadata: {
          trigger: "lifecycle_cron",
        },
      }).then(() => {
        sent += 1;
      }).catch(() => null);
    }
  }

  return { processed, sent };
}

export async function runWeeklyEmailSweep(limit = 200) {
  const memberships = await getMembershipAudience(limit);
  const weekLabel = getIsoWeekLabel();
  let processed = 0;
  let sent = 0;

  for (const membership of memberships) {
    processed += 1;
    const user = await getAuthUserSummary(membership.user_id);
    if (!user) {
      continue;
    }

    const preferences = await getEmailPreferences(membership.org_id, membership.user_id);
    if (preferences && (!preferences.weeklyDigestOptIn || !preferences.marketingOptIn)) {
      continue;
    }

    const org = getOrgData(membership);

    await sendTemplatedEmail({
      orgId: membership.org_id,
      userId: membership.user_id,
      email: user.email,
      templateKey: "weekly-digest",
      campaignKey: "weekly-digest",
      dedupeKey: `weekly-digest:${membership.org_id}:${membership.user_id}:${weekLabel}`,
      recipientName: user.displayName,
      orgName: org.name,
      orgWebsite: org.website,
      preferenceForUnsubscribe: "weekly",
      metadata: {
        trigger: "weekly_cron",
        weekLabel,
      },
    }).then(() => {
      sent += 1;
    }).catch(() => null);

    if (membership.role === "owner" || membership.role === "admin") {
      await sendTemplatedEmail({
        orgId: membership.org_id,
        userId: membership.user_id,
        email: user.email,
        templateKey: "owner-use-cases",
        campaignKey: "owner-playbook",
        dedupeKey: `owner-use-cases:${membership.org_id}:${membership.user_id}:${weekLabel}`,
        recipientName: user.displayName,
        orgName: org.name,
        orgWebsite: org.website,
        ctaUrl: `${getBaseUrl()}/settings?tab=members`,
        preferenceForUnsubscribe: "marketing",
        metadata: {
          trigger: "weekly_cron",
          weekLabel,
          role: membership.role,
        },
      }).then(() => {
        sent += 1;
      }).catch(() => null);
    }
  }

  return { processed, sent, weekLabel };
}
