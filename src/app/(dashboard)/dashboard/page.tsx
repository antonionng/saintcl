import Link from "next/link";
import { Activity, ArrowRight, Bot, TerminalSquare } from "lucide-react";

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
    { id: "agents", label: "Agents", value: String(stats.agents), delta: stats.agents === 0 ? "None yet" : "Active" },
    { id: "channels", label: "Connectors", value: String(stats.channels), delta: stats.channels === 0 ? "None connected" : "Connected" },
    { id: "docs", label: "Knowledge", value: String(stats.docs), delta: stats.docs === 0 ? "No documents" : "Indexed" },
    { id: "runtimes", label: "Runtimes", value: String(stats.runtimes), delta: stats.runtimes === 0 ? "Not started" : "Running" },
  ];

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Operations"
        title="Rollout overview"
        description="Runtime health, connector coverage, approvals, knowledge, and recent activity for company admins."
        action={
          <Button asChild>
            <Link href="/agents/new">New agent</Link>
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
                title="No runtime yet"
                description="Create your first agent and Saint AGI will prepare the governed runtime path automatically."
                className="py-phi-8"
              />
            ) : (
              <div className="space-y-phi-3">
                {runtimes.map((runtime) => (
                  <Card key={runtime.id} variant="inset" className="p-4 sm:p-phi-5">
                    <div className="flex flex-col gap-phi-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[length:var(--text-sm)] font-medium text-white">
                          {session?.org.name ?? "Workspace"}
                        </p>
                        <p className="mt-phi-2 text-[length:var(--text-sm)] text-zinc-400">
                          {runtime.status === "online" ? "Ready for assigned workspaces" : "Connecting"}
                        </p>
                      </div>
                      <Badge variant={runtime.status === "online" ? "success" : "warning"} className="self-start sm:self-center">
                        {runtime.status}
                      </Badge>
                    </div>
                    {runtime.last_heartbeat_at ? (
                      <p className="mt-phi-3 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
                        Last active {new Date(runtime.last_heartbeat_at).toLocaleString()}
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
            <CardTitle>Governance queue</CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <EmptyState
                icon={TerminalSquare}
                title="No pending approvals"
                description="Risky commands and governed actions that require admin review will appear here."
                className="py-phi-8"
              />
            ) : (
              <div className="space-y-phi-3">
                {approvals.map((approval) => (
                  <Card key={approval.id} variant="inset" className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-phi-5 sm:py-phi-5">
                    <div className="min-w-0">
                      <p className="truncate text-[length:var(--text-sm)] font-medium text-white">{approval.command}</p>
                      <p className="text-[length:var(--text-sm)] text-zinc-400">{approval.requested_by ?? "system"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-phi-3 text-[length:var(--text-sm)] text-zinc-400">
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
          <CardTitle>Recent rollout activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No activity yet"
              description="Agent activity, connector events, and runtime signals will appear here as your rollout starts."
              action={
                <div className="flex flex-wrap justify-center gap-phi-3">
                  <Button asChild size="sm">
                    <Link href="/agents/new">New agent</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/apps">Connect an app</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-phi-3">
              {logs.map((log) => (
                <Card key={log.id} variant="inset" className="p-phi-5">
                  <div className="flex flex-col gap-1 text-[length:var(--text-sm)] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all text-[length:var(--text-xs)] uppercase tracking-[0.08em] sm:break-normal">
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
    </div>
  );
}
