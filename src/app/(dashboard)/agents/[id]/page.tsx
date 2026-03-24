import { notFound } from "next/navigation";

import { AgentDeleteButton } from "@/components/dashboard/agent-delete-button";
import { AgentModelControls } from "@/components/dashboard/agent-model-controls";
import { AgentTerminalPanel } from "@/components/dashboard/agent-terminal-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [{ snapshot }, sessionOverrides] = await Promise.all([
    getOrgModelCatalogState(session.org.id),
    getSessionModelOverrides(session.org.id, agent.id, 8),
  ]);

  const config = (agent.config ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Agent config"
        title={agent.name}
        description="Adjust the agent model, instructions, and allowed tools before Saint AGI writes changes back through the OpenClaw gateway API."
        action={
          <div className="flex items-center gap-3">
            <Badge variant={agent.status === "online" ? "success" : "default"}>
              {agent.status}
            </Badge>
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
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Metadata</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-zinc-400">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Agent ID</p>
              <p className="mt-2 font-mono text-xs text-white">{agent.id}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Organization</p>
              <p className="mt-2 font-mono text-xs text-white">{agent.org_id}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Created</p>
              <p className="mt-2 text-white">
                {new Date(agent.created_at).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Assignment</p>
              <p className="mt-2 text-white">
                {agent.assignment
                  ? `${titleCase(agent.assignment.assignee_type)} · ${agent.assignment.assignee_ref}`
                  : "Unassigned"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="app-kicker">Persona</p>
              <Textarea
                defaultValue={config.persona ? String(config.persona) : ""}
                readOnly
              />
            </div>
            {config.workspace ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="app-kicker">Workspace</p>
                <Input defaultValue={String(config.workspace)} readOnly />
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {session.capabilities.canManageAdminTools ? (
        <AgentTerminalPanel agentId={agent.id} />
      ) : null}
    </div>
  );
}
