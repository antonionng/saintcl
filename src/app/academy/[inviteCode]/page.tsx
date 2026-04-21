import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { CohortFeedPanel } from "@/components/training/cohort-feed-panel";
import { CopilotStudioPanel } from "@/components/training/copilot-studio-panel";
import { ParticipantCheckInForm } from "@/components/training/participant-check-in-form";
import { ParticipantProfilePanel } from "@/components/training/participant-profile-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { buildParticipantModuleAccessState } from "@/lib/training-access";
import { ajbTrainingProgramme, getTrainingModuleEnhancement } from "@/lib/training";
import { listParticipantAllowedModels } from "@/lib/training-copilot";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";
import {
  getTrainingCohortByInviteCode,
  getTrainingModuleUnlockMapByInvite,
  getTrainingModulesForProgramme,
  getTrainingParticipantByInviteForAuthUser,
  getTrainingParticipantByCheckInToken,
  listTrainingCohortFeed,
} from "@/lib/training-dal";

function getModulePhase(sequence: number) {
  if (sequence <= 3) return "Technical foundations";
  if (sequence <= 5) return "Strategy and operations";
  if (sequence === 6) return "Communication";
  return "Capstone";
}

type PhaseAccent = {
  label: string;
  badgeBg: string;
  badgeRing: string;
  badgeText: string;
  numberText: string;
  rail: string;
  glow: string;
};

