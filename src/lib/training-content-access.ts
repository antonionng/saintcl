import { ajbTrainingProgramme } from "@/lib/training";
import { buildParticipantModuleAccessState } from "@/lib/training-access";
import {
  getTrainingModuleUnlockMapByInvite,
  getTrainingModulesForProgramme,
  getTrainingParticipantByCheckInToken,
  getTrainingParticipantSessionsByAuthUser,
} from "@/lib/training-dal";
import { getCurrentPlatformTrainingSession } from "@/lib/platform-training-session";
import { createClient } from "@/lib/supabase/server";
import { getTrainingParticipantCheckInToken } from "@/lib/training-participant-session";
import type { TrainingEnrollmentRecord } from "@/types";

export type TrainingContentAccessResult =
  | {
      ok: true;
      reason: "facilitator" | "participant";
    }
  | {
      ok: false;
      response: Response;
    };

const UNAUTHENTICATED = new Response("Authentication required", {
  status: 401,
  headers: { "cache-control": "no-store" },
});

const FORBIDDEN = new Response("You do not have access to this module", {
  status: 403,
  headers: { "cache-control": "no-store" },
});

type ParticipantSession = {
  cohort: { id: string; programmeId: string; inviteCode?: string | null } | null;
  enrollments: TrainingEnrollmentRecord[];
};

function isModuleInProgramme(moduleSlug: string) {
  return ajbTrainingProgramme.modules.some((module) => module.slug === moduleSlug);
}

async function sessionUnlocksModule(session: ParticipantSession, moduleSlug: string) {
  if (!session.cohort?.inviteCode) {
    return false;
  }

  const [syncedModules, facilitatorUnlocks] = await Promise.all([
    getTrainingModulesForProgramme(session.cohort.programmeId),
    getTrainingModuleUnlockMapByInvite(session.cohort.inviteCode),
  ]);

  const accessStates = buildParticipantModuleAccessState({
    modules: ajbTrainingProgramme.modules,
    syncedModules,
    enrollments: session.enrollments,
    facilitatorUnlocks,
  });

  const access = accessStates.find((state) => state.moduleSlug === moduleSlug);
  return Boolean(access?.canOpen);
}

export async function requireParticipantForModule(moduleSlug: string): Promise<TrainingContentAccessResult> {
  if (!isModuleInProgramme(moduleSlug)) {
    return { ok: false, response: FORBIDDEN };
  }

  const facilitatorSession = await getCurrentPlatformTrainingSession();
  if (facilitatorSession?.canManagePlatformTraining) {
    return { ok: true, reason: "facilitator" };
  }

  const checkInToken = await getTrainingParticipantCheckInToken();
  const cookieSession = checkInToken ? await getTrainingParticipantByCheckInToken(checkInToken) : null;

  if (cookieSession?.cohort && (await sessionUnlocksModule(cookieSession, moduleSlug))) {
    return { ok: true, reason: "participant" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user?.id) {
    return {
      ok: false,
      response: cookieSession ? FORBIDDEN : UNAUTHENTICATED,
    };
  }

  const authSessions = await getTrainingParticipantSessionsByAuthUser({
    authUserId: user.id,
    email: user.email ?? null,
  });

  for (const session of authSessions) {
    if (session?.cohort && (await sessionUnlocksModule(session, moduleSlug))) {
      return { ok: true, reason: "participant" };
    }
  }

  return { ok: false, response: FORBIDDEN };
}
