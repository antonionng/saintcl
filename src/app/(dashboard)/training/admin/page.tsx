import { PageHeader } from "@/components/dashboard/page-header";
import { TrainingAdminControls } from "@/components/training/training-admin-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { getTrainingCohortSnapshots } from "@/lib/training-dal";
import { getTrainingModules, getTrainingPriorityModules } from "@/lib/training";

export default async function TrainingAdminPage() {
  const modules = getTrainingModules();
  const priorityModules = getTrainingPriorityModules();
  const session = await getCurrentPlatformTrainingSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.canManagePlatformTraining) {
    redirect("/dashboard");
  }

  const cohortSnapshots = await getTrainingCohortSnapshots();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Facilitator control room"
        title="Training operations"
        description="Use this area to manage delivery readiness, participant oversight, lab operations, and the staged rollout from the first three urgent modules into the full seven-module AJB programme."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Programme setup</CardTitle>
            <CardDescription>Sync the AJB blueprint and generate cohort invite links for participants.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrainingAdminControls />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Immediate delivery focus</CardTitle>
            <CardDescription>Modules that need the earliest product and content readiness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            {priorityModules.map((module) => (
              <div key={module.slug} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="font-medium text-white">{module.title}</p>
                {module.reviewWindow ? (
                  <div className="mt-2 space-y-1">
                    <p>Content due: {module.reviewWindow.contentDueOn}</p>
                    <p>Review due: {module.reviewWindow.reviewDueOn}</p>
                    <p>Sign-off due: {module.reviewWindow.signOffDueOn}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational controls</CardTitle>
            <CardDescription>Capabilities expected in the portal for facilitators and programme leads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            {[
              "Create cohorts and assign participants",
              "Track attendance and progress in real time",
              "Inspect lab runtime health and restart failed workspaces",
              "Review submissions against competent, strong, and exceptional bands",
              "Export completion and delivery evidence",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programme-wide rollout queue</CardTitle>
          <CardDescription>Every module inherits the same content, runtime, and reporting model.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {modules.map((module) => (
            <div key={module.slug} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">
                {module.sequence}. {module.title}
              </p>
              <p className="mt-2">
                {module.durationDays} days, {module.contentModel.targetSlideCount} slides target, {module.contentModel.labCount} labs
              </p>
              <p className="mt-2">{module.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohort health</CardTitle>
          <CardDescription>Invite links, participant activity, and enrollment completion across active training cohorts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cohortSnapshots.length > 0 ? (
            cohortSnapshots.map((snapshot) => (
              <div key={snapshot.cohort.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-300">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-white">{snapshot.cohort.name}</p>
                    <p>Invite code: {snapshot.cohort.inviteCode ?? snapshot.cohort.slug}</p>
                    <p>
                      Dates: {snapshot.cohort.startsOn ?? "TBC"} to {snapshot.cohort.endsOn ?? "TBC"}
                    </p>
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
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Completed enrollments</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{snapshot.stats.completedEnrollmentCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Average progress</p>
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

                      return (
                        <div
                          key={participant.id}
                          className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-300"
                        >
                          <p className="font-medium text-white">{participant.fullName}</p>
                          <p className="mt-1">{participant.email}</p>
                          <p className="mt-1 capitalize">Status: {participant.status}</p>
                          <p className="mt-1">Module progress: {progressSummary}</p>
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
  );
}
