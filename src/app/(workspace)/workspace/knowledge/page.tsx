import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getKnowledgeDocs, getTeams } from "@/lib/dal";

export default async function WorkspaceKnowledgePage() {
  const session = await getCurrentOrg();
  if (!session) {
    redirect("/login");
  }

  const docs = await getKnowledgeDocs(session.org.id);
  const teams = await getTeams(session.org.id);

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <PageHeader
          eyebrow="Knowledge"
          title="Your knowledge"
          description="Manage the working context that your assigned employee agents can use automatically."
          action={
            <Button asChild variant="secondary">
              <Link href="/workspace">
                <ChevronLeft className="size-4" />
                <span>Back</span>
              </Link>
            </Button>
          }
        />
        <KnowledgeDashboard
          docs={docs}
          teams={teams}
          canManageShared={false}
          currentUserId={session.userId}
        />
      </div>
    </main>
  );
}
