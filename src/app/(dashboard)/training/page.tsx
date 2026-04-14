import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ajbTrainingProgramme, getTrainingDeliveryStats, getTrainingPriorityModules } from "@/lib/training";

export default function TrainingPage() {
  const stats = getTrainingDeliveryStats();
  const priorityModules = getTrainingPriorityModules();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Training hub"
        title="AJB training portal"
        description="Manage the full seven-module AJB academy, including around 80 participant-facing slides per module, browser labs, facilitator assets, and tracked delivery."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Programme scope</CardTitle>
            <CardDescription>Seven modules on one reusable delivery model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p className="text-3xl font-semibold text-white">{stats.moduleCount}</p>
            <p>Modules across Python, ML, neural networks, automation, visualisation, and AI strategy.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slide target</CardTitle>
            <CardDescription>Full participant-facing decks, not microsites.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p className="text-3xl font-semibold text-white">{stats.totalTargetSlides}</p>
            <p>Total target slide count across the programme, assuming about 80 slides per module.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lab footprint</CardTitle>
            <CardDescription>Browser labs, datasets, notebooks, and solution paths.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p className="text-3xl font-semibold text-white">{stats.totalLabs}</p>
            <p>Planned lab activities across the seven modules, with runtime support designed for later ML depth.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ajbTrainingProgramme.name}</CardTitle>
          <CardDescription>
            {ajbTrainingProgramme.clientName}. {ajbTrainingProgramme.audience}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <p>{ajbTrainingProgramme.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/training/${ajbTrainingProgramme.slug}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
            >
              View programme structure
            </Link>
            <Link
              href="/training/admin"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
            >
              Open facilitator control room
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {priorityModules.map((module) => (
          <Card key={module.slug}>
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>
                Delivery window: {module.dates.startsOn} to {module.dates.endsOn}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>{module.summary}</p>
              {module.reviewWindow ? (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Review window</p>
                  <div className="mt-2 space-y-1">
                    <p>Content due: {module.reviewWindow.contentDueOn}</p>
                    <p>Feedback due: {module.reviewWindow.reviewDueOn}</p>
                    <p>Final sign-off: {module.reviewWindow.signOffDueOn}</p>
                  </div>
                </div>
              ) : null}
              <Link
                href={`/training/${ajbTrainingProgramme.slug}/${module.slug}`}
                className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
              >
                Open module blueprint
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
