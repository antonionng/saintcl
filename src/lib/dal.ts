import { cache } from "react";
import { cookies } from "next/headers";

import type {
  BillingInterval,
  CurrentOrgSession,
  CurrentUserProfile,
  KnowledgeDocument,
  OrgRole,
  OrgTrialStatus,
  PlanTier,
  TeamRecord,
  UserProfileRecord,
  WorkspaceMembership,
} from "@/types";
import { canSessionAccessAssignment, getRoleCapabilities } from "@/lib/access";
import {
  ACCOUNT_AVATAR_BUCKET,
  getAccountProfileMetadata,
  getMetadataDisplayName,
  getPreferredUserDisplayName,
  mergeStoredUserProfileSources,
  mergeAccountProfileMetadata,
} from "@/lib/account-profile";
import { ORG_LOGO_BUCKET } from "@/lib/org-profile";
import { ACTIVE_ORG_COOKIE_NAME, resolveActiveWorkspace } from "@/lib/org-selection";
import { normalizeAgentSessionAlias, parseAgentSessionKey } from "@/lib/openclaw/session-keys";
import { normalizePlanTier, TRIAL_LENGTH_DAYS } from "@/lib/plans";
import { getIsSuperAdmin } from "@/lib/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveBillingInterval(value: unknown): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

function resolveTrialPlan(value: unknown): PlanTier {
  return normalizePlanTier(typeof value === "string" ? value : "starter");
}

function buildTrialWindow(now = new Date()) {
  const trialEndsAt = new Date(now.getTime() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000);
  return {
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
  };
}

async function ensureOrgFoundation(admin: NonNullable<ReturnType<typeof createAdminClient>>, orgId: string) {
  await Promise.all([
    admin.from("org_wallets").upsert({ org_id: orgId }),
    admin.from("org_policies").upsert({ org_id: orgId }),
  ]);
}

type OrgMembershipRow = {
  org_id: string;
  role: OrgRole | null;
  orgs:
    | {
        id: string;
        name: string;
        slug: string;
        plan: string;
        billing_interval?: BillingInterval | null;
        trial_status?: OrgTrialStatus | null;
        trial_started_at?: string | null;
        trial_ends_at?: string | null;
        trial_plan?: PlanTier | null;
        stripe_customer_id?: string | null;
        stripe_subscription_id?: string | null;
        stripe_subscription_status?: string | null;
        stripe_price_id?: string | null;
        stripe_current_period_end?: string | null;
        website?: string;
        company_summary?: string;
        agent_brief?: string;
        logo_path?: string | null;
        created_at: string;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        plan: string;
        billing_interval?: BillingInterval | null;
        trial_status?: OrgTrialStatus | null;
        trial_started_at?: string | null;
        trial_ends_at?: string | null;
        trial_plan?: PlanTier | null;
        stripe_customer_id?: string | null;
        stripe_subscription_id?: string | null;
        stripe_subscription_status?: string | null;
        stripe_price_id?: string | null;
        stripe_current_period_end?: string | null;
        website?: string;
        company_summary?: string;
        agent_brief?: string;
        logo_path?: string | null;
        created_at: string;
      }>
    | null;
};

type BasicOrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
};

