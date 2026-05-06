import { cookies, headers } from "next/headers";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getCurrentOrg, getCurrentUserProfile, getPreferredAgentForSession, getTrialMessageUsageCount } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
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

async function repairManagedRuntimeConfig(
  orgId: string,
  agent?: RuntimeRepairAgent | null,
  options?: { trialActive?: boolean },
) {
  if (!isOpenClawConfigured()) return null;

  try {
    const { client } = await getTenantOpenClawClient(orgId, { orgId });
    const normalizedModel = normalizeTrialFreeModelId(agent?.model);
    const repairedModel =
      options?.trialActive === true &&
      normalizedModel !== TRIAL_DEFAULT_MODEL_ID &&
      normalizedModel !== TRIAL_FALLBACK_FREE_MODEL_ID
        ? TRIAL_DEFAULT_MODEL_ID
        : normalizedModel;
    if (agent && repairedModel && repairedModel !== agent.model) {
      const workspace = resolveAgentWorkspaceFromConfig({
        orgId,
        openClawAgentId: agent.openclaw_agent_id,
        config: agent.config,
      });
      await client.ensureManagedAgentRuntimeConfig({
        agentId: agent.openclaw_agent_id,
        workspace,
        model: repairedModel,
        name: agent.name,
        avatar: normalizeAgentAvatarConfig((agent.config as Record<string, unknown> | null | undefined)?.agentAvatar),
      });

      const admin = createAdminClient();
      await admin?.from("agents").update({ model: repairedModel }).eq("id", agent.id).eq("org_id", orgId);
    }

    await client.ensureManagedBootstrapDisabled();
    return repairedModel ?? null;
  } catch {
    // Chat can still render its gateway error; this repair is best-effort on page load.
    return null;
  }
}

async function getWorkspaceSurface(orgId: string, preferredSession?: string) {
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
      embeddedConsoleUrl: buildGatewayWorkspaceProxyPath(target, { path: "chat", session: preferredSession }),
      gatewayUrl: target.wsUrl,
    } as const;
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      embeddedConsoleUrl: buildGatewayWorkspaceProxyPath(target, { path: "chat", session: preferredSession }),
      gatewayUrl: target.wsUrl,
      error: error instanceof Error ? error.message : "Gateway unreachable",
    } as const;
  }
}

export default async function WorkspacePage() {
  const session = await getCurrentOrg();
  if (!session) {
    return null;
  }

  const profile = await getCurrentUserProfile();
  const initialProfile = {
    displayName: profile?.displayName ?? "",
    whatIDo: profile?.whatIDo ?? "",
    agentBrief: profile?.agentBrief ?? "",
  };
  const requiresOnboarding = profileNeedsOnboarding(profile);
  let preferredAgent = await getPreferredAgentForSession(session);
  if (!preferredAgent) {
    await autoBootstrapIfMissing(session.capabilities.canManageAgents);
    preferredAgent = await getPreferredAgentForSession(session);
  }
  const hasProvisionedAgent = Boolean(preferredAgent);
  const preferredSession = preferredAgent ? buildAgentSessionKey(preferredAgent.openclaw_agent_id, "main") : undefined;
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

  if (hasProvisionedAgent) {
    const repairedModel = await repairManagedRuntimeConfig(session.org.id, preferredAgent, { trialActive });
    if (preferredAgent && repairedModel && repairedModel !== preferredAgent.model) {
      preferredAgent = { ...preferredAgent, model: repairedModel };
    }
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
    // Best-effort runtime pressure sample. Surfaces gateway CPU/event-loop
    // pressure into observability so we can see when shared runtimes start
    // queueing customer chat turns.
    void recordRuntimePressureSample(session.org.id);
  }

  const surface = hasProvisionedAgent && trialHasCapacity
    ? await getWorkspaceSurface(session.org.id, preferredSession)
    : ({ configured: false, healthy: false } as const);
  const embeddedConsoleUrl =
    "embeddedConsoleUrl" in surface && surface.embeddedConsoleUrl
      ? surface.embeddedConsoleUrl
      : undefined;
  const gatewayUrl = "gatewayUrl" in surface ? surface.gatewayUrl : undefined;
  const error = trialHasCapacity ? ("error" in surface ? surface.error : undefined) : getTrialMessageLimitMessage();

  return (
    <WorkspaceShell
      embeddedConsoleUrl={embeddedConsoleUrl}
      gatewayUrl={gatewayUrl}
      sessionKey={preferredSession}
      error={error}
      requiresOnboarding={requiresOnboarding}
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
