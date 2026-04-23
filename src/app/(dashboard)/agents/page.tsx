import Link from "next/link";
import { Bot, MessageSquare, Plus } from "lucide-react";

import { AgentCloneButton } from "@/components/dashboard/agent-clone-button";
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
        title="Agents"
        description="Create, configure, and chat with every agent in your workspace."
        action={
          <Button asChild size="default">
            <Link href="/agents/new">
              <Plus className="h-4 w-4" />
              <span>New agent</span>
            </Link>
          </Button>
        }
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first agent. Pick a role like Support, Sales, or Engineering and chat in seconds."
          action={
            <Button asChild>
              <Link href="/agents/new">Create your first agent</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile list */}
          <div className="md:hidden border border-border rounded-md overflow-hidden">
            {agents.map((agent) => {
              const config = (agent.config ?? {}) as Record<string, unknown>;
              const assignmentLabel =
                typeof config.assignee === "string" && config.assignee.trim().length > 0
                  ? config.assignee
                  : agent.assignment?.assignee_ref;
              return (
                <div
                  key={agent.id}
                  className="border-b border-border-subtle px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[length:var(--text-sm)] font-medium text-white">
                        {agent.name}
                      </p>
                      <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-white/45">
                        {agent.assignment
                          ? `${titleCase(agent.assignment.assignee_type)} · ${assignmentLabel}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <Badge variant={agent.status === "online" ? "success" : "default"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Button asChild size="sm">
                      <Link href={`/agents/${agent.id}/chat`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/agents/${agent.id}`}>Settings</Link>
                    </Button>
                    {session?.capabilities.canManageAgents ? (
                      <AgentCloneButton agentId={agent.id} />
                    ) : null}
                    {session?.capabilities.canManageAgents ? (
                      <AgentDeleteButton agentId={agent.id} agentName={agent.name} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border border-border rounded-md overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_minmax(0,260px)] gap-3 border-b border-border-subtle px-4 py-2 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-white/45">
              <span>Agent</span>
              <span>Assigned to</span>
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
                  className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_minmax(0,260px)] items-center gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">
                      {agent.name}
                    </p>
                    {config.persona ? (
                      <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-white/45">
                        {String(config.persona)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[length:var(--text-xs)] text-white/30">
                        No instructions yet
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 text-[length:var(--text-sm)] text-white/70 truncate">
                    {agent.assignment
                      ? `${titleCase(agent.assignment.assignee_type)} · ${assignmentLabel}`
                      : "Unassigned"}
                  </div>
                  <div>
                    <Badge variant={agent.status === "online" ? "success" : "default"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button asChild size="sm">
                      <Link href={`/agents/${agent.id}/chat`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/agents/${agent.id}`}>Settings</Link>
                    </Button>
                    {session?.capabilities.canManageAgents ? (
                      <AgentCloneButton agentId={agent.id} />
                    ) : null}
                    {session?.capabilities.canManageAgents ? (
                      <AgentDeleteButton agentId={agent.id} agentName={agent.name} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
