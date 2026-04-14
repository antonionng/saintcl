import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrainingModuleBySlug, getTrainingModuleFacilitatorHref, getTrainingProgrammeBySlug } from "@/lib/training";

export default async function TrainingModulePage({
  params,
}: {
  params: Promise<{ programmeSlug: string; moduleSlug: string }>;
}) {
  const { programmeSlug, moduleSlug } = await params;
  const programme = getTrainingProgrammeBySlug(programmeSlug);
  const trainingModule = getTrainingModuleBySlug(programmeSlug, moduleSlug);
  const facilitatorConsoleHref = getTrainingModuleFacilitatorHref(moduleSlug);

  if (!programme || !trainingModule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module architecture"
        title={trainingModule.title}
        description="An approximately 80-slide participant-facing module blueprint with structured labs, browser runtime requirements, and facilitator-visible delivery controls."
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Delivery brief</CardTitle>
            <CardDescription>
              Sequence {trainingModule.sequence} in {programme.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>{trainingModule.summary}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Duration</p>
                <p className="mt-2 text-white">
                  {trainingModule.durationDays} days x {trainingModule.hoursPerDay} hours
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Slide target</p>
                <p className="mt-2 text-white">{trainingModule.contentModel.targetSlideCount} slides</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Lab count</p>
                <p className="mt-2 text-white">{trainingModule.contentModel.labCount} labs</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Learning objectives</p>
              <ul className="mt-3 space-y-2 text-zinc-300">
                {trainingModule.learningObjectives.map((objective) => (
                  <li key={objective} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset stack</CardTitle>
            <CardDescription>Reusable delivery pack for every cohort.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            {trainingModule.contentModel.assetPack.map((asset) => (
              <div key={asset} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {asset}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content model</CardTitle>
          <CardDescription>Standardised participant-facing structure for each 80-slide deck.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {trainingModule.contentModel.sections.map((section) => (
            <div key={section.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{section.title}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{section.slideCount}</p>
              <p className="mt-1">slides</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lab blueprint</CardTitle>
            <CardDescription>Participant execution points that feed progress and submissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            {trainingModule.labs.map((lab) => (
              <div key={lab.slug} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="font-medium text-white">{lab.title}</p>
                <p className="mt-2">Deliverable: {lab.deliverable}</p>
                <p className="mt-1">Success signal: {lab.successSignal}</p>
                <Link
                  href={`/training/${programme.slug}/${trainingModule.slug}/lab/${lab.slug}`}
                  className="mt-3 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
                >
                  Open lab route
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facilitator controls</CardTitle>
            <CardDescription>Required oversight for named participant tracking and cohort delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            {[
              "Track cohort check-in and attendance",
              "Monitor slide, lab, and module completion",
              "Review submissions and scoring bands",
              "Launch or recover browser lab workspaces",
              "Export completion evidence by participant and cohort",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {item}
              </div>
            ))}
            {facilitatorConsoleHref ? (
              <Link
                href={facilitatorConsoleHref}
                className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
              >
                Open facilitator console
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
