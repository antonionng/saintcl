import { GitBranch, ShieldCheck, TerminalSquare } from "lucide-react";

import { AccessDenied } from "@/components/dashboard/access-denied";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getCurrentOrg,
  getOrgPolicy,
  getRepoAllowlists,
  getTerminalApprovals,
  getTerminalRuns,
} from "@/lib/dal";

export default async function AdminToolsPage() {
  const session = await getCurrentOrg();
  const orgId = session?.org.id;

  const policy = orgId ? await getOrgPolicy(orgId) : null;
  if (!session?.capabilities.canManageAdminTools) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Privileged execution"
          title="Admin tools"
          description="Terminal approvals, repo allowlists, and privileged workflows are admin-only."
        />
        <AccessDenied description="Ask an owner or admin for access to privileged tools." />
      </div>
    );
  }

  const [allowlists, approvals, runs] = orgId
    ? await Promise.all([
        getRepoAllowlists(orgId),
        getTerminalApprovals(orgId),
        getTerminalRuns(orgId),
      ])
    : [[], [], []];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Privileged execution"
        title="Admin tools"
        description="Run repo and terminal workflows inside tenant-scoped workspaces, with repo allowlists, approval gates, and full audit history."
        action={<Badge variant="warning">Admin only</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Repo allowlists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allowlists.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="No allowlists"
                description="Add GitHub or GitLab org patterns to control which repos agents can clone."
                className="py-8"
              />
            ) : (
              allowlists.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{entry.pattern}</p>
                      <p className="mt-2 text-sm text-zinc-500">
                        Added {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="rounded-2xl border border-dashed border-white/20 p-4">
              <p className="text-sm text-zinc-400">
                Add a GitHub or GitLab org pattern
              </p>
              <div className="mt-4 flex gap-3">
                <Input placeholder="github.com/your-org" />
                <Button variant="secondary">Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terminal policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck className="size-4 text-emerald-400" />
                Non-main sandbox required
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-white">
                <TerminalSquare className="size-4 text-white" />
                Commands require explicit admin approval
              </div>
            </div>
            <p>
              All terminal events are written to audit logs with full command
              history and exit codes.
            </p>
            {policy?.mission ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="uppercase tracking-[0.18em] text-zinc-500">Company mission</p>
                <p className="mt-2 text-white">{policy.mission}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Approval queue</CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No approvals"
                description="Terminal commands requiring admin approval will appear here."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{approval.command}</p>
                        <p className="mt-2 text-sm text-zinc-500">
                          {new Date(approval.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          approval.status === "approved" ? "success" : "warning"
                        }
                      >
                        {approval.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent terminal runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <EmptyState
                icon={TerminalSquare}
                title="No terminal runs"
                description="Completed terminal executions with exit codes and output will appear here."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{run.command}</p>
                      <Badge variant={run.exit_code === 0 ? "success" : "warning"}>
                        exit {run.exit_code}
                      </Badge>
                    </div>
                    {run.stdout_excerpt ? (
                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        {run.stdout_excerpt}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
