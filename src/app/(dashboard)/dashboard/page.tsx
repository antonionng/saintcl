import Link from "next/link";
import { Activity, ArrowRight, Bot, Cable, Database, Puzzle, TerminalSquare } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentOrg,
  getDashboardStats,
  getRecentSessionActivityEvents,
  getRuntimes,
  getTerminalApprovals,
} from "@/lib/dal";
import type { DashboardStat } from "@/types";

export default async function DashboardPage() {
  const session = await getCurrentOrg();
  const orgId = session?.org.id;

  const [stats, runtimes, approvals, logs] = orgId
    ? await Promise.all([
        getDashboardStats(orgId),
        getRuntimes(orgId),
        getTerminalApprovals(orgId),
        getRecentSessionActivityEvents(orgId, 4),
      ])
    : [{ agents: 0, channels: 0, docs: 0, runtimes: 0 }, [], [], []];

  const dashboardStats: DashboardStat[] = [
    { id: "agents", label: "Agents", value: String(stats.agents), delta: stats.agents === 0 ? "None provisioned" : "Provisioned" },
    { id: "channels", label: "Channels", value: String(stats.channels), delta: stats.channels === 0 ? "None connected" : "Connected" },
    { id: "docs", label: "Knowledge docs", value: String(stats.docs), delta: stats.docs === 0 ? "None uploaded" : "Indexed" },
    { id: "runtimes", label: "Runtimes", value: String(stats.runtimes), delta: stats.runtimes === 0 ? "No gateway" : "Running" },
  ];

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Overview"
        title="Command center"
        description="Track agent health, channel bindings, and the operating footprint of your autonomous workforce."
        action={
          <Button asChild>
            <Link href="/agents/new">Provision agent</Link>
          </Button>
        }
      />

      <StatsGrid stats={dashboardStats} />

      <div className="grid gap-phi-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Runtime health</CardTitle>
          </CardHeader>
          <CardContent>
            {runtimes.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No runtimes"
                description="Provision your first agent to spin up an OpenClaw runtime."
                className="py-phi-8"
              />
            ) : (
              <div className="space-y-phi-3">
                {runtimes.map((runtime) => (
                  <Card key={runtime.id} variant="inset" className="p-phi-5">
                    <div className="flex items-center justify-between gap-phi-3">
                      <div>
                        <p className="text-[length:var(--text-sm)] font-medium text-white">{runtime.org_id.slice(0, 8)}</p>
                        <p className="mt-phi-2 text-[length:var(--text-sm)] text-zinc-400">
                          Port {runtime.gateway_port}
                          {runtime.pid ? ` · PID ${runtime.pid}` : ""}
                        </p>
                      </div>
                      <Badge variant={runtime.status === "online" ? "success" : "warning"}>
                        {runtime.status}
                      </Badge>
                    </div>
                    {runtime.last_heartbeat_at ? (
                      <p className="mt-phi-3 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
                        Last heartbeat {new Date(runtime.last_heartbeat_at).toLocaleString()}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval queue</CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <EmptyState
                icon={TerminalSquare}
                title="No pending approvals"
                description="Terminal commands requiring approval will appear here."
                className="py-phi-8"
              />
            ) : (
              <div className="space-y-phi-3">
                {approvals.map((approval) => (
                  <Card key={approval.id} variant="inset" className="flex items-center justify-between px-phi-5 py-phi-5">
                    <div>
                      <p className="text-[length:var(--text-sm)] font-medium text-white">{approval.command}</p>
                      <p className="text-[length:var(--text-sm)] text-zinc-400">{approval.requested_by ?? "system"}</p>
                    </div>
                    <div className="flex items-center gap-phi-3 text-[length:var(--text-sm)] text-zinc-400">
                      <Activity className="size-4 text-emerald-400" />
                      {approval.status}
                      <ArrowRight className="size-4" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No activity yet"
              description="Agent logs will stream here once you provision an agent and connect a channel."
              action={
                <div className="flex flex-wrap justify-center gap-phi-3">
                  <Button asChild size="sm">
                    <Link href="/agents/new">Provision agent</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/connections">Connect channel</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-phi-3">
              {logs.map((log) => (
                <Card key={log.id} variant="inset" className="p-phi-5">
                  <div className="flex items-center justify-between text-[length:var(--text-sm)] text-zinc-400">
                    <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em]">
                      {log.role ?? "system"} · {log.session_key ?? "-"}
                    </span>
                    <span className="text-[length:var(--text-xs)]">{new Date(log.occurred_at ?? log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-phi-3 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">{log.message}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-phi-5 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/agents/new"
          className="group rounded-lg border border-border-subtle bg-surface-2 p-phi-8 transition-colors hover:border-border hover:bg-surface-3"
        >
          <Bot className="size-5 text-white" />
          <h3 className="mt-phi-5 text-[length:var(--text-lg)] font-medium tracking-[-0.02em] text-white">Provision an agent</h3>
          <p className="mt-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
            Create a dedicated OpenClaw identity mapped to a model, persona, and workspace.
          </p>
        </Link>
        <Link
          href="/channels"
          className="group rounded-lg border border-border-subtle bg-surface-2 p-phi-8 transition-colors hover:border-border hover:bg-surface-3"
        >
          <Cable className="size-5 text-white" />
          <h3 className="mt-phi-5 text-[length:var(--text-lg)] font-medium tracking-[-0.02em] text-white">Connect a channel</h3>
          <p className="mt-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
            Bind Telegram, Slack, or WhatsApp to an agent for inbound message routing.
          </p>
        </Link>
        <Link
          href="/skills"
          className="group rounded-lg border border-border-subtle bg-surface-2 p-phi-8 transition-colors hover:border-border hover:bg-surface-3"
        >
          <Puzzle className="size-5 text-white" />
          <h3 className="mt-phi-5 text-[length:var(--text-lg)] font-medium tracking-[-0.02em] text-white">Install skills</h3>
          <p className="mt-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
            Browse and install skills per agent from the ClawHub and curated library.
          </p>
        </Link>
        <Link
          href="/knowledge"
          className="group rounded-lg border border-border-subtle bg-surface-2 p-phi-8 transition-colors hover:border-border hover:bg-surface-3"
        >
          <Database className="size-5 text-white" />
          <h3 className="mt-phi-5 text-[length:var(--text-lg)] font-medium tracking-[-0.02em] text-white">Upload knowledge</h3>
          <p className="mt-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
            Add documents to Supabase Storage for chunking and retrieval via pgvector.
          </p>
        </Link>
      </div>
    </div>
  );
}
