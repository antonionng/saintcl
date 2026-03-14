import { notFound } from "next/navigation";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentLogs, getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";

export default async function AgentLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentOrg();

  if (!session?.org.id) notFound();

  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) notFound();

  const logs = await getAgentLogs(session.org.id, agent.id, 50);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Realtime logs"
        title={`${agent.name} logs`}
        description="Gateway events and agent activity stream. Connect Supabase Realtime for live updates."
      />

      <Card>
        <CardHeader>
          <CardTitle>Event feed</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No logs yet"
              description="Logs will appear here once this agent starts processing messages through a connected channel."
            />
          ) : (
            <div className="space-y-3">
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <span>{entry.role ?? "system"}</span>
                    <span>{new Date(entry.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
