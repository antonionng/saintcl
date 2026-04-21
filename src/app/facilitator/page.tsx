import Link from "next/link";
import { redirect } from "next/navigation";

import { ParticipantMagicLink } from "@/components/training/participant-magic-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { getTrainingModules, getTrainingModuleFacilitatorHref, getTrainingDeliveryStats } from "@/lib/training";
import { getTrainingCohortSnapshots } from "@/lib/training-dal";

function buildMagicLink(inviteCode: string | null | undefined, token: string) {
  const base = env.appUrl.replace(/\/+$/, "");
  const code = inviteCode ?? "";
  return `${base}/academy/${encodeURIComponent(code)}/launch?token=${encodeURIComponent(token)}`;
}

export default async function FacilitatorHubPage() {
  const session = await getCurrentPlatformTrainingSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.canManagePlatformTraining) {
    redirect("/dashboard");
  }

  const modules = getTrainingModules();
  const deliveryStats = getTrainingDeliveryStats();
  const cohortSnapshots = await getTrainingCohortSnapshots();

  const totalParticipants = cohortSnapshots.reduce((sum, s) => sum + s.stats.participantCount, 0);
  const totalActive = cohortSnapshots.reduce((sum, s) => sum + s.stats.activeParticipantCount, 0);
  const totalCompleted = cohortSnapshots.reduce((sum, s) => sum + s.stats.completedEnrollmentCount, 0);
  const overallProgress =
    cohortSnapshots.length > 0
      ? cohortSnapshots.reduce((sum, s) => sum + s.stats.averageProgress, 0) / cohortSnapshots.length
      : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Facilitator hub</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">AJB AI and Data Programme</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Programme overview, cohort health, participant progress, and quick access to every module facilitator console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/facilitator/assessments"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Assessment review queue
            </Link>
            <Link
              href="/training/admin"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Training admin
            </Link>
          </div>
        </div>

        {/* Programme summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Modules", value: deliveryStats.moduleCount },
            { label: "Cohorts", value: cohortSnapshots.length },
            { label: "Participants", value: totalParticipants },
            { label: "Active", value: totalActive },
            { label: "Avg progress", value: `${overallProgress.toFixed(0)}%` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Module launcher grid */}
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Module facilitator consoles</CardTitle>
            <CardDescription>Open any module console for live delivery, deck control, participant tracking, and facilitator notes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            {modules.map((module) => {
              const facilitatorHref = getTrainingModuleFacilitatorHref(module.slug);
              return (
                <div key={module.slug} className="flex flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Module {module.sequence}</p>
                    <p className="mt-1 font-medium text-white">{module.title}</p>
                    <p className="mt-2">{module.durationDays} {module.durationDays === 1 ? "day" : "days"}, {module.hoursPerDay}h per day</p>
                    <p className="mt-1 text-zinc-400">{module.summary}</p>
                  </div>
                  {facilitatorHref ? (
                    <Link
                      href={facilitatorHref}
                      className="mt-4 inline-flex self-start rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      Open console
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cohort health and participant progress */}
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Cohort health</CardTitle>
            <CardDescription>Invite links, participant activity, and enrollment progress across active training cohorts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cohortSnapshots.length > 0 ? (
              cohortSnapshots.map((snapshot) => (
                <div key={snapshot.cohort.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-white">{snapshot.cohort.name}</p>
                      <p>Invite code: {snapshot.cohort.inviteCode ?? snapshot.cohort.slug}</p>
                      <p>Dates: {snapshot.cohort.startsOn ?? "TBC"} to {snapshot.cohort.endsOn ?? "TBC"}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Participants</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{snapshot.stats.participantCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Active</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{snapshot.stats.activeParticipantCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Completed</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{snapshot.stats.completedEnrollmentCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Avg progress</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{snapshot.stats.averageProgress.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>

                  {snapshot.participants.length > 0 ? (
                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      {snapshot.participants.map((participant) => {
                        const participantEnrollments = snapshot.enrollments.filter(
                          (enrollment) => enrollment.participantId === participant.id,
                        );
                        const progressSummary =
                          participantEnrollments.length > 0
                            ? participantEnrollments.map((enrollment) => `${enrollment.progressPercent.toFixed(0)}%`).join(", ")
                            : "No module activity yet";

                        const isInviteOnly = !participant.authUserId;
                        const magicLink = participant.checkInToken
                          ? buildMagicLink(snapshot.cohort.inviteCode, participant.checkInToken)
                          : null;
                        return (
                          <div
                            key={participant.id}
                            className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-300"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-white">{participant.fullName}</p>
                              {isInviteOnly ? (
                                <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-100">
                                  Invited
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1">{participant.email}</p>
                            <p className="mt-1 capitalize">Status: {participant.status}</p>
                            <p className="mt-1">Module progress: {progressSummary}</p>
                            {magicLink ? (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <ParticipantMagicLink link={magicLink} />
                                <span className="truncate text-[10px] text-zinc-500" title={magicLink}>
                                  {magicLink}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-zinc-500">No participants have checked into this cohort yet.</p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-400">
                No cohorts created yet. Sync the AJB programme and create a cohort invite to start participant access.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
