import { PageHeader } from "@/components/dashboard/page-header";
import { SkillsShop } from "@/components/dashboard/skills-shop";
import { getCurrentOrg, getAgents } from "@/lib/dal";

export default async function SkillsPage() {
  const session = await getCurrentOrg();
  const orgId = session?.org.id;

  const agents = orgId ? await getAgents(orgId) : [];
  const agentOptions = agents.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Skills"
        title="Skills library"
        description="Discover, install, and manage skills for your agents. Each skill adds new capabilities to a specific agent."
      />

      {orgId ? (
        <SkillsShop orgId={orgId} agents={agentOptions} />
      ) : (
        <p className="text-sm text-zinc-400">Organization session required.</p>
      )}
    </div>
  );
}