type UserProfileRow = {
  user_id: string;
  display_name: string;
  what_i_do: string;
  agent_brief: string;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

type TeamRow = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeDocRow = {
  id: string;
  org_id: string;
  scope_type: "org" | "team" | "user";
  team_id: string | null;
  user_id: string | null;
  filename: string;
  mime_type: string | null;
  storage_path: string;
  content_text: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

function mapUserProfileRecord(row: UserProfileRow | null): UserProfileRecord | null {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    displayName: row.display_name,
    whatIDo: row.what_i_do,
    agentBrief: row.agent_brief,
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeamRecord(row: TeamRow): TeamRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKnowledgeDoc(row: KnowledgeDocRow): KnowledgeDocument {
  return {
    id: row.id,
    orgId: row.org_id,
    scopeType: row.scope_type,
    teamId: row.team_id,
    userId: row.user_id,
    filename: row.filename,
    mimeType: row.mime_type,
    contentText: row.content_text,
    chunkCount: row.chunk_count,
    status: row.chunk_count > 0 ? "indexed" : "processing",
    updatedAt: row.updated_at,
  };
}

function mapMetadataProfileRecord(
  userId: string,
  metadata: ReturnType<typeof getAccountProfileMetadata>,
): UserProfileRecord | null {
  if (!metadata) {
    return null;
  }

  return {
    userId,
    displayName: typeof metadata.display_name === "string" ? metadata.display_name : "",
    whatIDo: typeof metadata.what_i_do === "string" ? metadata.what_i_do : "",
    agentBrief: typeof metadata.agent_brief === "string" ? metadata.agent_brief : "",
    avatarPath: typeof metadata.avatar_path === "string" ? metadata.avatar_path : null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

function shouldFallbackToProfileMetadata(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("user_profiles") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("could not find the") ||
      message.includes("column") ||
      message.includes("relation"))
  );
}

function shouldFallbackToBasicOrgMembershipQuery(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("orgs") && message.includes("does not exist");
}

async function readUserProfileRecord(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
) {
  const result = await admin
    .from("user_profiles")
    .select("user_id, display_name, what_i_do, agent_brief, avatar_path, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: mapUserProfileRecord((result.data as UserProfileRow | null) ?? null),
    error: result.error,
  };
}

async function updateUserProfileMetadata(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  input: {
    displayName?: string;
    whatIDo?: string;
    agentBrief?: string;
    avatarPath?: string | null;
  },
) {
  const authUser = await admin.auth.admin.getUserById(userId);
  if (!authUser.data.user) {
    return null;
  }

  const userMetadata = mergeAccountProfileMetadata(authUser.data.user.user_metadata, {
    display_name: input.displayName,
    what_i_do: input.whatIDo,
    agent_brief: input.agentBrief,
    avatar_path: input.avatarPath,
  });
  const updated = await admin.auth.admin.updateUserById(userId, { user_metadata: userMetadata });
  if (!updated.data.user) {
    return null;
  }

  return mapMetadataProfileRecord(userId, getAccountProfileMetadata(updated.data.user));
}

async function getSignedAvatarUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.storage.from(ACCOUNT_AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) {
    return null;
  }

  return data.signedUrl;
}

async function getSignedOrgLogoUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.storage.from(ORG_LOGO_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) {
    return null;
  }

  return data.signedUrl;
}

function mapWorkspaceMembership(row: OrgMembershipRow): WorkspaceMembership | null {
  if (!row.orgs) {
    return null;
  }

  const org = Array.isArray(row.orgs) ? row.orgs[0] : row.orgs;
  if (!org) {
    return null;
  }

  const role = row.role ?? "member";

  return {
    org: {
      ...org,
      logoUrl: null,
    },
    role,
    capabilities: getRoleCapabilities(role),
  };
}

async function getUserWorkspaceMemberships(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
) {
  const membershipResult = await admin
    .from("org_members")
    .select("org_id, role, orgs(id, name, slug, plan, billing_interval, trial_status, trial_started_at, trial_ends_at, trial_plan, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, stripe_price_id, stripe_current_period_end, website, company_summary, agent_brief, logo_path, created_at)")
    .eq("user_id", userId);
  let memberships = ((membershipResult.data ?? []) as OrgMembershipRow[])
    .map(mapWorkspaceMembership)
    .filter((membership): membership is WorkspaceMembership => membership !== null);

  if (memberships.length === 0 && shouldFallbackToBasicOrgMembershipQuery(membershipResult.error)) {
    const basicMembershipResult = await admin.from("org_members").select("org_id, role").eq("user_id", userId);
    const basicRows = (basicMembershipResult.data ?? []) as Array<{ org_id: string; role: OrgRole | null }>;
    const orgIds = Array.from(new Set(basicRows.map((row) => row.org_id).filter(Boolean)));

    if (orgIds.length > 0) {
      const orgResult = await admin
        .from("orgs")
        .select("id, name, slug, plan, created_at")
        .in("id", orgIds);
      const orgById = new Map(
        ((orgResult.data ?? []) as BasicOrgRow[]).map((org) => [
          org.id,
          {
            ...org,
            billing_interval: null,
            trial_status: null,
            trial_started_at: null,
            trial_ends_at: null,
            trial_plan: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_subscription_status: null,
            stripe_price_id: null,
            stripe_current_period_end: null,
            website: undefined,
            company_summary: undefined,
            agent_brief: undefined,
            logo_path: null,
          },
        ]),
      );

      memberships = basicRows
        .map((row) => {
          const org = orgById.get(row.org_id);
          if (!org) {
            return null;
          }

          const role = row.role ?? "member";
          return {
            org: {
              ...org,
              logoUrl: null,
            },
            role,
            capabilities: getRoleCapabilities(role),
          } as WorkspaceMembership;
        })
        .filter(Boolean) as WorkspaceMembership[];
    }
  }

  const logos = await Promise.all(
    memberships.map(async (membership) => ({
      orgId: membership.org.id,
      logoUrl: await getSignedOrgLogoUrl(membership.org.logo_path),
    })),
  );
  const logoByOrg = new Map(logos.map((entry) => [entry.orgId, entry.logoUrl]));

  return memberships
    .map((membership) => ({
      ...membership,
      org: {
        ...membership.org,
        logoUrl: logoByOrg.get(membership.org.id) ?? null,
      },
    }))
    .sort((a, b) => a.org.name.localeCompare(b.org.name));
}

export const getCurrentOrg = cache(async (): Promise<CurrentOrgSession | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const { data: authUserResult } = await admin.auth.admin.getUserById(user.id);
  const canonicalUser = authUserResult?.user ?? user;
  const isSuperAdmin = getIsSuperAdmin(canonicalUser);

  const workspaceCookieStore = await cookies();
  const activeOrgId = workspaceCookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value ?? null;
  const memberships = await getUserWorkspaceMemberships(admin, user.id);
  const activeMembership = resolveActiveWorkspace(memberships, activeOrgId);

  if (activeMembership) {
    const orgLogoUrl =
      activeMembership.org.logoUrl ?? (await getSignedOrgLogoUrl(activeMembership.org.logo_path));

    await ensureOrgFoundation(admin, activeMembership.org.id);
    return {
      org: {
        ...activeMembership.org,
        logoUrl: orgLogoUrl,
      },
      role: activeMembership.role,
      isSuperAdmin,
      userId: user.id,
      email: user.email ?? null,
      capabilities: getRoleCapabilities(activeMembership.role, { isSuperAdmin }),
    };
  }

  const orgName = (user.user_metadata?.org_name as string) || "My Organization";
  const billingInterval = resolveBillingInterval(user.user_metadata?.billing_interval);
  const trialPlan = resolveTrialPlan(user.user_metadata?.trial_plan);
  const { trialStartedAt, trialEndsAt } = buildTrialWindow();
  const slug = `${slugify(orgName)}-${user.id.slice(0, 8)}`;

  const { data: org } = await admin
    .from("orgs")
    .insert({
      name: orgName,
      slug,
      plan: "starter",
      billing_interval: billingInterval,
      trial_status: "active",
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      trial_plan: trialPlan,
    })
    .select()
    .single();

  if (!org) return null;

  await admin.from("org_members").insert({ org_id: org.id, user_id: user.id, role: "owner" });
  await ensureOrgFoundation(admin, org.id);

  return {
    org: org as CurrentOrgSession["org"],
    role: "owner",
    isSuperAdmin,
    userId: user.id,
    email: user.email ?? null,
    capabilities: getRoleCapabilities("owner", { isSuperAdmin }),
  };
});

