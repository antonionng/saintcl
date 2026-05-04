import { getAccountProfileMetadata, getMetadataDisplayName } from "@/lib/account-profile";
import { getEmailPreferences } from "@/lib/email/preferences";
import { sendTemplatedEmail } from "@/lib/email/client";
import type { AdminWorkspaceDigestStats, AgentIntroductionDetails, UsageAlertDetails } from "@/lib/email/templates";
import { getResolvedTrialStatus, TRIAL_MESSAGE_LIMIT } from "@/lib/plans";
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
    ctaUrl: `${getBaseUrl()}/workspace`,
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

function summarizePersonaForIntroduction(persona: string | null | undefined) {
  if (!persona) {
    return null;
  }
  const cleaned = persona
    .replace(/Knowledge scope:[\s\S]*$/i, "")
    .replace(/Owner profile:[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return null;
  }
  if (cleaned.length <= 220) {
    return cleaned;
  }
  return `${cleaned.slice(0, 217).trimEnd()}...`;
}

function getAgentScopeLabel(scope: string | null | undefined) {
  if (scope === "team") return "team";
  if (scope === "org") return "organization";
  if (scope === "employee") return "personal";
  return null;
}

export async function sendAgentIntroductionEmail(input: {
  orgId: string;
  orgName: string;
  orgWebsite?: string | null;
  orgLogoUrl?: string | null;
  agentId: string;
  agentName: string;
  agentScope: "employee" | "team" | "org";
  agentModel?: string | null;
  agentPersona?: string | null;
  recipientUserId: string;
  assignerName?: string | null;
  ctaUrl?: string | null;
  trigger?: string | null;
}) {
  if (input.agentScope !== "employee") {
    return null;
  }

  const recipient = await getAuthUserSummary(input.recipientUserId);
  if (!recipient) {
    return null;
  }

  const introduction: AgentIntroductionDetails = {
    agentName: input.agentName,
    agentScopeLabel: getAgentScopeLabel(input.agentScope),
    agentBriefSummary: summarizePersonaForIntroduction(input.agentPersona),
    agentModel: input.agentModel ?? null,
    assignerName: input.assignerName ?? null,
  };

  return sendTemplatedEmail({
    orgId: input.orgId,
    userId: input.recipientUserId,
    email: recipient.email,
    templateKey: "agent-introduction",
    campaignKey: "agent-introduction",
    dedupeKey: `agent-introduction:${input.orgId}:${input.agentId}:${input.recipientUserId}`,
    recipientName: recipient.displayName,
    orgName: input.orgName,
    orgWebsite: input.orgWebsite ?? null,
    orgLogoUrl: input.orgLogoUrl ?? null,
    ctaUrl: input.ctaUrl ?? `${getBaseUrl()}/workspace`,
    agentIntroduction: introduction,
    metadata: {
      trigger: input.trigger ?? "agent_provisioned",
      agentId: input.agentId,
      agentScope: input.agentScope,
    },
  }).catch(() => null);
}

type AdminDigestOrgRow = {
  id: string;
  name: string;
  website?: string | null;
  trial_status?: string | null;
  trial_ends_at?: string | null;
  stripe_subscription_status?: string | null;
};

type AdminDigestMembershipRow = {
  org_id: string;
  user_id: string;
  role: OrgRole;
  orgs: AdminDigestOrgRow | AdminDigestOrgRow[] | null;
};

async function getAdminDigestAudience(limit = 200) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("org_members")
    .select("org_id, user_id, role, orgs(id, name, website, trial_status, trial_ends_at, stripe_subscription_status)")
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AdminDigestMembershipRow[];
}

