import Link from "next/link";
import { ExternalLink, Gauge, ShieldCheck } from "lucide-react";

import { AccessDenied } from "@/components/dashboard/access-denied";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { OpenClawClient } from "@/lib/openclaw/client";
import { buildGatewayConsoleUrl, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

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

  try {
    const client = new OpenClawClient({
      gatewayUrl: target.wsUrl,
      gatewayToken: target.token,
    });
    await client.health();
    return {
      configured: true,
      healthy: true,
      gatewayUrl: target.wsUrl,
      consoleUrl: buildGatewayConsoleUrl(target),
      source: target.source,
    } as const;
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      gatewayUrl: target.wsUrl,
      consoleUrl: buildGatewayConsoleUrl(target),
      source: target.source,
      error: error instanceof Error ? error.message : "Gateway unreachable",
    } as const;
  }
}

export default async function OpenClawPage() {
  const session = await getCurrentOrg();
  if (!session?.capabilities.canManageConsole) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="OpenClaw"
          title="Console"
          description="Advanced runtime controls are limited to admins."
        />
        <AccessDenied description="Employees can work through SaintClaw surfaces while admins operate the low-level console." />
      </div>
    );
  }

  const status = await getOpenClawStatus();
  const consoleUrl = "consoleUrl" in status && status.consoleUrl ? status.consoleUrl : "/api/openclaw/launch";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="OpenClaw"
        title="Console"
        description="Your tenant runtime console: health, agent control, and low-level gateway operations."
        action={
          <Button asChild>
            <Link href={consoleUrl} target="_blank" rel="noreferrer">
              Open console
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gateway status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <Gauge className="size-4 text-white" />
              <span>Configured</span>
              <Badge variant={status.configured ? "success" : "warning"}>
                {status.configured ? "yes" : "no"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-white" />
              <span>Healthy</span>
              <Badge variant={status.healthy ? "success" : "warning"}>
                {status.healthy ? "online" : "offline"}
              </Badge>
            </div>
            <p className="text-zinc-500">Gateway URL: {status.gatewayUrl ?? "Not configured"}</p>
            {"source" in status && status.source ? (
              <p className="text-zinc-500">Routing source: {status.source}</p>
            ) : null}
            {"error" in status && status.error ? (
              <p className="text-red-400">{status.error}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How this feels like VMs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-zinc-400">
            <p>Each organization gets isolated runtime state and workspace roots.</p>
            <p>New users auto-bootstrap a personal agent on first dashboard visit.</p>
            <p>Admins keep mission and guardrails; employees steer goals and behavior.</p>
            <p>SaintClaw handles the control plane while advanced runtime controls can open in a dedicated admin console.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launch real-time console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            The OpenClaw control surface uses strict browser security headers and WebSocket upgrades.
            Launching it as a full page keeps real-time controls and telemetry fully functional.
          </p>
          <Button asChild>
            <Link href={consoleUrl} target="_blank" rel="noreferrer">
              Launch OpenClaw Console
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