export async function getCurrentUserWorkspaces(): Promise<WorkspaceMembership[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  return getUserWorkspaceMemberships(admin, user.id);
}

export async function getOrgMembers(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data: memberships } = await admin
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  const members = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const { data, error } = await admin.auth.admin.getUserById(membership.user_id);
      if (error || !data.user) {
        return {
          userId: membership.user_id,
          email: null,
          displayName: null,
          role: (membership.role as OrgRole) ?? "member",
        };
      }

      return {
        userId: data.user.id,
        email: data.user.email ?? null,
        displayName: getMetadataDisplayName(data.user),
        role: (membership.role as OrgRole) ?? "member",
      };
    }),
  );

  return members.sort((a, b) => {
    const aLabel = (a.displayName ?? a.email ?? a.userId).toLowerCase();
    const bLabel = (b.displayName ?? b.email ?? b.userId).toLowerCase();
    return aLabel.localeCompare(bLabel);
  });
}

export async function getCurrentUserProfileRecord(userId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const [{ data: profile }, authUser] = await Promise.all([
    readUserProfileRecord(admin, userId),
    admin.auth.admin.getUserById(userId),
  ]);
  const metadataProfile = mapMetadataProfileRecord(userId, getAccountProfileMetadata(authUser.data.user ?? null));
  const mergedProfile = mergeStoredUserProfileSources(profile, metadataProfile);

  if (!profile && !metadataProfile) {
    return null;
  }

  return {
    userId,
    displayName: mergedProfile.displayName,
    whatIDo: mergedProfile.whatIDo,
    agentBrief: mergedProfile.agentBrief,
    avatarPath: mergedProfile.avatarPath,
    createdAt: profile?.createdAt ?? metadataProfile?.createdAt ?? new Date(0).toISOString(),
    updatedAt: profile?.updatedAt ?? metadataProfile?.updatedAt ?? new Date(0).toISOString(),
  };
}

