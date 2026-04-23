import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { AgentAppsCard } from "@/components/dashboard/agent-apps-card";
import { AgentCloneButton } from "@/components/dashboard/agent-clone-button";
import { AgentDeleteButton } from "@/components/dashboard/agent-delete-button";
import { AgentModelControls } from "@/components/dashboard/agent-model-controls";
import { AgentPersonaEditor } from "@/components/dashboard/agent-persona-editor";
import { AgentTerminalPanel } from "@/components/dashboard/agent-terminal-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAgentApps } from "@/lib/apps/store";
import { CATALOG } from "@/lib/apps/catalog";
import { getCurrentOrg, getSessionModelOverrides, getVisibleAgentForSession } from "@/lib/dal";
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
  if (!agent) notFound();
  const [{ snapshot }, sessionOverrides, agentAppRows] = await Promise.all([
    getOrgModelCatalogState(session.org.id),
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Agent"
        title={agent.name}
        description="Adjust the model, instructions, and tools your agent has access to."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={agent.status === "online" ? "success" : "default"}>
              {agent.status}
            </Badge>
            <Button asChild size="sm">
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
        }
      />

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
