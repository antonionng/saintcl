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
        eyebrow="Observability"
        title="Request observability"
        description="Inspect request activity, model usage, latency, and session-level tails in near real time."
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
