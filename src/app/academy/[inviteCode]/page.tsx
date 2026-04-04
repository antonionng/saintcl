import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { ParticipantCheckInForm } from "@/components/training/participant-check-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buildParticipantModuleAccessState } from "@/lib/training-access";
import { ajbTrainingProgramme } from "@/lib/training";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";
import {
  getTrainingCohortByInviteCode,
  getTrainingModuleUnlockMapByInvite,
  getTrainingModulesForProgramme,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantByCheckInToken,
} from "@/lib/training-dal";

function getModulePhase(sequence: number) {
  if (sequence <= 3) return "Technical foundations";
  if (sequence <= 5) return "Strategy and operations";
  if (sequence === 6) return "Communication";
  return "Capstone";
}

export default async function AcademyInvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieParticipantSession = checkInToken ? await getTrainingParticipantByCheckInToken(checkInToken) : null;
  const authParticipantSession =
    user && cohort
      ? await getTrainingParticipantByInviteForAuthUser({
          inviteCode,
          authUserId: user.id,
          email: user.email ?? null,
        })
      : null;
  const participantSession =
    cookieParticipantSession?.cohort?.id === cohort?.id ? cookieParticipantSession : authParticipantSession;
  const hasActiveParticipant = participantSession?.cohort?.id === cohort?.id;
  const isReviewPreview = !cohort;
  const isPublicReview = isReviewPreview || (Boolean(cohort) && !hasActiveParticipant);
  const cohortLabel = cohort?.name ?? "AJB review preview";
  const completedEnrollments = participantSession?.enrollments.filter((enrollment) => enrollment.status === "completed") ?? [];
  const activeEnrollments = participantSession?.enrollments.filter((enrollment) => enrollment.status === "in_progress") ?? [];
  const [syncedModules, facilitatorUnlocks] = cohort
    ? await Promise.all([
        getTrainingModulesForProgramme(cohort.programmeId),
        getTrainingModuleUnlockMapByInvite(inviteCode),
      ])
    : [[], {}];
  const moduleAccessStates = buildParticipantModuleAccessState({
    modules: ajbTrainingProgramme.modules,
    syncedModules,
    enrollments: participantSession?.enrollments ?? [],
    facilitatorUnlocks,
  });
  const moduleAccessBySlug = new Map(moduleAccessStates.map((item) => [item.moduleSlug, item]));

  const totalModules = ajbTrainingProgramme.modules.length;
  const completedCount = completedEnrollments.length;
  const programmePercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const currentModuleIndex = ajbTrainingProgramme.modules.findIndex((module) => {
    const access = moduleAccessBySlug.get(module.slug);
    return access?.enrollmentStatus !== "completed";
  });
  const currentModule = currentModuleIndex >= 0 ? ajbTrainingProgramme.modules[currentModuleIndex] : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your learning portal"
        title="AJB participant academy"
        description="Access your modules, continue your labs, and pick up where you left off throughout the programme."
      />

      {hasActiveParticipant ? (
          <>
            {/* Programme progress summary */}
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Programme progress</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {completedCount === totalModules
                      ? "Programme complete"
                      : currentModule
                        ? `Module ${currentModuleIndex + 1} of ${totalModules}`
                        : `${completedCount} of ${totalModules} modules`}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {completedCount === totalModules
                      ? `All ${totalModules} modules completed. Well done, ${participantSession?.participant.fullName}.`
                      : currentModule
                        ? `Current: ${currentModule.title}. ${programmePercent}% of the programme complete.`
                        : `${programmePercent}% complete.`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                    {participantSession?.participant.fullName}
                  </div>
                </div>
              </div>

              {/* Journey map */}
              <div className="mt-5 flex items-stretch gap-1 overflow-x-auto pb-2">
                {ajbTrainingProgramme.modules.map((module, index) => {
                  const access = moduleAccessBySlug.get(module.slug);
                  const isCompleted = access?.enrollmentStatus === "completed";
                  const isActive = access?.enrollmentStatus === "in_progress";
                  const isCurrent = index === currentModuleIndex;

                  const nodeTone = isCompleted
                    ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
                    : isActive || isCurrent
                      ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-100"
                      : "border-white/8 bg-white/[0.02] text-zinc-500";

                  return (
                    <div key={module.slug} className="flex items-stretch gap-1">
                      <div className={`flex h-[92px] w-[132px] shrink-0 flex-col justify-between rounded-xl border px-3 py-2 ${nodeTone}`}>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{getModulePhase(module.sequence)}</span>
                          <span className="mt-1 block min-h-8 text-xs font-medium leading-4">{module.title}</span>
                        </div>
                        <span className="text-[10px]">
                          {isCompleted ? "Completed" : isActive ? `${access?.progressPercent.toFixed(0)}%` : module.durationDays + "d"}
                        </span>
                      </div>
                      {index < ajbTrainingProgramme.modules.length - 1 ? (
                        <div className={`h-px w-4 shrink-0 ${isCompleted ? "bg-emerald-400/30" : "bg-white/10"}`} />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 transition-all duration-500"
                    style={{ width: `${programmePercent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                  <span>{completedCount} completed</span>
                  <span>{activeEnrollments.length} in progress</span>
                  <span>{totalModules - completedCount - activeEnrollments.length} remaining</span>
                </div>
              </div>
            </div>

            {/* Module list */}
            <div className="grid gap-4 xl:grid-cols-2">
              {ajbTrainingProgramme.modules.map((module) => {
                const access = moduleAccessBySlug.get(module.slug);
                const canOpen = access?.canOpen ?? module.sequence === 1;
                const isCompleted = access?.enrollmentStatus === "completed";
                const isActive = access?.enrollmentStatus === "in_progress";

                const statusCopy = isCompleted
                  ? "Completed"
                  : isActive
                    ? `In progress, ${access?.progressPercent.toFixed(0)}% done`
                    : access?.unlockedByFacilitator
                      ? "Unlocked by facilitator"
                      : canOpen
                        ? "Ready to start"
                        : `Locked until ${access?.prerequisiteTitle ?? "the previous module"} is completed or the facilitator unlocks it`;

                const statusTone = isCompleted
                  ? "text-emerald-300"
                  : isActive
                    ? "text-sky-300"
                    : canOpen
                      ? "text-zinc-300"
                      : "text-zinc-500";

                return (
                  <Card key={module.slug} className="border-white/8 bg-black/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            Module {module.sequence} of {totalModules}
                          </p>
                          <CardTitle className="mt-1">{module.title}</CardTitle>
                        </div>
                        {isCompleted ? (
                          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1 text-xs text-emerald-100">
                            Completed
                          </div>
                        ) : isActive ? (
                          <div className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1 text-xs text-sky-100">
                            In progress
                          </div>
                        ) : null}
                      </div>
                      <CardDescription>{module.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span>{module.durationDays} {module.durationDays === 1 ? "day" : "days"}, {module.hoursPerDay}h per day</span>
                        <span className="text-white/10">|</span>
                        <span>{module.keyThemes.slice(0, 3).join(", ")}</span>
                      </div>
                      <p className={`text-sm ${statusTone}`}>{statusCopy}</p>
                      {canOpen ? (
                        <Link
                          href={`/academy/${inviteCode}/${module.slug}`}
                          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          {isActive ? "Continue module" : isCompleted ? "Review module" : "Start module"}
                        </Link>
                      ) : (
                        <div className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-500">
                          Locked
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="border-white/8 bg-black/10">
                <CardHeader className="pb-4">
                  <CardTitle>{isPublicReview ? "Public review mode" : user ? "Continue your enrolment" : "Sign in to start learning"}</CardTitle>
                  <CardDescription>{cohortLabel}. Invite code: {inviteCode}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isPublicReview ? (
                    <div className="space-y-4">
                      <p className="text-sm text-zinc-300">
                        This academy link is open for internal review. Anyone with the link can view the programme and open every module without signing in.
                      </p>
                      <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-4 py-2 text-sm text-amber-100">
                        Review mode is read-only for progress tracking.
                      </div>
                    </div>
                  ) : user ? (
                    <ParticipantCheckInForm
                      inviteCode={inviteCode}
                      cohortName={cohort.name}
                      signedInEmail={user.email ?? null}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-zinc-300">
                        Sign in or create your account to save your place and return to the programme whenever you need.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/login?next=${encodeURIComponent(`/academy/${inviteCode}`)}`}
                          className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          Sign in
                        </Link>
                        <Link
                          href={`/signup?next=${encodeURIComponent(`/academy/${inviteCode}`)}`}
                          className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          Create account
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/8 bg-black/10">
                <CardHeader className="pb-4">
                  <CardTitle>What you will find here</CardTitle>
                  <CardDescription>Everything for your learning journey opens from this link.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-300">
                  {[
                    `${ajbTrainingProgramme.name}`,
                    `${ajbTrainingProgramme.modules.length} modules delivered in sequence`,
                    isPublicReview ? "All modules are open for review from this page" : "Decks, labs, and progress tracking in one place",
                    isPublicReview ? "Share the module links internally without requiring account access" : "Come back to this link whenever you want to continue",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {ajbTrainingProgramme.modules.map((module) => {
                const access = moduleAccessBySlug.get(module.slug);
                const canOpen = isPublicReview ? true : (access?.canOpen ?? module.sequence === 1);
                const isCompleted = access?.enrollmentStatus === "completed";
                const isActive = access?.enrollmentStatus === "in_progress";

                const statusCopy = isPublicReview
                  ? "Open for internal review"
                  : isCompleted
                    ? "Completed"
                    : isActive
                      ? `In progress, ${access?.progressPercent.toFixed(0)}% done`
                      : access?.unlockedByFacilitator
                        ? "Unlocked by facilitator"
                        : canOpen
                          ? "Ready to start"
                          : `Locked until ${access?.prerequisiteTitle ?? "the previous module"} is completed or the facilitator unlocks it`;

                const statusTone = isPublicReview
                  ? "text-amber-200"
                  : isCompleted
                    ? "text-emerald-300"
                    : isActive
                      ? "text-sky-300"
                      : canOpen
                        ? "text-zinc-300"
                        : "text-zinc-500";

                return (
                  <Card key={module.slug} className="border-white/8 bg-black/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            Module {module.sequence} of {totalModules}
                          </p>
                          <CardTitle className="mt-1">{module.title}</CardTitle>
                        </div>
                        {isPublicReview ? (
                          <div className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-xs text-amber-100">
                            Review
                          </div>
                        ) : isCompleted ? (
                          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1 text-xs text-emerald-100">
                            Completed
                          </div>
                        ) : isActive ? (
                          <div className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1 text-xs text-sky-100">
                            In progress
                          </div>
                        ) : null}
                      </div>
                      <CardDescription>{module.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span>{module.durationDays} {module.durationDays === 1 ? "day" : "days"}, {module.hoursPerDay}h per day</span>
                        <span className="text-white/10">|</span>
                        <span>{module.keyThemes.slice(0, 3).join(", ")}</span>
                      </div>
                      <p className={`text-sm ${statusTone}`}>{statusCopy}</p>
                      {canOpen ? (
                        <Link
                          href={`/academy/${inviteCode}/${module.slug}`}
                          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          {isPublicReview ? "Open review" : isActive ? "Continue module" : isCompleted ? "Review module" : "Start module"}
                        </Link>
                      ) : (
                        <div className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-500">
                          Locked
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
      )}
    </div>
  );
}
