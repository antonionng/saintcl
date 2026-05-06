import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceBootstrapPending } from "@/components/workspace/workspace-bootstrap-pending";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getCurrentOrg, getCurrentUserProfile, getPreferredAgentForSession, getTrialMessageUsageCount } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { injectAgentContext } from "@/lib/openclaw/context-injection";
import { resolveAgentWorkspaceFromConfig } from "@/lib/openclaw/agent-terminal";
import { recordRuntimePressureSample } from "@/lib/openclaw/runtime-pressure";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { buildAgentSessionKey } from "@/lib/openclaw/session-keys";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";
import {
  getTrialMessageLimitMessage,
  hasTrialMessageCapacity,
  isTrialModelRestrictionActive,
  normalizeTrialFreeModelId,
  TRIAL_DEFAULT_MODEL_ID,
  TRIAL_FALLBACK_FREE_MODEL_ID,
  TRIAL_MESSAGE_LIMIT,
} from "@/lib/plans";

type NonNullOrgSession = NonNullable<Awaited<ReturnType<typeof getCurrentOrg>>>;

function orgNeedsCompanyContextOnboarding(session: NonNullOrgSession) {
  if (!session.capabilities.canManagePolicies) {
    return false;
  }
  const { website, company_summary, agent_brief } = session.org;
  const hasWebsite = Boolean(website?.trim());
  const hasSummary = Boolean(company_summary?.trim());
  const hasBrief = Boolean(agent_brief?.trim());
  return !hasWebsite && !hasSummary && !hasBrief;
}

type WorkspaceOnboardingSequence = "none" | "profile_only" | "company_only" | "company_then_profile";

function resolveWorkspaceOnboardingSequence(
  session: NonNullOrgSession,
  profileIncomplete: boolean,
): WorkspaceOnboardingSequence {
  const orgGate = orgNeedsCompanyContextOnboarding(session);
  if (orgGate && profileIncomplete) {
    return "company_then_profile";
  }
  if (orgGate) {
    return "company_only";
  }
  if (profileIncomplete) {
    return "profile_only";
  }
  return "none";
}

function profileNeedsOnboarding(profile: {
  displayName?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
} | null) {
  return [profile?.displayName, profile?.whatIDo, profile?.agentBrief].some(
    (value) => typeof value !== "string" || value.trim().length === 0,
  );
}

async function getRequestOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configuredUrl) return configuredUrl;

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "";

  const protocol =
    headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function autoBootstrapIfMissing(canProvisionAgent: boolean) {
  if (!canProvisionAgent || !isOpenClawConfigured()) return;

  const base = await getRequestOrigin();
  if (!base) return;

  try {
    const cookieHeader = (await cookies())
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
    await fetch(`${base}/api/openclaw/bootstrap`, {
      method: "POST",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });
  } catch {
    // The workspace can still render the manual provisioning state if bootstrap fails.
  }
}

type RuntimeRepairAgent = {
  id: string;
  org_id: string;
  user_id?: string | null;
  name: string;
  model: string;
  openclaw_agent_id: string;
  config?: unknown;
  assignment?: { assignee_type?: string; assignee_ref?: string } | null;
};

type RuntimeRepairProfile = {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
} | null;

type RuntimeRepairResult =
  | { ok: true; model: string | null }
  | { ok: false; model: string | null; error: string };

