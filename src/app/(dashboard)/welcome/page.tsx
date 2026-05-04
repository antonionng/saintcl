import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  MessageSquare,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { TestChatEmbed } from "@/components/dashboard/test-chat-embed";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/access";
import { getAgents, getCurrentOrg, getPreferredAgentForSession, getTrialMessageUsageCount } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";
import { hasTrialMessageCapacity } from "@/lib/plans";

async function autoBootstrapIfMissing(orgId: string) {
  const existing = await getAgents(orgId).catch(() => []);
  if (existing.length > 0 || !isOpenClawConfigured()) return;

  // Best-effort: call our own bootstrap route via fetch from the server.
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  if (!base) return;
  try {
    const cookieHeader = (await cookies())
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
    await fetch(`${base}/api/openclaw/bootstrap`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
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
  const agents = await getAgents(session.org.id).catch(() => []);
  const preferred = await getPreferredAgentForSession(session);
  const trialMessageCount = await getTrialMessageUsageCount(session.org.id);
  const trialHasCapacity = hasTrialMessageCapacity(trialMessageCount, {
    trialStatus: session.org.trial_status,
    trialEndsAt: session.org.trial_ends_at,
    isSuperAdmin: session.isSuperAdmin,
  });

  let embeddedConsoleUrl: string | undefined;
  let gatewayUrl: string | undefined;
  if (preferred && trialHasCapacity) {
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
  const runtimeReady = Boolean(gatewayUrl);
  const hasAgent = Boolean(preferred);

  return (
    <div className="space-y-8">
      <section className="settings-panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="space-y-3">
            <p className="app-kicker">Command center</p>
            <h1 className="max-w-3xl text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-white sm:text-[length:var(--text-3xl)]">
              Hi {firstName}, your workspace is ready to run.
            </h1>
            <p className="max-w-2xl text-[length:var(--text-sm)] leading-6 text-zinc-400">
              Test the assigned agent, confirm the runtime is healthy, then connect Slack or Telegram when the first
              workflow is proven.
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-black/10 p-4">
            <p className="app-kicker">Next step</p>
            <h2 className="mt-2 text-base font-medium text-white">
              {hasAgent ? `Test ${agentName}` : "Create the first agent"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {hasAgent
                ? "Start in chat, then expand connectors and policies from the admin area."
                : "Provision one recipe-backed agent before inviting teammates."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link href="/workspace">Open chat</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/agents/new">New agent</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={Bot}
          label="First agent"
          value={hasAgent ? "Ready" : "Missing"}
          description={hasAgent ? agentName : "Create one agent to unlock chat."}
          state={hasAgent ? "ready" : "attention"}
        />
        <StatusCard
          icon={MessageSquare}
          label="Workspace chat"
          value={hasAgent ? "Assigned" : "Waiting"}
          description={hasAgent ? "The preferred agent is seeded." : "Chat opens after provisioning."}
          state={hasAgent ? "ready" : "attention"}
        />
        <StatusCard
          icon={ServerCog}
          label="Runtime"
          value={runtimeReady ? "Online" : "Check setup"}
          description={runtimeReady ? "Gateway target is reachable." : "Runtime gateway needs attention."}
          state={runtimeReady ? "ready" : "attention"}
        />
        <StatusCard
          icon={ShieldCheck}
          label="Admin control"
          value="Managed"
          description="Policy and runtime controls stay admin-only."
          state="ready"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_340px] xl:items-start">
        <div className="min-h-[520px]">
          <TestChatEmbed
            embeddedConsoleUrl={embeddedConsoleUrl}
            gatewayUrl={gatewayUrl}
            title={`Test ${agentName}`}
            className="h-full"
          />
        </div>

        <div className="space-y-3">
          <CommandCenterCard
            icon={ClipboardCheck}
            title="Rollout checklist"
            description="Keep the path short. Prove the first workflow before expanding."
            items={[
              hasAgent ? "First agent is ready." : "Create the first agent.",
              runtimeReady ? "Runtime is reachable." : "Check runtime configuration.",
              "Test the workflow in chat.",
              "Connect Slack or Telegram.",
              "Invite teammates once the purpose is clear.",
            ]}
          />
          <CommandCenterCard
            icon={Activity}
            title="Admin shortcuts"
            description="Jump to the controls that matter during rollout."
            items={[
              "Agents: roster, models, personas, and avatars.",
              "Connect: Slack and Telegram setup.",
              "Settings: governance, billing, and members.",
            ]}
            action={
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/agents">Agents</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/apps">Connect</Link>
                </Button>
              </div>
            }
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-1 p-4">
        <div>
          <p className="text-sm font-medium text-white">Ready to expand?</p>
          <p className="mt-1 text-sm text-zinc-400">
            {agents.length} {agents.length === 1 ? "agent" : "agents"} in this workspace. Add recipes only after the
            first flow is working.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/workspace">Open chat</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/agents/new">
              <Bot className="size-4" />
              <span>New agent</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  description,
  state,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  state: "ready" | "attention";
}) {
  const StateIcon = state === "ready" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-phi-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-surface-3 text-white">
          <Icon className="size-4" />
        </div>
        <StateIcon className={`size-4 ${state === "ready" ? "text-emerald-400" : "text-amber-400"}`} />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

function CommandCenterCard({
  icon: Icon,
  title,
  description,
  items,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items: string[];
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-surface-3 text-white">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}
