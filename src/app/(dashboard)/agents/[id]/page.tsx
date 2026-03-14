import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
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

  const config = (agent.config ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Agent config"
        title={agent.name}
        description="Adjust the agent model, instructions, and allowed tools before SaintClaw writes changes back through the OpenClaw gateway API."
        action={
          <Badge variant={agent.status === "online" ? "success" : "default"}>
            {agent.status}
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Core configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">OpenClaw agent ID</label>
              <Input defaultValue={agent.openclaw_agent_id} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Model</label>
              <Input defaultValue={agent.model} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Persona</label>
              <Textarea
                defaultValue={config.persona ? String(config.persona) : ""}
                readOnly
              />
            </div>
            {config.workspace ? (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Workspace</label>
                <Input defaultValue={String(config.workspace)} readOnly />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-7 text-zinc-400">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="uppercase tracking-[0.18em] text-zinc-500">Agent ID</p>
              <p className="mt-2 font-mono text-xs text-white">{agent.id}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="uppercase tracking-[0.18em] text-zinc-500">Organization</p>
              <p className="mt-2 font-mono text-xs text-white">{agent.org_id}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="uppercase tracking-[0.18em] text-zinc-500">Created</p>
              <p className="mt-2 text-white">
                {new Date(agent.created_at).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="uppercase tracking-[0.18em] text-zinc-500">Assignment</p>
              <p className="mt-2 text-white">
                {agent.assignment
                  ? `${titleCase(agent.assignment.assignee_type)} · ${agent.assignment.assignee_ref}`
                  : "Unassigned"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