async function repairManagedRuntimeConfig(
  orgId: string,
  agent?: RuntimeRepairAgent | null,
  options?: { trialActive?: boolean; org: NonNullOrgSession["org"]; profile: RuntimeRepairProfile },
): Promise<RuntimeRepairResult> {
  if (!isOpenClawConfigured()) return { ok: true, model: null };

  try {
    const { client } = await getTenantOpenClawClient(orgId, { orgId });
    const normalizedModel = normalizeTrialFreeModelId(agent?.model);
    const repairedModel =
      options?.trialActive === true &&
      normalizedModel !== TRIAL_DEFAULT_MODEL_ID &&
      normalizedModel !== TRIAL_FALLBACK_FREE_MODEL_ID
        ? TRIAL_DEFAULT_MODEL_ID
        : normalizedModel;

    if (agent && repairedModel) {
      const workspace = resolveAgentWorkspaceFromConfig({
        orgId,
        openClawAgentId: agent.openclaw_agent_id,
        config: agent.config,
      });

      // If the agent was moved to a new dedicated gateway (or the gateway was
      // recreated), it may not exist in the current gateway's agents list yet.
      // Re-provision it first so ensureManagedAgentRuntimeConfig has something to patch.
      const snapshot = await client.getConfigSnapshot().catch(() => null);
      const config = snapshot?.config;
      const agentsConfig =
        config?.agents && typeof config.agents === "object" && !Array.isArray(config.agents)
          ? (config.agents as { list?: unknown })
          : null;
      const agentsList = Array.isArray(agentsConfig?.list) ? agentsConfig.list : [];
      const agentExistsInGateway = agentsList.some(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          !Array.isArray(candidate) &&
          (candidate as { id?: unknown }).id === agent.openclaw_agent_id,
      );

      if (!agentExistsInGateway) {
        await client.provisionAgent({
          agentId: agent.openclaw_agent_id,
          workspace,
          model: repairedModel,
          name: agent.name,
        });
      }

      await client.ensureManagedAgentRuntimeConfig({
        agentId: agent.openclaw_agent_id,
        workspace,
        model: repairedModel,
        name: agent.name,
        avatar: normalizeAgentAvatarConfig((agent.config as Record<string, unknown> | null | undefined)?.agentAvatar),
      });

      const injection = await injectAgentContext(
        {
          id: agent.id,
          org_id: agent.org_id,
          user_id: agent.user_id ?? null,
          openclaw_agent_id: agent.openclaw_agent_id,
          name: agent.name,
          model: repairedModel,
          config: agent.config as Record<string, unknown> | null | undefined,
          assignment: agent.assignment ?? null,
        },
        {
          client,
          org: {
            name: options?.org.name,
            website: options?.org.website,
            companySummary: options?.org.company_summary,
            agentBrief: options?.org.agent_brief,
          },
          profile: options?.profile ?? null,
          syncKnowledge: true,
          applySafeMemoryConfig: true,
          writeHeartbeat: true,
        },
      );
      if (injection.status === "failed") {
        return { ok: false, model: repairedModel, error: injection.message };
      }

      if (repairedModel !== agent.model) {
        const admin = createAdminClient();
        await admin?.from("agents").update({ model: repairedModel }).eq("id", agent.id).eq("org_id", orgId);
      }
    } else {
      await client.ensureManagedBootstrapDisabled();
    }
    return { ok: true, model: repairedModel ?? null };
  } catch (error) {
    return {
      ok: false,
      model: null,
      error: error instanceof Error ? error.message : "Runtime repair failed.",
    };
  }
}

async function getWorkspaceSurface(
  orgId: string,
  preferredSession?: string,
  whatsappAccountId?: string,
) {
  if (!isOpenClawConfigured()) {
    return { configured: false, healthy: false } as const;
  }

  const target = await resolveTenantGatewayTarget(orgId);
  if (!target) {
    return { configured: false, healthy: false } as const;
  }

  try {
    const response = await fetch(`${target.httpUrl}/healthz`, {
      headers: target.token ? { authorization: `Bearer ${target.token}` } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`Gateway health check failed (${response.status})`);
    }

    return {
      configured: true,
      healthy: true,
      embeddedConsoleUrl: buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: preferredSession,
        whatsappAccountId,
      }),
      gatewayUrl: target.wsUrl,
    } as const;
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      embeddedConsoleUrl: buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: preferredSession,
        whatsappAccountId,
      }),
      gatewayUrl: target.wsUrl,
      error: error instanceof Error ? error.message : "Gateway unreachable",
    } as const;
  }
}