async function buildAdminWorkspaceDigest(orgId: string, weekLabel: string): Promise<AdminWorkspaceDigestStats | null> {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [agentsCountResult, recentAgentsResult, walletResult, usageResult, terminalRunsResult, pendingApprovalsResult, requestEventsResult, sessionActivityResult] = await Promise.all([
    admin.from("agents").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin
      .from("agents")
      .select("id, name, created_at")
      .eq("org_id", orgId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("org_wallets").select("balance_cents").eq("org_id", orgId).maybeSingle(),
    admin.from("usage_events").select("amount_cents, created_at").eq("org_id", orgId).gte("created_at", sevenDaysAgo),
    admin.from("terminal_runs").select("id", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", sevenDaysAgo),
    admin.from("terminal_approvals").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "pending"),
    admin.from("request_events").select("id", { count: "exact", head: true }).eq("org_id", orgId).gte("occurred_at", sevenDaysAgo),
    admin.from("session_activity_events").select("session_key").eq("org_id", orgId).gte("occurred_at", sevenDaysAgo),
  ]);

  const agentCount = agentsCountResult.count ?? 0;
  const recentAgents = (recentAgentsResult.data ?? []) as Array<{ name?: string | null; created_at: string }>;
  const walletBalanceCents = ((walletResult.data as { balance_cents?: number | null } | null)?.balance_cents) ?? 0;
  const spendLast7dCents = ((usageResult.data ?? []) as Array<{ amount_cents?: number | null }>).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );
  const terminalRunsLast7d = terminalRunsResult.count ?? 0;
  const pendingApprovals = pendingApprovalsResult.count ?? 0;
  const requestEventsLast7d = requestEventsResult.count ?? 0;
  const activeSessionsLast7d = new Set(
    ((sessionActivityResult.data ?? []) as Array<{ session_key?: string | null }>)
      .map((row) => row.session_key)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  ).size;

  const noActivity =
    agentCount === 0 &&
    recentAgents.length === 0 &&
    spendLast7dCents === 0 &&
    terminalRunsLast7d === 0 &&
    pendingApprovals === 0 &&
    requestEventsLast7d === 0 &&
    activeSessionsLast7d === 0;

  if (noActivity) {
    return null;
  }

  return {
    weekLabel,
    agentCount,
    newAgentsLast7d: recentAgents.length,
    spendLast7dCents,
    walletBalanceCents,
    terminalRunsLast7d,
    pendingApprovals,
    requestEventsLast7d,
    activeSessionsLast7d,
    highlightedAgentNames: recentAgents
      .map((agent) => agent.name?.trim())
      .filter((name): name is string => typeof name === "string" && name.length > 0),
  };
}

export async function runAdminWorkspaceDigestSweep(limit = 200) {
  const memberships = await getAdminDigestAudience(limit);
  const weekLabel = getIsoWeekLabel();
  const digestByOrg = new Map<string, AdminWorkspaceDigestStats | null>();
  let processed = 0;
  let sent = 0;

  for (const membership of memberships) {
    processed += 1;
    const user = await getAuthUserSummary(membership.user_id);
    if (!user) {
      continue;
    }

    if (!digestByOrg.has(membership.org_id)) {
      digestByOrg.set(membership.org_id, await buildAdminWorkspaceDigest(membership.org_id, weekLabel));
    }
    const digest = digestByOrg.get(membership.org_id) ?? null;
    if (!digest) {
      continue;
    }

    const orgRow = Array.isArray(membership.orgs) ? membership.orgs[0] : membership.orgs;
    const orgName = orgRow?.name ?? "Saint AGI workspace";
    const orgWebsite = orgRow?.website ?? null;

    await sendTemplatedEmail({
      orgId: membership.org_id,
      userId: membership.user_id,
      email: user.email,
      templateKey: "admin-workspace-digest",
      campaignKey: "admin-workspace-digest",
      dedupeKey: `admin-workspace-digest:${membership.org_id}:${membership.user_id}:${weekLabel}`,
      recipientName: user.displayName,
      orgName,
      orgWebsite,
      ctaUrl: `${getBaseUrl()}/settings?tab=billing`,
      digest,
      metadata: {
        trigger: "admin_digest_cron",
        weekLabel,
        role: membership.role,
      },
    })
      .then(() => {
        sent += 1;
      })
      .catch(() => null);
  }

  return { processed, sent, weekLabel, orgsWithDigest: Array.from(digestByOrg.values()).filter(Boolean).length };
}

type UsageAlertState = {
  alerts: UsageAlertDetails[];
  trialMessageCount: number;
};