export async function getUserProfileRecordById(userId: string) {
  return getCurrentUserProfileRecord(userId);
}

export async function loadCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const session = await getCurrentOrg();
  if (!session) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const [{ data: tableProfile }, { data: authUserResult }] = await Promise.all([
    readUserProfileRecord(admin, session.userId),
    admin.auth.admin.getUserById(session.userId),
  ]);

  const metadataProfile = mapMetadataProfileRecord(session.userId, getAccountProfileMetadata(authUserResult?.user ?? null));
  const profile = mergeStoredUserProfileSources(tableProfile, metadataProfile);
  const metadataDisplayName = getMetadataDisplayName(authUserResult?.user ?? null);
  const displayName = getPreferredUserDisplayName({
    profileDisplayName: profile.displayName,
    metadataDisplayName,
    email: session.email,
  });
  const avatarUrl = await getSignedAvatarUrl(profile.avatarPath);

  return {
    userId: session.userId,
    email: session.email ?? null,
    role: session.role,
    displayName,
    whatIDo: profile.whatIDo,
    agentBrief: profile.agentBrief,
    avatarPath: profile.avatarPath,
    avatarUrl,
  };
}

export const getCurrentUserProfile = cache(loadCurrentUserProfile);

export async function upsertCurrentUserProfile(input: { displayName: string; whatIDo: string; agentBrief: string }) {
  const session = await getCurrentOrg();
  if (!session) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const metadataProfile = await updateUserProfileMetadata(admin, session.userId, input);
  const existingProfile = await getCurrentUserProfileRecord(session.userId);
  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      {
        id: session.userId,
        user_id: session.userId,
        display_name: input.displayName,
        what_i_do: input.whatIDo,
        agent_brief: input.agentBrief,
        avatar_path: existingProfile?.avatarPath ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, display_name, what_i_do, agent_brief, avatar_path, created_at, updated_at")
    .single();

  const tableProfile = mapUserProfileRecord((data as UserProfileRow | null) ?? null);
  if (tableProfile) {
    return tableProfile;
  }

  if (metadataProfile && shouldFallbackToProfileMetadata(error)) {
    return metadataProfile;
  }

  return metadataProfile;
}

export async function updateCurrentUserAvatarPath(avatarPath: string) {
  const session = await getCurrentOrg();
  if (!session) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const metadataProfile = await updateUserProfileMetadata(admin, session.userId, { avatarPath });
  const existingProfile = await getCurrentUserProfileRecord(session.userId);
  const { error } = await admin.from("user_profiles").upsert(
    {
      id: session.userId,
      user_id: session.userId,
      display_name: existingProfile?.displayName ?? "",
      what_i_do: existingProfile?.whatIDo ?? "",
      agent_brief: existingProfile?.agentBrief ?? "",
      avatar_path: avatarPath,
    },
    { onConflict: "user_id" },
  );

  if (error && !shouldFallbackToProfileMetadata(error) && !metadataProfile) {
    return null;
  }

  return metadataProfile ?? getCurrentUserProfileRecord(session.userId);
}

export async function getOrgWallet(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  await ensureOrgFoundation(admin, orgId);
  const { data } = await admin.from("org_wallets").select("*").eq("org_id", orgId).maybeSingle();
  return data;
}

export async function getWalletLedger(orgId: string, limit = 50) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("wallet_ledger")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUsageEvents(orgId: string, limit = 100) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("usage_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUsageSummary(orgId: string) {
  const events = await getUsageEvents(orgId, 500);
  const totalSpendCents = events.reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  const last7dSpendCents = events
    .filter((event) => new Date(event.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, event) => sum + (event.amount_cents ?? 0), 0);
  return {
    totalSpendCents,
    last7dSpendCents,
    eventCount: events.length,
  };
}

export async function getOrgPolicy(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  await ensureOrgFoundation(admin, orgId);
  const { data } = await admin.from("org_policies").select("*").eq("org_id", orgId).maybeSingle();
  return data;
}

export async function getUserBudgetOverride(orgId: string, userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("user_budget_overrides")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getUserSpendCents(orgId: string, userId: string) {
  const admin = createAdminClient();
  if (!admin) return 0;
  const { data } = await admin
    .from("usage_events")
    .select("amount_cents")
    .eq("org_id", orgId)
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, entry) => sum + (entry.amount_cents ?? 0), 0);
}