export default async function WorkspacePage() {
  const session = await getCurrentOrg();
  if (!session) {
    const supabase = await createClient();
    const { data: authData } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!authData?.user) {
      redirect("/login");
    }
    return <WorkspaceBootstrapPending />;
  }

  const profile = await getCurrentUserProfile();
  const initialProfile = {
    displayName: profile?.displayName ?? "",
    whatIDo: profile?.whatIDo ?? "",
    agentBrief: profile?.agentBrief ?? "",
  };
  const requiresUserProfileOnboarding = profileNeedsOnboarding(profile);
  const requiresOrgCompanyOnboarding = orgNeedsCompanyContextOnboarding(session);
  const onboardingSequence = resolveWorkspaceOnboardingSequence(session, requiresUserProfileOnboarding);

  let preferredAgent = await getPreferredAgentForSession(session);
  if (!preferredAgent) {
    await autoBootstrapIfMissing(session.capabilities.canManageAgents);
    preferredAgent = await getPreferredAgentForSession(session);
  }
  const hasProvisionedAgent = Boolean(preferredAgent);
  const preferredSession = preferredAgent ? buildAgentSessionKey(preferredAgent.openclaw_agent_id, "main") : undefined;
  const whatsappAccountId = preferredAgent?.openclaw_agent_id;
  const trialMessageCount = await getTrialMessageUsageCount(session.org.id);
  const trialActive = isTrialModelRestrictionActive({
    trialStatus: session.org.trial_status,
    trialEndsAt: session.org.trial_ends_at,
    isSuperAdmin: session.isSuperAdmin,
  });
  const trialHasCapacity = hasTrialMessageCapacity(trialMessageCount, {
    trialStatus: session.org.trial_status,
    trialEndsAt: session.org.trial_ends_at,
    isSuperAdmin: session.isSuperAdmin,
  });

  let surface:
    | Awaited<ReturnType<typeof getWorkspaceSurface>>
    | { readonly configured: false; readonly healthy: false } = {
      configured: false,
      healthy: false,
    };
  let runtimeRepairError: string | undefined;

  if (hasProvisionedAgent) {
    if (trialHasCapacity) {
      const repair = await repairManagedRuntimeConfig(session.org.id, preferredAgent, {
        trialActive,
        org: session.org,
        profile,
      });
      if (preferredAgent && repair.model && repair.model !== preferredAgent.model) {
        preferredAgent = { ...preferredAgent, model: repair.model };
      }
      if (repair.ok) {
        surface = await getWorkspaceSurface(session.org.id, preferredSession, whatsappAccountId);
      } else {
        runtimeRepairError = repair.error;
      }
    } else {
      const repair = await repairManagedRuntimeConfig(session.org.id, preferredAgent, {
        trialActive,
        org: session.org,
        profile,
      });
      if (preferredAgent && repair.model && repair.model !== preferredAgent.model) {
        preferredAgent = { ...preferredAgent, model: repair.model };
      }
    }
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
    // Best-effort runtime pressure sample. Surfaces gateway CPU/event-loop
    // pressure into observability so we can see when shared runtimes start
    // queueing customer chat turns.
    void recordRuntimePressureSample(session.org.id);
  }
  const embeddedConsoleUrl =
    "embeddedConsoleUrl" in surface && surface.embeddedConsoleUrl
      ? surface.embeddedConsoleUrl
      : undefined;
  const gatewayUrl = "gatewayUrl" in surface ? surface.gatewayUrl : undefined;
  const error = trialHasCapacity
    ? runtimeRepairError ?? ("error" in surface ? surface.error : undefined)
    : getTrialMessageLimitMessage();

  return (
    <WorkspaceShell
      embeddedConsoleUrl={embeddedConsoleUrl}
      gatewayUrl={gatewayUrl}
      sessionKey={preferredSession}
      error={error}
      requiresOnboarding={requiresUserProfileOnboarding}
      requiresOrgCompanyOnboarding={requiresOrgCompanyOnboarding}
      onboardingSequence={onboardingSequence}
      initialOrgContext={{
        website: session.org.website ?? "",
        companySummary: session.org.company_summary ?? "",
        agentBrief: session.org.agent_brief ?? "",
      }}
      hasProvisionedAgent={hasProvisionedAgent}
      canProvisionAgent={session.capabilities.canManageAgents}
      canManageAgents={session.capabilities.canManageAgents}
      agentName={preferredAgent?.name}
      orgName={session.org.name}
      trialActive={trialActive}
      trialMessageCount={trialMessageCount}
      trialMessageLimit={TRIAL_MESSAGE_LIMIT}
      initialProfile={initialProfile}
    />
  );
}
