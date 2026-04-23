import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, MessageSquare, Sparkles, Users } from "lucide-react";

import { TestChatEmbed } from "@/components/dashboard/test-chat-embed";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/access";
import { getAgents, getCurrentOrg, getPreferredAgentForSession } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

async function autoBootstrapIfMissing(orgId: string) {
  const existing = await getAgents(orgId).catch(() => []);
  if (existing.length > 0 || !isOpenClawConfigured()) return;

  // Best-effort: call our own bootstrap route via fetch from the server.
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  if (!base) return;
  try {
    await fetch(`${base}/api/openclaw/bootstrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
    });
  } catch {
    // ignore - the welcome page will still render with a friendly empty state
  }
}

async function getChatSurface(orgId: string) {
  if (!isOpenClawConfigured()) return null;
  const target = await resolveTenantGatewayTarget(orgId);
  if (!target) return null;

  return target;
}

export default async function WelcomePage() {
  const session = await getCurrentOrg();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role, { isSuperAdmin: session.isSuperAdmin })) {
    redirect("/workspace");
  }

  await autoBootstrapIfMissing(session.org.id);
  const preferred = await getPreferredAgentForSession(session);

  let embeddedConsoleUrl: string | undefined;
  let gatewayUrl: string | undefined;
  if (preferred) {
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
    const target = await getChatSurface(session.org.id);
    if (target) {
      embeddedConsoleUrl = buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: `agent:${preferred.openclaw_agent_id}:welcome`,
      });
      gatewayUrl = target.wsUrl;
    }
  }

  const agentName = preferred?.name ?? "Your agent";
  const firstName = (session.email?.split("@")[0] ?? "there").split(/[._-]/)[0];

  return (
    <div className="space-y-phi-13">
      <div className="space-y-phi-3">
        <p className="app-kicker">Welcome</p>
        <h1 className="app-title text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-white sm:text-[length:var(--text-3xl)]">
          Hi {firstName}, {agentName.toLowerCase().includes("agent") ? agentName : `${agentName}`} is ready.
        </h1>
        <p className="app-copy max-w-2xl text-[length:var(--text-base)]">
          Say hi below to get a feel for how it works. Then connect an app or invite your team.
        </p>
      </div>

      <TestChatEmbed
        embeddedConsoleUrl={embeddedConsoleUrl}
        gatewayUrl={gatewayUrl}
        title={`Chat with ${agentName}`}
      />

      <div className="grid gap-phi-5 md:grid-cols-3">
        <ChecklistCard
          icon={MessageSquare}
          title="1. Say hi to your agent"
          description="Type a message above. Try: 'What can you help me with?'"
          done={false}
        />
        <ChecklistCard
          icon={Sparkles}
          title="2. Connect an app"
          description="Add Slack, Telegram, search, or any of the apps in the catalog."
          done={false}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/apps">Browse the app store</Link>
            </Button>
          }
        />
        <ChecklistCard
          icon={Users}
          title="3. Invite your team"
          description="Bring your colleagues so each can have their own agent."
          done={false}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings?tab=members">Invite teammates</Link>
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-phi-3 rounded-lg border border-border-subtle bg-surface-1 p-phi-5">
        <div>
          <p className="text-sm font-medium text-white">Want to create another agent?</p>
          <p className="mt-1 text-sm text-zinc-400">Pick a role like Sales, Support, or Engineering. We&apos;ll set it up in seconds.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/dashboard">Skip to dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/agents/new">
              <Bot className="size-4" />
              <span>New agent</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChecklistCard({
  icon: Icon,
  title,
  description,
  action,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  done?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-1 p-phi-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-8 items-center justify-center rounded-md ${
            done ? "bg-emerald-500/15 text-emerald-400" : "bg-surface-3 text-white"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      <p className="text-sm leading-6 text-zinc-400">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
