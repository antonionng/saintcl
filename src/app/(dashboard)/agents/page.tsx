import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

import { AgentDeleteButton } from "@/components/dashboard/agent-delete-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getVisibleAgentsForSession } from "@/lib/dal";
import { titleCase } from "@/lib/utils";

export default async function AgentsPage() {
  const session = await getCurrentOrg();
  const agents = session ? await getVisibleAgentsForSession(session) : [];

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Agents"
        title="Agent fleet"
        description="Provision, configure, and monitor every dedicated OpenClaw-backed agent from a single interface."
        action={
          <Button asChild>
            <Link href="/agents/new">New agent</Link>
          </Button>
        }
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents provisioned"
          description="Create your first agent to get started. Each agent gets a dedicated OpenClaw identity, model binding, and workspace."
          action={
            <Button asChild>
              <Link href="/agents/new">Provision your first agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-2 shadow-[var(--shadow-card)]">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)_180px_120px_140px] gap-phi-5 border-b border-border-subtle px-phi-5 py-phi-3 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500">
              <span>Agent</span>
              <span>Assignment</span>
              <span>Model</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {agents.map((agent) => {
              const config = (agent.config ?? {}) as Record<string, unknown>;
              const assignmentLabel =
                typeof config.assignee === "string" && config.assignee.trim().length > 0
                  ? config.assignee
                  : agent.assignment?.assignee_ref;
              return (
                <div
                  key={agent.id}
                  className="grid grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)_180px_120px_140px] items-center gap-phi-5 border-t border-border-subtle px-phi-5 py-phi-5 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="text-[length:var(--text-sm)] font-medium text-white">{agent.name}</p>
                    {config.persona ? (
                      <p className="mt-phi-1 truncate text-[length:var(--text-sm)] text-zinc-400">{String(config.persona)}</p>
                    ) : (
                      <p className="mt-phi-1 text-[length:var(--text-sm)] text-zinc-500">No persona configured</p>
                    )}
                  </div>
                  <div className="min-w-0 text-[length:var(--text-sm)] text-zinc-300">
                    {agent.assignment
                      ? `${titleCase(agent.assignment.assignee_type)} · ${assignmentLabel}`
                      : "Unassigned"}
                  </div>
                  <div className="min-w-0 text-[length:var(--text-sm)] text-zinc-300">{agent.model}</div>
                  <div>
                    <Badge variant={agent.status === "online" ? "success" : "default"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-phi-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/agents/${agent.id}`}>
                        Open
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    {session?.capabilities.canManageAgents ? (
                      <AgentDeleteButton agentId={agent.id} agentName={agent.name} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
