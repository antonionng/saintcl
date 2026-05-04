import Link from "next/link";
import { Bot, MessageSquare, Plus } from "lucide-react";

import { AgentCloneButton } from "@/components/dashboard/agent-clone-button";
import { AgentDeleteButton } from "@/components/dashboard/agent-delete-button";
import { AgentAvatar } from "@/components/dashboard/agent-avatar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { getSignedAgentAvatarUrl } from "@/lib/agent-avatar-storage";
import { getAgentDisplayStatus, getAgentStatusLabel } from "@/lib/agent-status";
import { getCurrentOrg, getVisibleAgentsForSession } from "@/lib/dal";
import { titleCase } from "@/lib/utils";

export default async function AgentsPage() {
  const session = await getCurrentOrg();
  const agents = session ? await getVisibleAgentsForSession(session) : [];
  const agentAvatarUrls = new Map(
    await Promise.all(
      agents.map(async (agent) => {
        const config = (agent.config ?? {}) as Record<string, unknown>;
        const avatarConfig = normalizeAgentAvatarConfig(config.agentAvatar);
        return [agent.id, await getSignedAgentAvatarUrl(avatarConfig.imagePath)] as const;
      }),
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agents"
        description="Provision billable agents, manage assignments, and test the workflows your company will roll out. Chat conversations stay attached to the selected agent."
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
          description="Create your first business agent from a recipe like Meeting, Support, Sales, IT Helpdesk, or Ops."
          action={
            <Button asChild>
              <Link href="/agents/new">Create your first agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="settings-panel overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-[length:var(--text-sm)] font-medium text-white">
              Active agents
            </p>
            <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
              Each row is a provisioned agent. Create more here when your plan and billing setup allow it.
            </p>
          </div>
          <div className="divide-y divide-border-subtle">
            {agents.map((agent) => {
              const config = (agent.config ?? {}) as Record<string, unknown>;
              const assignmentLabel =
                typeof config.assignee === "string" && config.assignee.trim().length > 0
                  ? config.assignee
                  : agent.assignment?.assignee_ref;
              const persona = config.persona ? String(config.persona) : "No instructions yet";
              const avatarConfig = normalizeAgentAvatarConfig(config.agentAvatar);
              const displayStatus = getAgentDisplayStatus(agent);

              return (
                <article
                  key={agent.id}
                  className="grid gap-4 px-4 py-4 transition-colors hover:bg-white/[0.02] lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <AgentAvatar
                      agentId={agent.openclaw_agent_id ?? agent.id}
                      name={agent.name}
                      initials={avatarConfig.initials}
                      theme={avatarConfig.theme}
                      imageUrl={agentAvatarUrls.get(agent.id)}
                      className="size-11"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[length:var(--text-sm)] font-medium text-white">
                          {agent.name}
                        </h2>
                        <Badge
                          variant={displayStatus === "online" ? "success" : "default"}
                          className="h-8 px-3 text-[length:var(--text-sm)]"
                        >
                          {getAgentStatusLabel(agent)}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[length:var(--text-xs)] leading-5 text-white/45">
                        {persona}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 lg:border-l lg:border-border-subtle lg:pl-4">
                    <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/40">
                      Assigned to
                    </p>
                    <p className="mt-1 truncate text-[length:var(--text-sm)] text-white/70">
                      {agent.assignment
                        ? `${titleCase(agent.assignment.assignee_type)} · ${assignmentLabel}`
                        : "Unassigned"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end [&_button]:h-8 [&_a]:h-8">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/agents/${agent.id}/chat`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/agents/${agent.id}`}>Settings</Link>
                    </Button>
                    {session?.capabilities.canManageAgents ? (
                      <AgentCloneButton agentId={agent.id} />
                    ) : null}
                    {session?.capabilities.canManageAgents ? (
                      <AgentDeleteButton agentId={agent.id} agentName={agent.name} />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
