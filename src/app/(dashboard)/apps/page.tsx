import { Suspense } from "react";

import { AppsCatalog } from "@/components/dashboard/apps-catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { CATALOG } from "@/lib/apps/catalog";
import { listOrgApps } from "@/lib/apps/store";
import { getAgents, getCurrentOrg } from "@/lib/dal";

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const session = await getCurrentOrg();
  const orgId = session?.org.id;

  const [agents, installs] = orgId
    ? await Promise.all([getAgents(orgId), listOrgApps(orgId)])
    : [[], []];

  const installedAppIds = installs.map((row) => row.app_id);
  const agentOptions = agents.map((agent) => ({ id: agent.id, name: agent.name }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="App store"
        title="Apps"
        description="One place to add channels, skills, search, memory and tools to your agents. Most apps are click-to-install."
      />

      <Suspense fallback={null}>
        <AppsCatalog
          apps={CATALOG}
          installedAppIds={installedAppIds}
          agents={agentOptions}
          defaultAgentId={params.agent ?? null}
        />
      </Suspense>
    </div>
  );
}
