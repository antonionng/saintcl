import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SessionLogTail } from "@/components/dashboard/session-log-tail";
import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { buildAgentSessionKey } from "@/lib/openclaw/session-keys";

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
  const sessionKey = buildAgentSessionKey(agent.openclaw_agent_id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Realtime logs"
        title={`${agent.name} logs`}
        description="Near-real-time request metrics and activity stream for this agent's primary session."
      />

      <SessionLogTail sessionKey={sessionKey} title="Agent session" />
    </div>
  );
}
