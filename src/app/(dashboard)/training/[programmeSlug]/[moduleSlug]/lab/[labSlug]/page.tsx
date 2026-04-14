import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTrainingLabBySlug,
  getTrainingModuleBySlug,
  getTrainingModuleDeck,
  getTrainingModuleResources,
  getTrainingModuleWorkbookHref,
} from "@/lib/training";

export default async function TrainingLabPage({
  params,
}: {
  params: Promise<{ programmeSlug: string; moduleSlug: string; labSlug: string }>;
}) {
  const { programmeSlug, moduleSlug, labSlug } = await params;
  const trainingModule = getTrainingModuleBySlug(programmeSlug, moduleSlug);
  const lab = getTrainingLabBySlug(programmeSlug, moduleSlug, labSlug);
  const deck = getTrainingModuleDeck(moduleSlug);
  const workbookHref = getTrainingModuleWorkbookHref(moduleSlug);
  const supportingResources = getTrainingModuleResources(moduleSlug).filter(
    (resource) => resource.kind !== "deck" && resource.kind !== "workbook",
  );

  if (!trainingModule || !lab) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Browser lab route"
        title={lab.title}
        description="This route scaffolds the participant lab surface. It will attach named progress, a managed browser workspace, and rubric-aware submission capture."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lab contract</CardTitle>
            <CardDescription>{trainingModule.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>Deliverable: {lab.deliverable}</p>
            <p>Success signal: {lab.successSignal}</p>
            <p>Module runtime target: managed browser workspace per named participant.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runtime events</CardTitle>
            <CardDescription>Events this route is designed to emit into training progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            {[
              "lab_launched",
              "workspace_ready",
              "checkpoint_saved",
              "lab_completed",
              "assessment_submitted",
            ].map((eventName) => (
              <div key={eventName} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 font-mono text-xs text-zinc-200">
                {eventName}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current lab bridge</CardTitle>
          <CardDescription>
            The shared lab route remains a reusable scaffold for now. Deck, workbook, and module materials stay linked here until the managed runtime layer is added.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {deck ? (
            <a
              href={deck.href}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <p className="font-medium text-white">Open participant deck</p>
              <p className="mt-1">{deck.title}</p>
            </a>
          ) : null}
          {workbookHref ? (
            <a
              href={workbookHref}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <p className="font-medium text-white">Open workbook</p>
              <p className="mt-1">{workbookHref}</p>
            </a>
          ) : null}
          {supportingResources.slice(0, 2).map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <p className="font-medium text-white">{resource.label}</p>
              <p className="mt-1 capitalize">{resource.kind}</p>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
