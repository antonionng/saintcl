import Link from "next/link";
import { Activity, ArrowRight, Bot, Cable, Database, TerminalSquare } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-8">
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Runtime health</h2>
          </div>
          <div>
            {runtimes.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No runtimes"
                description="Provision your first agent to spin up an OpenClaw runtime."
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {runtimes.map((runtime) => (
                  <div key={runtime.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{runtime.org_id.slice(0, 8)}</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          Port {runtime.gateway_port}
                          {runtime.pid ? ` · PID ${runtime.pid}` : ""}
                        </p>
                      </div>
                      <Badge variant={runtime.status === "online" ? "success" : "warning"}>
                        {runtime.status}
                      </Badge>
                    </div>
                    {runtime.last_heartbeat_at ? (
                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        Last heartbeat {new Date(runtime.last_heartbeat_at).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Approval queue</h2>
          </div>
          <div>
            {approvals.length === 0 ? (
              <EmptyState
                icon={TerminalSquare}
                title="No pending approvals"
                description="Terminal commands requiring approval will appear here."
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-white">{approval.command}</p>
                      <p className="text-sm text-zinc-400">{approval.requested_by ?? "system"}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <Activity className="size-4 text-emerald-400" />
                      {approval.status}
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <div className="mb-4">
          <h2 className="text-lg font-medium tracking-[-0.03em] text-white">Recent logs</h2>
        </div>
        <div>
          {logs.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No activity yet"
              description="Agent logs will stream here once you provision an agent and connect a channel."
              action={
                <div className="flex flex-wrap justify-center gap-3">
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
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span className="uppercase tracking-[0.2em]">
                      {log.role ?? "system"} · {log.session_key ?? "-"}
                    </span>
                    <span>{new Date(log.occurred_at ?? log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/agents/new"
          className="group rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
        >
          <Bot className="size-5 text-white" />
          <h3 className="mt-4 text-lg font-medium tracking-[-0.03em] text-white">Provision an agent</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Create a dedicated OpenClaw identity mapped to a model, persona, and workspace.
          </p>
        </Link>
        <Link
          href="/connections"
          className="group rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
        >
          <Cable className="size-5 text-white" />
          <h3 className="mt-4 text-lg font-medium tracking-[-0.03em] text-white">Connect a channel</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Bind Telegram or Slack to an agent so inbound messages route to the right session.
          </p>
        </Link>
        <Link
          href="/knowledge"
          className="group rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
        >
          <Database className="size-5 text-white" />
          <h3 className="mt-4 text-lg font-medium tracking-[-0.03em] text-white">Upload knowledge</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Add documents to Supabase Storage for chunking and retrieval via pgvector.
          </p>
        </Link>
      </div>
    </div>
  );
}