function getPhaseAccent(sequence: number): PhaseAccent {
  if (sequence <= 3) {
    return {
      label: "Technical foundations",
      badgeBg: "bg-emerald-400/10",
      badgeRing: "ring-emerald-400/25",
      badgeText: "text-emerald-200",
      numberText: "text-emerald-100",
      rail: "from-emerald-400/70 via-emerald-400/15 to-transparent",
      glow: "from-emerald-500/[0.05] via-transparent",
    };
  }
  if (sequence <= 5) {
    return {
      label: "Strategy and operations",
      badgeBg: "bg-violet-400/10",
      badgeRing: "ring-violet-400/25",
      badgeText: "text-violet-200",
      numberText: "text-violet-100",
      rail: "from-violet-400/70 via-violet-400/15 to-transparent",
      glow: "from-violet-500/[0.05] via-transparent",
    };
  }
  if (sequence === 6) {
    return {
      label: "Communication",
      badgeBg: "bg-amber-400/10",
      badgeRing: "ring-amber-400/25",
      badgeText: "text-amber-200",
      numberText: "text-amber-100",
      rail: "from-amber-400/70 via-amber-400/15 to-transparent",
      glow: "from-amber-500/[0.05] via-transparent",
    };
  }
  return {
    label: "Capstone",
    badgeBg: "bg-rose-400/10",
    badgeRing: "ring-rose-400/25",
    badgeText: "text-rose-200",
    numberText: "text-rose-100",
    rail: "from-rose-400/70 via-rose-400/15 to-transparent",
    glow: "from-rose-500/[0.05] via-transparent",
  };
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3.5"}>
      <circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4v3.2l2 1.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3.5"}>
      <path
        d="M7 1.5 8.2 5l3.3 1.5L8.2 8 7 11.5 5.8 8 2.5 6.5 5.8 5 7 1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3.5"}>
      <rect x="2.5" y="6.5" width="9" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3"}>
      <path d="M4.5 3 11 7l-6.5 4V3Z" fill="currentColor" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3"}>
      <path d="M3 7h8m-3-3 3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className ?? "size-3.5"}>
      <path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "emerald" | "sky" | "zinc";
}) {
  const dot =
    accent === "emerald"
      ? "bg-emerald-400"
      : accent === "sky"
        ? "bg-sky-400"
        : "bg-zinc-500";
  const valueTone =
    accent === "emerald"
      ? "text-emerald-100"
      : accent === "sky"
        ? "text-sky-100"
        : "text-zinc-300";

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${valueTone}`}>{value}</p>
    </div>
  );
}

function ModuleAcademyUpgrades({ moduleSlug }: { moduleSlug: string }) {
  const enhancement = getTrainingModuleEnhancement(moduleSlug);
  if (!enhancement) return null;
  const intro = enhancement.learnerTracks[0]?.fit;
  const advanced = enhancement.learnerTracks[1]?.fit;
  const banking = enhancement.bankingContext[0];
  const pacing = enhancement.pacingNotes[0];

  return (
    <details className="group overflow-hidden rounded-xl border border-white/8 bg-white/[0.015]">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-zinc-500" />
          Programme delivery notes
        </span>
        <ChevronDownIcon className="size-3.5 text-zinc-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-white/5 px-4 py-3">
        {banking ? (
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Banking context</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-300">{banking}</p>
          </div>
        ) : null}
        {(intro || advanced) ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {intro ? (
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">Intro path</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">{intro}</p>
              </div>
            ) : null}
            {advanced ? (
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/80">Advanced path</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">{advanced}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        {pacing ? (
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Virtual delivery focus</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-300">{pacing}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
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
  const cookieParticipantSession =
    checkInToken && cohort ? await getTrainingParticipantByCheckInToken(checkInToken) : null;
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
  const hasActiveParticipant = Boolean(cohort) && participantSession?.cohort?.id === cohort?.id;

  if (!cohort) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Your learning portal"
          title="Invite link not recognised"
          description={`We could not find an active cohort for the invite code "${inviteCode}".`}
        />
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Check your invite</CardTitle>
            <CardDescription>
              The link you used either expired or belongs to a different cohort. Contact your facilitator or programme
              administrator to confirm the correct invite link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
              If you already have a Saint account linked to this programme, sign in and we will route you to your active
              cohort.
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Sign in
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cohortLabel = cohort.name ?? "AJB cohort";

  if (!hasActiveParticipant) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Your learning portal"
          title={user ? "Continue your enrolment" : "Sign in to start learning"}
          description={`${cohortLabel}. Invite code: ${inviteCode}.`}
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-white/8 bg-black/10">
            <CardHeader className="pb-4">
              <CardTitle>{user ? "Continue your enrolment" : "Sign in to start learning"}</CardTitle>
              <CardDescription>
                Module content, labs, and progress tracking are only available to verified participants in this cohort.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
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
              <CardDescription>Everything for your learning journey opens once you check in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              {[
                `${ajbTrainingProgramme.name}`,
                `${ajbTrainingProgramme.modules.length} modules delivered in sequence`,
                "Decks, labs, activities, homework, and end-of-module tests in one place",
                "Come back to this link whenever you want to continue",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedEnrollments = participantSession?.enrollments.filter((enrollment) => enrollment.status === "completed") ?? [];
  const activeEnrollments = participantSession?.enrollments.filter((enrollment) => enrollment.status === "in_progress") ?? [];
  const [syncedModules, facilitatorUnlocks, feedPosts] = await Promise.all([
    getTrainingModulesForProgramme(cohort.programmeId),
    getTrainingModuleUnlockMapByInvite(inviteCode),
    listTrainingCohortFeed({ cohortId: cohort.id, limit: 50 }),
  ]);
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

      <Card className="border-white/8 bg-black/10">
        <CardHeader className="pb-3">
          <CardTitle>Programme delivery updates</CardTitle>
          <CardDescription>Every module now highlights mixed-level pathways, clearer pacing, and stronger facilitation support for virtual delivery.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            Intro and advanced routes help mixed-ability participants stay productive without slowing the whole cohort.
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            Module pages call out must-keep pacing blocks, engagement checkpoints, and what good outputs look like.
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            Data-led modules now use richer cases and clearer business context to make exercises feel more bank-realistic.
          </div>
        </CardContent>
      </Card>

      {(() => {
        const remainingCount = totalModules - completedCount - activeEnrollments.length;
        const participantInitials = (() => {
          const name = participantSession?.participant.fullName?.trim() ?? "";
          if (!name) return "?";
          const parts = name.split(/\s+/);
          if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        })();

        return (
          <section className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Programme progress</p>
                <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white">
                  {completedCount === totalModules
                    ? "Programme complete"
                    : currentModule
                      ? `Module ${currentModuleIndex + 1} of ${totalModules}`
                      : `${completedCount} of ${totalModules} modules`}
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400">
                  {completedCount === totalModules ? (
                    <>All {totalModules} modules completed. Well done, {participantSession?.participant.fullName}.</>
                  ) : currentModule ? (
                    <>
                      <span className="text-zinc-200">{currentModule.title}</span>
                      <span className="text-zinc-500"> &middot; {programmePercent}% of the programme complete</span>
                    </>
                  ) : (
                    <>{programmePercent}% complete</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative grid h-14 w-14 place-items-center">
                  <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="rgba(52,211,153,0.7)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(programmePercent / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute text-[11px] font-semibold tabular-nums text-white">{programmePercent}%</span>
                </div>
                <Link
                  href={`/academy/${inviteCode}/certificate`}
                  className="whitespace-nowrap rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  View certificate
                </Link>
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] py-1 pl-1 pr-3">
                  <span
                    aria-hidden
                    className="grid size-7 place-items-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-zinc-100 ring-1 ring-white/10"
                  >
                    {participantInitials}
                  </span>
                  <span className="max-w-[160px] truncate text-[12px] text-zinc-200">
                    {participantSession?.participant.fullName}
                  </span>
                </div>
              </div>
            </div>

            <ol className="mt-7 grid auto-cols-[minmax(108px,1fr)] grid-flow-col gap-0 overflow-x-auto pb-2">
              {ajbTrainingProgramme.modules.map((module, index) => {
                const access = moduleAccessBySlug.get(module.slug);
                const prevAccess = index > 0
                  ? moduleAccessBySlug.get(ajbTrainingProgramme.modules[index - 1].slug)
                  : null;
                const isCompleted = access?.enrollmentStatus === "completed";
                const isActive = access?.enrollmentStatus === "in_progress";
                const isCurrent = index === currentModuleIndex;
                const prevCompleted = prevAccess?.enrollmentStatus === "completed";
                const isFirst = index === 0;
                const isLast = index === ajbTrainingProgramme.modules.length - 1;

                const circleTone = isCompleted
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                  : isActive || isCurrent
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-100 ring-4 ring-sky-400/15"
                    : "border-white/10 bg-white/[0.03] text-zinc-500";

                const titleTone = isCompleted
                  ? "text-emerald-100/90"
                  : isCurrent || isActive
                    ? "text-white"
                    : "text-zinc-500";

                const statusCopy = isCompleted
                  ? "Done"
                  : isActive
                    ? `${access?.progressPercent.toFixed(0)}%`
                    : isCurrent
                      ? "Now"
                      : `${module.durationDays}d`;

                return (
                  <li key={module.slug} className="flex min-w-0 flex-col items-stretch gap-2 px-1">
                    <div className="flex items-center">
                      <div
                        className={`h-[2px] flex-1 ${
                          isFirst ? "invisible" : prevCompleted ? "bg-emerald-400/50" : "bg-white/10"
                        }`}
                      />
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums ${circleTone}`}
                      >
                        {isCompleted ? (
                          <svg viewBox="0 0 12 12" aria-hidden className="size-3">
                            <path
                              d="M2.5 6.2 5 8.5 9.5 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div
                        className={`h-[2px] flex-1 ${
                          isLast ? "invisible" : isCompleted ? "bg-emerald-400/50" : "bg-white/10"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 px-0.5 text-center">
                      <p className="truncate text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                        {getModulePhase(module.sequence)}
                      </p>
                      <p className={`mt-1 line-clamp-2 text-[12px] font-medium leading-[1.15] ${titleTone}`}>
                        {module.title}
                      </p>
                      <p
                        className={`mt-1.5 text-[10px] tabular-nums ${
                          isCompleted
                            ? "text-emerald-300/80"
                            : isActive || isCurrent
                              ? "text-sky-300/90"
                              : "text-zinc-600"
                        }`}
                      >
                        {statusCopy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <ProgressStat label="Completed" value={completedCount} accent="emerald" />
              <ProgressStat label="In progress" value={activeEnrollments.length} accent="sky" />
              <ProgressStat label="Remaining" value={remainingCount} accent="zinc" />
            </div>
          </section>
        );
      })()}

      {participantSession?.participant ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
            <CohortFeedPanel
              inviteCode={inviteCode}
              cohortName={cohort.name}
              initialPosts={feedPosts}
              currentParticipantId={participantSession.participant.id}
            />
            <ParticipantProfilePanel participant={participantSession.participant} />
          </div>
          <CopilotStudioPanel
            inviteCode={inviteCode}
            checkInToken={participantSession.participant.checkInToken ?? checkInToken ?? null}
            appUrl={env.appUrl}
            modules={ajbTrainingProgramme.modules.map((module) => ({
              slug: module.slug,
              title: `Module ${module.sequence}: ${module.title}`,
            }))}
            defaultModuleSlug={currentModule?.slug ?? ajbTrainingProgramme.modules[0]?.slug ?? null}
            allowedModels={listParticipantAllowedModels()}
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Your learning path</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-white">All modules</h2>
          </div>
          <p className="text-[11px] text-zinc-500">
            {completedCount} of {totalModules} complete
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {ajbTrainingProgramme.modules.map((module) => {
            const access = moduleAccessBySlug.get(module.slug);
            const canOpen = access?.canOpen ?? module.sequence === 1;
            const isCompleted = access?.enrollmentStatus === "completed";
            const isActive = access?.enrollmentStatus === "in_progress";
            const phase = getPhaseAccent(module.sequence);
            const sequenceLabel = String(module.sequence).padStart(2, "0");

            const cardBorder = isCompleted
              ? "border-emerald-400/20"
              : isActive
                ? "border-sky-400/25"
                : canOpen
                  ? "border-white/10"
                  : "border-white/8";

            return (
              <article
                key={module.slug}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.025] to-white/[0.005] shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:border-white/20 ${cardBorder}`}
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${phase.glow} to-transparent`}
                />
                <div
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${phase.rail}`}
                />

                <header className="relative flex items-start gap-4 px-5 pt-5">
                  <div
                    aria-hidden
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums ring-1 ${phase.badgeBg} ${phase.badgeRing} ${phase.numberText}`}
                  >
                    {sequenceLabel}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className={`text-[10px] font-medium uppercase tracking-[0.18em] ${phase.badgeText}`}>
                        {phase.label}
                      </p>
                      <span aria-hidden className="text-zinc-700">&middot;</span>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        Module {module.sequence} of {totalModules}
                      </p>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold leading-snug tracking-[-0.01em] text-white">
                      {module.title}
                    </h3>
                  </div>
                  {isCompleted ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                      <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />
                      Done
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-sky-400/30 bg-sky-400/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-sky-200">
                      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-sky-300" />
                      Active
                    </span>
                  ) : access?.unlockedByFacilitator ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/25 bg-amber-400/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                      <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />
                      Unlocked
                    </span>
                  ) : !canOpen ? (
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      <LockIcon className="size-3" />
                      Locked
                    </span>
                  ) : null}
                </header>

                <p className="relative mt-3 px-5 text-sm leading-relaxed text-zinc-400">
                  {module.summary}
                </p>

                <div className="relative mx-5 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
                    <ClockIcon className="size-3.5 text-zinc-500" />
                    <span className="tabular-nums">
                      {module.durationDays}
                      {module.durationDays === 1 ? "d" : "d"} &middot; {module.hoursPerDay}h/day
                    </span>
                  </span>
                  <span aria-hidden className="h-3 w-px bg-white/10" />
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
                    <SparkleIcon className="size-3.5 text-zinc-500" />
                    <span className="tabular-nums">{module.keyThemes.length} themes</span>
                  </span>
                  {isActive && typeof access?.progressPercent === "number" ? (
                    <>
                      <span aria-hidden className="h-3 w-px bg-white/10" />
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-sky-200">
                        <span aria-hidden className="size-1.5 rounded-full bg-sky-300" />
                        <span className="tabular-nums">{access.progressPercent.toFixed(0)}% complete</span>
                      </span>
                    </>
                  ) : null}
                </div>

                {module.keyThemes.length > 0 ? (
                  <ul className="relative mx-5 mt-3 flex flex-wrap gap-1.5">
                    {module.keyThemes.slice(0, 4).map((theme) => (
                      <li
                        key={theme}
                        className="rounded-md border border-white/8 bg-white/[0.02] px-2 py-0.5 text-[11px] text-zinc-400"
                      >
                        {theme}
                      </li>
                    ))}
                    {module.keyThemes.length > 4 ? (
                      <li className="rounded-md border border-white/8 bg-white/[0.02] px-2 py-0.5 text-[11px] text-zinc-500">
                        +{module.keyThemes.length - 4} more
                      </li>
                    ) : null}
                  </ul>
                ) : null}

                <div className="relative mx-5 mt-4">
                  <ModuleAcademyUpgrades moduleSlug={module.slug} />
                </div>

                <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-white/[0.01] px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-2 text-[11px] text-zinc-500">
                    {!canOpen ? (
                      <>
                        <LockIcon className="size-3 shrink-0 text-zinc-600" />
                        <span className="truncate">
                          Unlocks after {access?.prerequisiteTitle ?? "the previous module"}
                        </span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />
                        <span>Completed</span>
                      </>
                    ) : isActive ? (
                      <>
                        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-sky-300" />
                        <span>In progress</span>
                      </>
                    ) : access?.unlockedByFacilitator ? (
                      <>
                        <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />
                        <span>Unlocked by facilitator</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden className="size-1.5 rounded-full bg-zinc-500" />
                        <span>Ready to start</span>
                      </>
                    )}
                  </div>
                  {canOpen ? (
                    isActive ? (
                      <Button
                        asChild
                        size="sm"
                        className="group/cta !border-sky-400/30 !bg-sky-400/15 !text-sky-100 hover:!bg-sky-400/25 [&]:!text-sky-100 [&_span]:!text-sky-100 [&_svg]:!text-sky-100"
                      >
                        <Link href={`/academy/${inviteCode}/${module.slug}`}>
                          <span>Continue</span>
                          <ArrowRightIcon className="size-3 transition-transform group-hover/cta:translate-x-0.5" />
                        </Link>
                      </Button>
                    ) : isCompleted ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/academy/${inviteCode}/${module.slug}`}>
                          <span>Review</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href={`/academy/${inviteCode}/${module.slug}`}>
                          <PlayIcon className="size-3" />
                          <span>Start module</span>
                        </Link>
                      </Button>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[12px] font-medium text-zinc-500">
                      <LockIcon className="size-3" />
                      Locked
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
