import { Suspense } from "react";

import { AppsCatalog } from "@/components/dashboard/apps-catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CATALOG } from "@/lib/apps/catalog";
import { listOrgApps } from "@/lib/apps/store";
import { getAgents, getCurrentOrg } from "@/lib/dal";

function AppsCatalogSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} variant="inset" className="overflow-hidden">
          <CardContent className="space-y-4">
            <div className="h-4 w-2/5 rounded bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 rounded bg-white/8" />
              <div className="h-3 w-4/5 rounded bg-white/8" />
            </div>
            <div className="h-8 w-28 rounded bg-white/10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; category?: string; q?: string; roadmap?: string }>;
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
        eyebrow="Connect"
        title="Connector center"
        description="Add productized channels, skills, search, memory, and tools. Show roadmap items when you are planning enterprise setup."
      />

      <Suspense fallback={<AppsCatalogSkeleton />}>
        <AppsCatalog
          key={`${params.category ?? "all"}:${params.q ?? ""}:${params.roadmap ?? ""}`}
          apps={CATALOG}
          installedAppIds={installedAppIds}
          agents={agentOptions}
          defaultAgentId={params.agent ?? null}
        />
      </Suspense>
    </div>
  );
}