async function buildUsageAlertState(orgId: string, org?: AdminDigestOrgRow | null): Promise<UsageAlertState> {
  const admin = createAdminClient();
  if (!admin) {
    return { alerts: [], trialMessageCount: 0 };
  }

  const [walletResult, trialRequestResult] = await Promise.all([
    admin.from("org_wallets").select("balance_cents, low_balance_threshold_cents").eq("org_id", orgId).maybeSingle(),
    admin
      .from("request_events")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("source", "session_usage_logs")
      .eq("event_type", "request.completed"),
  ]);

  const alerts: UsageAlertDetails[] = [];
  const trialMessageCount = trialRequestResult.count ?? 0;
  const resolvedTrialStatus = getResolvedTrialStatus(org?.trial_status, org?.trial_ends_at);
  const trialUsageRatio = TRIAL_MESSAGE_LIMIT > 0 ? trialMessageCount / TRIAL_MESSAGE_LIMIT : 0;

  if (resolvedTrialStatus === "active" && trialMessageCount >= TRIAL_MESSAGE_LIMIT) {
    alerts.push({
      kind: "trial-limit",
      trialMessageCount,
      trialMessageLimit: TRIAL_MESSAGE_LIMIT,
    });
  } else if (resolvedTrialStatus === "active" && trialUsageRatio >= 0.8) {
    alerts.push({
      kind: "trial-warning",
      trialMessageCount,
      trialMessageLimit: TRIAL_MESSAGE_LIMIT,
    });
  }

  const wallet = walletResult.data as { balance_cents?: number | null; low_balance_threshold_cents?: number | null } | null;
  const hasPaidSubscription = Boolean(
    org?.stripe_subscription_status &&
      !["canceled", "incomplete_expired", "unpaid"].includes(org.stripe_subscription_status),
  );
  const balanceCents = wallet?.balance_cents ?? 0;
  const thresholdCents = wallet?.low_balance_threshold_cents ?? 0;

  if (hasPaidSubscription && thresholdCents > 0 && balanceCents <= thresholdCents) {
    alerts.push({
      kind: "wallet-low",
      walletBalanceCents: balanceCents,
      lowBalanceThresholdCents: thresholdCents,
    });
  }

  return { alerts, trialMessageCount };
}

function getUsageAlertDedupeKey(input: {
  orgId: string;
  userId: string;
  kind: UsageAlertDetails["kind"];
  dateLabel: string;
}) {
  if (input.kind === "wallet-low") {
    return `usage-alert:${input.kind}:${input.orgId}:${input.userId}:${input.dateLabel}`;
  }
  return `usage-alert:${input.kind}:${input.orgId}:${input.userId}`;
}

export async function runUsageNotificationSweep(limit = 200) {
  const memberships = await getAdminDigestAudience(limit);
  const dateLabel = new Date().toISOString().slice(0, 10);
  const stateByOrg = new Map<string, UsageAlertState>();
  let processed = 0;
  let sent = 0;

  for (const membership of memberships) {
    processed += 1;
    const user = await getAuthUserSummary(membership.user_id);
    if (!user) {
      continue;
    }

    const orgRow = Array.isArray(membership.orgs) ? membership.orgs[0] : membership.orgs;
    if (!stateByOrg.has(membership.org_id)) {
      stateByOrg.set(membership.org_id, await buildUsageAlertState(membership.org_id, orgRow));
    }
    const state = stateByOrg.get(membership.org_id);
    if (!state?.alerts.length) {
      continue;
    }

    const orgName = orgRow?.name ?? "Saint AGI workspace";
    const orgWebsite = orgRow?.website ?? null;

    for (const alert of state.alerts) {
      await sendTemplatedEmail({
        orgId: membership.org_id,
        userId: membership.user_id,
        email: user.email,
        templateKey: "usage-alert",
        campaignKey: `usage-alert:${alert.kind}`,
        dedupeKey: getUsageAlertDedupeKey({
          orgId: membership.org_id,
          userId: membership.user_id,
          kind: alert.kind,
          dateLabel,
        }),
        recipientName: user.displayName,
        orgName,
        orgWebsite,
        ctaUrl: `${getBaseUrl()}/settings?tab=billing`,
        usageAlert: alert,
        metadata: {
          trigger: "usage_notification_cron",
          role: membership.role,
          alertKind: alert.kind,
          trialMessageCount: state.trialMessageCount,
        },
      })
        .then(() => {
          sent += 1;
        })
        .catch(() => null);
    }
  }

  return { processed, sent, dateLabel, orgsChecked: stateByOrg.size };
}
