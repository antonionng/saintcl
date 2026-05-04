import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { AccessDenied } from "@/components/dashboard/access-denied";
import { AgentAppsCard } from "@/components/dashboard/agent-apps-card";
import { AgentAvatar } from "@/components/dashboard/agent-avatar";
import { AgentAvatarEditor } from "@/components/dashboard/agent-avatar-editor";
import { AgentCloneButton } from "@/components/dashboard/agent-clone-button";
import { AgentDeleteButton } from "@/components/dashboard/agent-delete-button";
import { AgentModelControls } from "@/components/dashboard/agent-model-controls";
import { AgentPersonaEditor } from "@/components/dashboard/agent-persona-editor";
import { AgentTerminalPanel } from "@/components/dashboard/agent-terminal-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { getSignedAgentAvatarUrl } from "@/lib/agent-avatar-storage";
import { getAgentDisplayStatus, getAgentStatusLabel } from "@/lib/agent-status";
import { listAgentApps } from "@/lib/apps/store";
import { CATALOG } from "@/lib/apps/catalog";
import { getAgent, getCurrentOrg, getSessionModelOverrides, getVisibleAgentForSession } from "@/lib/dal";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { titleCase } from "@/lib/utils";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentOrg();

  if (!session?.org.id) notFound();

  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    const existingAgent = await getAgent(id, session.org.id);
    if (!existingAgent) notFound();
    return (
      <AccessDenied
        title="Agent access required"
        description="This agent exists in your workspace, but it is not assigned to you or one of your teams."
      />
    );
  }
  const [{ snapshot }, sessionOverrides, agentAppRows] = await Promise.all([
    getOrgModelCatalogState(session.org.id, {
      trialStatus: session.org.trial_status,
      trialEndsAt: session.org.trial_ends_at,
      isSuperAdmin: session.isSuperAdmin,
    }),
    getSessionModelOverrides(session.org.id, agent.id, 8),
    listAgentApps(session.org.id, agent.id),
  ]);

  const agentAppBindings = agentAppRows.map((row) => {
    const app = CATALOG.find((entry) => entry.id === row.app_id);
    return {
      id: row.id,
      appId: row.app_id,
      name: app?.name ?? row.app_id,
      description: app?.oneLiner ?? null,
      status: row.status,
    };
  });

  const config = (agent.config ?? {}) as Record<string, unknown>;
  const avatarConfig = normalizeAgentAvatarConfig(config.agentAvatar);
  const avatarImageUrl = await getSignedAgentAvatarUrl(avatarConfig.imagePath);
  const displayStatus = getAgentDisplayStatus(agent);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AgentAvatar
            agentId={agent.openclaw_agent_id}
            name={agent.name}
            initials={avatarConfig.initials}
            theme={avatarConfig.theme}
            imageUrl={avatarImageUrl}
            className="size-12"
          />
          <PageHeader
            eyebrow="Agent"
            title={agent.name}
            description="Adjust the model, instructions, and tools your agent has access to."
            className="pb-0"
          />
        </div>
        <div className="shrink-0">
          <div className="flex flex-wrap items-center gap-2 [&_button]:h-8 [&_a]:h-8">
            <Badge
              variant={displayStatus === "online" ? "success" : "default"}
              className="h-8 px-3 text-[length:var(--text-sm)]"
            >
              {getAgentStatusLabel(agent)}
            </Badge>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/agents/${agent.id}/chat`}>
                <MessageSquare className="size-4" />
                <span>Chat</span>
              </Link>
            </Button>
            {session.capabilities.canManageAgents ? (
              <AgentCloneButton agentId={agent.id} />
            ) : null}
            {session.capabilities.canManageAgents ? (
              <AgentDeleteButton agentId={agent.id} agentName={agent.name} redirectTo="/agents" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Model controls</h2>
          </div>
          <div className="space-y-4">
            <AgentModelControls
              agentId={agent.id}
              openclawAgentId={agent.openclaw_agent_id}
              currentModel={agent.model}
              approvedModels={snapshot.approvedModels}
              canManageAgents={session.capabilities.canManageAgents}
              isSuperAdmin={session.isSuperAdmin}
              allowAgentOverride={snapshot.guardrails.allowAgentOverride}
              allowSessionOverride={snapshot.guardrails.allowSessionOverride}
              sessionOverrides={sessionOverrides}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Details</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-zinc-400">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Created</p>
              <p className="mt-2 text-white">
                {new Date(agent.created_at).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Assigned to</p>
              <p className="mt-2 text-white">
                {agent.assignment
                  ? `${titleCase(agent.assignment.assignee_type)} · ${agent.assignment.assignee_ref}`
                  : "Unassigned"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Avatar</p>
              <div className="mt-3">
                <AgentAvatarEditor
                  agentId={agent.id}
                  openclawAgentId={agent.openclaw_agent_id}
                  name={agent.name}
                  initialInitials={avatarConfig.initials}
                  initialTheme={avatarConfig.theme}
                  initialImageUrl={avatarImageUrl}
                  canEdit={session.capabilities.canManageAgents}
                />
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Persona</p>
              <AgentPersonaEditor
                agentId={agent.id}
                initialPersona={config.persona ? String(config.persona) : ""}
                canEdit={session.capabilities.canManageAgents}
              />
            </div>
            <details className="group rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500 hover:text-zinc-300">
                Technical details
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="app-kicker">Agent ID</p>
                  <p className="mt-1 font-mono text-xs text-white">{agent.id}</p>
                </div>
                <div>
                  <p className="app-kicker">Organization ID</p>
                  <p className="mt-1 font-mono text-xs text-white">{agent.org_id}</p>
                </div>
                {config.workspace ? (
                  <div>
                    <p className="app-kicker">Workspace</p>
                    <Input defaultValue={String(config.workspace)} readOnly />
                  </div>
                ) : null}
              </div>
            </details>
          </div>
        </section>
      </div>

      <AgentAppsCard agentId={agent.id} bindings={agentAppBindings} />

      {session.capabilities.canManageAdminTools ? (
        <AgentTerminalPanel agentId={agent.id} />
      ) : null}
    </div>
  );
}
