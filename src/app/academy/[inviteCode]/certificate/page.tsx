import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ajbTrainingProgramme } from "@/lib/training";
import { createClient } from "@/lib/supabase/server";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";
import {
  evaluateCertificateEligibility,
  getCertificateForParticipant,
  getTrainingCohortByInviteCode,
  getTrainingParticipantByCheckInToken,
  getTrainingParticipantByInviteForAuthUser,
  issueCertificateIfEligible,
} from "@/lib/training-dal";

function formatDate(value: string | null) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export default async function AcademyCertificatePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const cohort = await getTrainingCohortByInviteCode(inviteCode);
  if (!cohort) {
    redirect(`/academy/${inviteCode}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieParticipantSession = checkInToken
    ? await getTrainingParticipantByCheckInToken(checkInToken)
    : null;
  const authParticipantSession = user
    ? await getTrainingParticipantByInviteForAuthUser({
        inviteCode,
        authUserId: user.id,
        email: user.email ?? null,
      })
    : null;
  const participantSession =
    cookieParticipantSession?.cohort?.id === cohort.id
      ? cookieParticipantSession
      : authParticipantSession;

  if (!participantSession || participantSession.cohort?.id !== cohort.id) {
    redirect(`/academy/${inviteCode}`);
  }

  const participant = participantSession.participant;

  let certificate = await getCertificateForParticipant({
    programmeId: cohort.programmeId,
    participantId: participant.id,
  });

  if (!certificate) {
    const issuance = await issueCertificateIfEligible({
      participantId: participant.id,
      programmeId: cohort.programmeId,
      cohortId: cohort.id,
      orgId: participant.orgId ?? cohort.orgId ?? null,
    });
    certificate = issuance?.certificate ?? null;
  }

  const eligibility = await evaluateCertificateEligibility({
    participantId: participant.id,
    programmeId: cohort.programmeId,
  });

  const issuedAt = certificate ? formatDate(certificate.issuedAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Programme certificate"
        title={
          certificate
            ? `Certificate of completion - ${ajbTrainingProgramme.name}`
            : "Certificate not yet available"
        }
        description={
          certificate
            ? `Awarded to ${participant.fullName} for completing ${eligibility.modulesTotal} of ${eligibility.modulesTotal} module assessments.`
            : `Pass every end-of-module test in this programme to unlock your certificate. ${eligibility.modulesPassed} of ${eligibility.modulesTotal} module tests passed.`
        }
      />

      {certificate ? (
        <Card className="border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.06),rgba(16,185,129,0.02))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">{ajbTrainingProgramme.name}</CardTitle>
            <CardDescription>
              Issued {issuedAt ?? "recently"} - serial {certificate.serial}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">This certifies that</p>
              <p className="mt-2 text-3xl font-semibold text-white">{participant.fullName}</p>
              <p className="mt-3 text-sm text-zinc-300">
                has successfully completed every module assessment in {ajbTrainingProgramme.name}, demonstrating
                proficiency across the technical, analytical, and communication competencies required for the
                programme.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Cohort</p>
                  <p className="mt-1 text-sm text-zinc-200">{cohort.name ?? "AJB cohort"}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Issued</p>
                  <p className="mt-1 text-sm text-zinc-200">{issuedAt ?? "Recently"}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Module results
              </h2>
              <div className="mt-3 space-y-2">
                {certificate.moduleBreakdown.map((entry) => (
                  <div
                    key={entry.moduleSlug}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-zinc-100">{entry.moduleTitle}</p>
                      <p className="text-[11px] text-zinc-500">{entry.moduleSlug}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-zinc-400">
                        {entry.score === null ? "Score unavailable" : `${Math.round(entry.score)}%`}
                      </span>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1 text-emerald-100">
                        Passed {formatDate(entry.passedAt) ?? ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/academy/${inviteCode}`}
                className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Back to academy
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/8 bg-black/10">
          <CardHeader className="pb-3">
            <CardTitle>Keep going</CardTitle>
            <CardDescription>
              Complete every end-of-module test to unlock your certificate. Your facilitator may need to review
              short-answer responses before a module is marked passed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligibility.breakdown.map((entry) => {
              const passed = Boolean(entry.passedAt);
              return (
                <div
                  key={entry.moduleSlug}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-zinc-100">{entry.moduleTitle}</p>
                    <p className="text-[11px] text-zinc-500">{entry.moduleSlug}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      passed
                        ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
                        : "border-white/10 bg-white/[0.04] text-zinc-300"
                    }`}
                  >
                    {passed
                      ? `Passed ${formatDate(entry.passedAt) ?? ""}`
                      : entry.score === null
                        ? "Module test pending"
                        : `Best score ${Math.round(entry.score)}%`}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/academy/${inviteCode}`}
                className="inline-flex justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Back to academy
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
