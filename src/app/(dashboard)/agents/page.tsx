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
    <div className="space-y-8">
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
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02]">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_180px_120px_150px] gap-4 border-b border-white/8 px-5 py-3 text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500">
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
                  className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_180px_120px_150px] items-center gap-4 border-t border-white/6 px-5 py-4 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{agent.name}</p>
                    {config.persona ? (
                      <p className="mt-1 truncate text-sm text-zinc-400">{String(config.persona)}</p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-500">No persona configured</p>
                    )}
                  </div>
                  <div className="min-w-0 text-sm text-zinc-300">
                    {agent.assignment
                      ? `${titleCase(agent.assignment.assignee_type)} · ${assignmentLabel}`
                      : "Unassigned"}
                  </div>
                  <div className="min-w-0 text-sm text-zinc-300">{agent.model}</div>
                  <div>
                    <Badge variant={agent.status === "online" ? "success" : "default"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
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
