import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getCurrentOrg, getCurrentUserProfile, getPreferredAgentForSession } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

function profileNeedsOnboarding(profile: {
  displayName?: string | null;
  whatIDo?: string | null;
  agentBrief?: string | null;
} | null) {
  return [profile?.displayName, profile?.whatIDo, profile?.agentBrief].some(
    (value) => typeof value !== "string" || value.trim().length === 0,
  );
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
  const preferredAgent = await getPreferredAgentForSession(session);
  const hasProvisionedAgent = Boolean(preferredAgent);
  const preferredSession = preferredAgent ? `agent:${preferredAgent.openclaw_agent_id}:main` : undefined;

  if (hasProvisionedAgent) {
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
  }

  const surface = hasProvisionedAgent
    ? await getWorkspaceSurface(session.org.id, preferredSession)
    : ({ configured: false, healthy: false } as const);
  const embeddedConsoleUrl =
    "embeddedConsoleUrl" in surface && surface.embeddedConsoleUrl
      ? surface.embeddedConsoleUrl
      : undefined;
  const gatewayUrl = "gatewayUrl" in surface ? surface.gatewayUrl : undefined;
  const error = "error" in surface ? surface.error : undefined;

  return (
    <WorkspaceShell
      embeddedConsoleUrl={embeddedConsoleUrl}
      gatewayUrl={gatewayUrl}
      error={error}
      requiresOnboarding={requiresOnboarding}
      hasProvisionedAgent={hasProvisionedAgent}
      initialProfile={initialProfile}
    />
  );
}
