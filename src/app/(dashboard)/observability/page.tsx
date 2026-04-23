import { notFound } from "next/navigation";

import { ObservabilityShell } from "@/components/dashboard/observability-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentOrg, getVisibleAgentsForSession } from "@/lib/dal";

export default async function ObservabilityPage() {
  const session = await getCurrentOrg();
  if (!session?.org.id) {
    notFound();
  }

  const visibleAgents = await getVisibleAgentsForSession(session);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity"
        title="Activity"
        description="See what your agents are doing in real time. Track conversations, model usage, and response times."
      />
      <ObservabilityShell
        visibleAgents={visibleAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
        }))}
      />
    </div>
  );
}
