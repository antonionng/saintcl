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

    const unlockedByCompletion = index === 0 || previousEnrollment?.status === "completed";
    const unlockedByFacilitator = input.facilitatorUnlocks[module.slug] === true;
    const hasExistingAccess = Boolean(currentEnrollment);
    const canOpen = index === 0 || unlockedByCompletion || unlockedByFacilitator || hasExistingAccess;

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
