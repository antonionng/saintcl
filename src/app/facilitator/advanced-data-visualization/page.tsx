import Link from "next/link";
import { redirect } from "next/navigation";

import { AdvancedDataVisualizationFacilitatorConsole } from "@/components/training/advanced-data-visualization-facilitator-console";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { getTrainingCohortSnapshots } from "@/lib/training-dal";

export default async function StandaloneAdvancedDataVisualizationFacilitatorPage() {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.canManagePlatformTraining) {
    redirect("/dashboard");
  }

  const cohortSnapshots = await getTrainingCohortSnapshots();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Standalone facilitator mode</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Advanced Data Visualization presenter console</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Dedicated presenter view with deck control, live roster, guide, and script tabs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/facilitator"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Facilitator hub
            </Link>
            <Link
              href="/training/admin"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Training admin
            </Link>
          </div>
        </div>
        <AdvancedDataVisualizationFacilitatorConsole cohortSnapshots={cohortSnapshots} />
      </div>
    </div>
  );
}