export async function getAgentAssignments(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("agent_assignments")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAgentAssignment(agentId: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("agent_assignments")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .maybeSingle();
  return data;
}

export async function getAgents(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const [agentsResult, assignments] = await Promise.all([
    admin.from("agents").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    getAgentAssignments(orgId),
  ]);

  const assignmentMap = new Map(assignments.map((assignment) => [assignment.agent_id, assignment]));
  return (agentsResult.data ?? []).map((agent) => ({
    ...agent,
    assignment: assignmentMap.get(agent.id) ?? null,
  }));
}

export async function getAgentCount(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return 0;

  const result = await admin
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  return result.count ?? 0;
}

export async function getVisibleAgentsForSession(session: CurrentOrgSession) {
  const agents = await getAgents(session.org.id);
  return agents.filter((agent) => canSessionAccessAssignment(session, agent.assignment));
}

export async function getPreferredAgentForSession(session: CurrentOrgSession) {
  const visibleAgents = await getVisibleAgentsForSession(session);
  if (visibleAgents.length === 0) {
    return null;
  }

  const employeeAgents = visibleAgents.filter((agent) => {
    const assignment = agent.assignment as { assignee_type?: string; assignee_ref?: string } | null | undefined;
    return assignment?.assignee_type === "employee" && assignment.assignee_ref === session.userId;
  });

  const rankedEmployeeAgents = employeeAgents.sort((a, b) => {
    const aConfig = a.config && typeof a.config === "object" && !Array.isArray(a.config) ? (a.config as Record<string, unknown>) : {};
    const bConfig = b.config && typeof b.config === "object" && !Array.isArray(b.config) ? (b.config as Record<string, unknown>) : {};
    const aBootstrap = aConfig.bootstrap === "auto" ? 0 : 1;
    const bBootstrap = bConfig.bootstrap === "auto" ? 0 : 1;
    if (aBootstrap !== bBootstrap) {
      return bBootstrap - aBootstrap;
    }

    const aPersona = typeof aConfig.persona === "string" ? aConfig.persona : "";
    const bPersona = typeof bConfig.persona === "string" ? bConfig.persona : "";
    const aHasProfile = aPersona.includes("Owner profile:") ? 1 : 0;
    const bHasProfile = bPersona.includes("Owner profile:") ? 1 : 0;
    if (aHasProfile !== bHasProfile) {
      return bHasProfile - aHasProfile;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return rankedEmployeeAgents[0] ?? visibleAgents[0] ?? null;
}

export async function getAgent(id: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const [agentResult, assignment] = await Promise.all([
    admin.from("agents").select("*").eq("id", id).eq("org_id", orgId).maybeSingle(),
    getAgentAssignment(id, orgId),
  ]);

  if (!agentResult.data) return null;
  return {
    ...agentResult.data,
    assignment,
  };
}

export async function getAgentByOpenClawAgentId(openclawAgentId: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("agents")
    .select("*")
    .eq("org_id", orgId)
    .eq("openclaw_agent_id", openclawAgentId)
    .maybeSingle();

  return data;
}

export async function getVisibleAgentForSession(id: string, session: CurrentOrgSession) {
  const agent = await getAgent(id, session.org.id);
  if (!agent) return null;
  if (!canSessionAccessAssignment(session, agent.assignment)) return null;
  return agent;
}

export async function getChannels(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("channels")
    .select("*, agents(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getKnowledgeDocs(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("knowledge_docs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as KnowledgeDocRow[]).map(mapKnowledgeDoc);
}

export async function getTeams(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin.from("teams").select("*").eq("org_id", orgId).order("name", { ascending: true });
  return ((data ?? []) as TeamRow[]).map(mapTeamRecord);
}

export async function getTeam(id: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin.from("teams").select("*").eq("id", id).eq("org_id", orgId).maybeSingle();
  return data ? mapTeamRecord(data as TeamRow) : null;
}

export async function createTeam(input: {
  orgId: string;
  name: string;
  slug: string;
  description?: string;
  createdBy?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("teams")
    .insert({
      org_id: input.orgId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? "",
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  return data ? mapTeamRecord(data as TeamRow) : null;
}

export async function insertKnowledgeDoc(input: {
  orgId: string;
  scopeType: "org" | "team" | "user";
  filename: string;
  mimeType?: string | null;
  storagePath: string;
  contentText: string;
  chunkCount: number;
  teamId?: string | null;
  userId?: string | null;
  createdBy?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("knowledge_docs")
    .insert({
      org_id: input.orgId,
      scope_type: input.scopeType,
      team_id: input.teamId ?? null,
      user_id: input.userId ?? null,
      filename: input.filename,
      mime_type: input.mimeType ?? null,
      storage_path: input.storagePath,
      content_text: input.contentText,
      chunk_count: input.chunkCount,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  return data ? mapKnowledgeDoc(data as KnowledgeDocRow) : null;
}

export async function getKnowledgeDocsForAgentScope(input: {
  orgId: string;
  scope: "org" | "team" | "employee";
  assigneeRef?: string | null;
  userId?: string | null;
}) {
  const docs = await getKnowledgeDocs(input.orgId);
  if (input.scope === "org") {
    return docs.filter((doc) => doc.scopeType === "org");
  }

  if (input.scope === "team") {
    return docs.filter((doc) => doc.scopeType === "org" || (doc.scopeType === "team" && doc.teamId === input.assigneeRef));
  }

  return docs.filter(
    (doc) => doc.scopeType === "org" || (doc.scopeType === "user" && doc.userId === (input.assigneeRef ?? input.userId ?? null)),
  );
}

export async function getRuntimes(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("openclaw_runtimes")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAgentLogs(orgId: string, agentId?: string, limit = 20) {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("agent_logs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return data ?? [];
}

async function getVisibleAgentIds(session: CurrentOrgSession) {
  if (session.capabilities.canViewAllAgents) {
    return null;
  }

  const agents = await getVisibleAgentsForSession(session);
  return agents.map((agent) => agent.id);
}

async function getObservableSessionAgent(orgId: string, sessionKey: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const checkpoint = await admin
    .from("session_usage_checkpoints")
    .select("agent_id, model, provider")
    .eq("org_id", orgId)
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (checkpoint.data?.agent_id) {
    const agent = await getAgent(checkpoint.data.agent_id as string, orgId);
    if (agent) {
      return {
        agent,
        model: checkpoint.data.model ?? null,
        provider: checkpoint.data.provider ?? null,
      };
    }
  }

  const parsed = parseAgentSessionKey(sessionKey);
  if (parsed) {
    const rawAgent = await getAgentByOpenClawAgentId(parsed.openclawAgentId, orgId);
    if (rawAgent) {
      const agent = await getAgent(rawAgent.id, orgId);
      if (!agent) {
        return null;
      }
      return {
        agent,
        model: checkpoint.data?.model ?? null,
        provider: checkpoint.data?.provider ?? null,
      };
    }

    const { data: agentsByAlias } = await admin
      .from("agents")
      .select("*")
      .eq("org_id", orgId);
    const alias = normalizeAgentSessionAlias(parsed.openclawAgentId);
    const aliasMatches = (agentsByAlias ?? []).filter((agent) => {
      const openclawAgentId =
        "openclaw_agent_id" in agent && typeof agent.openclaw_agent_id === "string"
          ? agent.openclaw_agent_id
          : "";
      return normalizeAgentSessionAlias(openclawAgentId) === alias;
    });

    if (aliasMatches.length === 1) {
      const agent = await getAgent(aliasMatches[0].id, orgId);
      if (agent) {
        return {
          agent,
          model: checkpoint.data?.model ?? null,
          provider: checkpoint.data?.provider ?? null,
        };
      }
    }
  }

  const latestEvent = await admin
    .from("request_events")
    .select("agent_id, model, provider")
    .eq("org_id", orgId)
    .eq("session_key", sessionKey)
    .not("agent_id", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestEvent.data?.agent_id) {
    return null;
  }

  const agent = await getAgent(latestEvent.data.agent_id as string, orgId);
  if (!agent) {
    return null;
  }

  return {
    agent,
    model: latestEvent.data.model ?? null,
    provider: latestEvent.data.provider ?? null,
  };
}

export async function canSessionAccessObservableSession(sessionKey: string, session: CurrentOrgSession) {
  if (session.capabilities.canViewAllAgents) {
    return true;
  }

  const resolved = await getObservableSessionAgent(session.org.id, sessionKey);
  if (!resolved?.agent) {
    return false;
  }

  return canSessionAccessAssignment(session, resolved.agent.assignment);
}

export async function getObservableSessionContext(sessionKey: string, session: CurrentOrgSession) {
  const resolved = await getObservableSessionAgent(session.org.id, sessionKey);
  if (!resolved) {
    return null;
  }

  if (!session.capabilities.canViewAllAgents && !canSessionAccessAssignment(session, resolved.agent.assignment)) {
    return null;
  }

  return resolved;
}

export async function getRequestEventsForSession(
  session: CurrentOrgSession,
  filters: {
    limit?: number;
    before?: string;
    agentId?: string;
    sessionKey?: string;
    provider?: string;
    model?: string;
    status?: string;
    source?: string;
    includeTransport?: boolean;
    start?: string;
    end?: string;
  } = {},
) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const visibleAgentIds = await getVisibleAgentIds(session);
  if (visibleAgentIds && visibleAgentIds.length === 0) {
    return [];
  }

  let query = admin
    .from("request_events")
    .select("*")
    .eq("org_id", session.org.id)
    .order("occurred_at", { ascending: false })
    .limit(Math.min(filters.limit ?? 25, 100));

  if (visibleAgentIds) {
    query = query.in("agent_id", visibleAgentIds);
  }
  if (filters.before) {
    query = query.lt("occurred_at", filters.before);
  }
  if (filters.agentId) {
    query = query.eq("agent_id", filters.agentId);
  }
  if (filters.sessionKey) {
    query = query.eq("session_key", filters.sessionKey);
  }
  if (filters.provider) {
    query = query.eq("provider", filters.provider);
  }
  if (filters.model) {
    query = query.eq("model", filters.model);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  } else if (!filters.includeTransport) {
    query = query.eq("source", "session_usage_logs");
  }
  if (filters.start) {
    query = query.gte("occurred_at", filters.start);
  }
  if (filters.end) {
    query = query.lte("occurred_at", filters.end);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getSessionActivityEventsForSession(
  session: CurrentOrgSession,
  sessionKey: string,
  limit = 50,
) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const allowed = await canSessionAccessObservableSession(sessionKey, session);
  if (!allowed) {
    return [];
  }

  const { data } = await admin
    .from("session_activity_events")
    .select("*")
    .eq("org_id", session.org.id)
    .eq("session_key", sessionKey)
    .order("occurred_at", { ascending: false })
    .limit(Math.min(limit, 200));

  return data ?? [];
}

export async function getRecentSessionActivityEvents(orgId: string, limit = 20) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("session_activity_events")
    .select("*")
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getSessionModelOverrides(orgId: string, agentId?: string, limit = 20) {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin
    .from("session_model_overrides")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getRepoAllowlists(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("repo_allowlists")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAgentTerminalRepoAllowlists(agentId: string, orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("agent_terminal_repo_allowlists")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getTerminalApprovals(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("terminal_approvals")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getTerminalRuns(orgId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("terminal_runs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAgentTerminalRuns(agentId: string, orgId: string, limit = 20) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("terminal_runs")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));

  return data ?? [];
}

export async function getDashboardStats(orgId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return { agents: 0, channels: 0, docs: 0, runtimes: 0, balanceCents: 0, spendCents: 0 };
  }

  const [agents, channels, docs, runtimes, wallet, usage] = await Promise.all([
    admin.from("agents").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("channels").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("knowledge_docs").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("openclaw_runtimes").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    getOrgWallet(orgId),
    getUsageSummary(orgId),
  ]);

  return {
    agents: agents.count ?? 0,
    channels: channels.count ?? 0,
    docs: docs.count ?? 0,
    runtimes: runtimes.count ?? 0,
    balanceCents: wallet?.balance_cents ?? 0,
    spendCents: usage.totalSpendCents,
  };
}
