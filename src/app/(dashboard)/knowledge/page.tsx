import { PageHeader } from "@/components/dashboard/page-header";
import { EnrichmentStatusCard } from "@/components/dashboard/enrichment-status-card";
import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";
import { getCurrentOrg, getKnowledgeDocs, getTeams } from "@/lib/dal";

export default async function KnowledgePage() {
  const session = await getCurrentOrg();
  const docs = session?.org.id ? await getKnowledgeDocs(session.org.id) : [];
  const teams = session?.org.id ? await getTeams(session.org.id) : [];

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Knowledge"
        title="Knowledge operations"
        description="Manage company, team, and personal knowledge with automatic scope-aware retrieval for your agents."
      />
      {session ? (
        <>
          <EnrichmentStatusCard
            orgId={session.org.id}
            website={session.org.website ?? null}
            enrichedUrl={session.org.website_enriched_url ?? null}
            enrichedAt={session.org.website_enriched_at ?? null}
          />
          <KnowledgeDashboard
            docs={docs}
            teams={teams}
            canManageShared={session.capabilities.canManageAgents}
            currentUserId={session.userId}
          />
        </>
      ) : null}
    </div>
  );
}
