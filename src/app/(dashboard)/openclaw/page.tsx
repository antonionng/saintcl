import { AccessDenied } from "@/components/dashboard/access-denied";
import { AdminConsoleFrame } from "@/components/openclaw/admin-console-frame";
import { getCurrentOrg, getPreferredAgentForSession } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import {
  buildGatewayConsoleProxyPath,
  resolveTenantGatewayTarget,
} from "@/lib/openclaw/tenant-gateway";

async function getOpenClawStatus() {
  const session = await getCurrentOrg();
  if (!session) {
    return { configured: false, healthy: false } as const;
  }

  if (!isOpenClawConfigured()) {
    return { configured: false, healthy: false } as const;
  }

  const target = await resolveTenantGatewayTarget(session.org.id);
  if (!target) {
    return { configured: false, healthy: false } as const;
  }

  const preferredAgent = await getPreferredAgentForSession(session);
  const preferredSession = preferredAgent ? `agent:${preferredAgent.openclaw_agent_id}:main` : undefined;

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
      gatewayUrl: target.wsUrl,
      embeddedConsoleUrl: buildGatewayConsoleProxyPath(target, { session: preferredSession }),
      source: target.source,
      preferredAgentName: preferredAgent?.name ?? null,
    } as const;
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      gatewayUrl: target.wsUrl,
      embeddedConsoleUrl: buildGatewayConsoleProxyPath(target, { session: preferredSession }),
      source: target.source,
      preferredAgentName: preferredAgent?.name ?? null,
      error: error instanceof Error ? error.message : "Gateway unreachable",
    } as const;
  }
}

export default async function OpenClawPage() {
  const session = await getCurrentOrg();
  if (!session?.capabilities.canManageConsole) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="app-kicker">Saint AGI</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Runtime console</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            Advanced runtime controls stay reserved for admins and the platform owner.
          </p>
        </div>
        <AccessDenied description="Employees work from the provisioned workspace while admins operate the low-level runtime console." />
      </div>
    );
  }

  await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);

  const status = await getOpenClawStatus();
  const embeddedConsoleUrl =
    "embeddedConsoleUrl" in status && status.embeddedConsoleUrl
      ? status.embeddedConsoleUrl
      : "/api/openclaw/launch";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-xl rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/55">Admin runtime console</p>
        <p className="mt-1 text-sm font-semibold text-white">
          Platform-owner controls for the Saint AGI runtime, gateway health, sessions, and configuration.
        </p>
      </div>
      {"error" in status && status.error ? (
        <p className="absolute bottom-4 left-4 z-20 rounded-2xl border border-amber-400/30 bg-black/70 px-4 py-3 text-sm text-amber-200 backdrop-blur">
          {status.error}. You can still try the embedded workspace while the gateway reconnects.
        </p>
      ) : null}
      <div id="console" className="min-h-screen overflow-hidden">
        <AdminConsoleFrame embeddedConsoleUrl={embeddedConsoleUrl} />
      </div>
    </div>
  );
}

