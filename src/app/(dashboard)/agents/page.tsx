import Link from "next/link";
import { Bot } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="grid gap-5 xl:grid-cols-2">
          {agents.map((agent) => {
            const config = (agent.config ?? {}) as Record<string, unknown>;
            return (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{agent.name}</CardTitle>
                      {config.persona ? (
                        <p className="mt-2 text-sm text-zinc-400">{String(config.persona)}</p>
                      ) : null}
                    </div>
                    <Badge variant={agent.status === "online" ? "success" : "default"}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400 sm:grid-cols-2">
                    <div>
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Model</p>
                      <p className="mt-2 text-white">{agent.model}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Agent ID</p>
                      <p className="mt-2 text-white">{agent.openclaw_agent_id}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Assigned to</p>
                      <p className="mt-2 text-white">
                        {agent.assignment
                          ? `${titleCase(agent.assignment.assignee_type)} · ${agent.assignment.assignee_ref}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Status</p>
                      <p className="mt-2 text-white">{agent.status}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.18em] text-zinc-500">Created</p>
                      <p className="mt-2 text-white">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild variant="secondary">
                      <Link href={`/agents/${agent.id}`}>Open config</Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href={`/agents/${agent.id}/logs`}>View logs</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
