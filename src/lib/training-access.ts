import type { TrainingEnrollmentRecord, TrainingModuleRecord } from "@/types";
import type { TrainingModuleBlueprint } from "@/lib/training";

export type ParticipantModuleAccessState = {
  moduleSlug: string;
  canOpen: boolean;
  unlockedByFacilitator: boolean;
  unlockedByCompletion: boolean;
  hasExistingAccess: boolean;
  prerequisiteTitle: string | null;
  enrollmentStatus: TrainingEnrollmentRecord["status"] | "not_started";
  progressPercent: number;
};

export function buildParticipantModuleAccessState(input: {
  modules: TrainingModuleBlueprint[];
  syncedModules: TrainingModuleRecord[];
  enrollments: TrainingEnrollmentRecord[];
  facilitatorUnlocks: Record<string, boolean>;
}) {
  const moduleIdBySlug = new Map(input.syncedModules.map((module) => [module.slug, module.id]));
  const enrollmentByModuleId = new Map(input.enrollments.map((enrollment) => [enrollment.moduleId, enrollment]));

  return input.modules.map((module, index) => {
    const currentModuleId = moduleIdBySlug.get(module.slug);
    const currentEnrollment = currentModuleId ? enrollmentByModuleId.get(currentModuleId) : undefined;
    const previousModule = index > 0 ? input.modules[index - 1] : null;
    const previousModuleId = previousModule ? moduleIdBySlug.get(previousModule.slug) : undefined;
    const previousEnrollment = previousModuleId ? enrollmentByModuleId.get(previousModuleId) : undefined;

    const sequentialUnlock = index === 0 || previousEnrollment?.status === "completed";
    const rawUnlockedByFacilitator = input.facilitatorUnlocks[module.slug] === true;
    const hasExistingAccess = Boolean(currentEnrollment);
    const hasStarted =
      currentEnrollment?.status === "in_progress" || currentEnrollment?.status === "completed";

    // Module-level participant access policy. "open" forces the module open
    // for every checked-in participant. "locked" is a hard global lock: it
    // overrides sequential unlocks AND any per-cohort facilitator unlocks so
    // participants cannot open it even if a facilitator previously toggled
    // it on. To release a locked module, change its blueprint policy.
    const policy = module.participantAccess;
    const unlockedByCompletion = policy === "locked" ? false : sequentialUnlock;
    const unlockedByFacilitator = policy === "locked" ? false : rawUnlockedByFacilitator;

    let canOpen: boolean;
    if (policy === "open") {
      canOpen = true;
    } else if (policy === "locked") {
      canOpen = false;
    } else {
      canOpen = sequentialUnlock || unlockedByFacilitator || hasStarted;
    }

    return {
      moduleSlug: module.slug,
      canOpen,
      unlockedByFacilitator,
      unlockedByCompletion,
      hasExistingAccess,
      prerequisiteTitle: previousModule?.title ?? null,
      enrollmentStatus: currentEnrollment?.status ?? "not_started",
      progressPercent: currentEnrollment?.progressPercent ?? 0,
    } satisfies ParticipantModuleAccessState;
  });
}
