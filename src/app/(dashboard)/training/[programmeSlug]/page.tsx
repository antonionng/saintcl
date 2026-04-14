import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrainingProgrammeBySlug } from "@/lib/training";

export default async function TrainingProgrammePage({
  params,
}: {
  params: Promise<{ programmeSlug: string }>;
}) {
  const { programmeSlug } = await params;
  const programme = getTrainingProgrammeBySlug(programmeSlug);

  if (!programme) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Programme blueprint"
        title={programme.name}
        description="A reusable seven-module programme shell with structured decks, labs, facilitator assets, and browser execution standards."
      />

      <Card>
        <CardHeader>
          <CardTitle>Programme overview</CardTitle>
          <CardDescription>
            {programme.clientName}. Delivery mode: {programme.deliveryMode}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <p>{programme.description}</p>
          <p>Audience: {programme.audience}</p>
          <p>Module count: {programme.modules.length}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {programme.modules.map((module) => (
          <Card key={module.slug}>
            <CardHeader>
              <CardTitle>
                {module.sequence}. {module.title}
              </CardTitle>
              <CardDescription>
                {module.durationDays} days, {module.hoursPerDay} hours per day, {module.contentModel.targetSlideCount} slides target
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <p>{module.summary}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Dates</p>
                  <p className="mt-2">
                    {module.dates.startsOn} to {module.dates.endsOn}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Core outputs</p>
                  <p className="mt-2">{module.coreOutputs.join(", ")}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Themes</p>
                  <p className="mt-2">{module.keyThemes.join(", ")}</p>
                </div>
              </div>
              <Link
                href={`/training/${programme.slug}/${module.slug}`}
                className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5"
              >
                View module architecture
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
