import { env } from "@/lib/env";
import type { TrainingCohortRecord } from "@/types";

export type TrainingUxUnifiedResolution = {
  enabled: boolean;
  reason: "global-on" | "cohort-opt-in" | "cohort-opt-out" | "default-on";
};

const UNIFIED_FEATURE_KEY = "trainingUxUnified";

function readUnifiedCohortOptIn(
  cohort: TrainingCohortRecord | null | undefined,
): boolean | null {
  if (!cohort) return null;
  const features = cohort.metadata?.featureFlags as
    | Record<string, unknown>
    | undefined;
  if (features && typeof features === "object") {
    const value = features[UNIFIED_FEATURE_KEY];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value === "on" || value === "true" || value === "enabled") return true;
      if (value === "off" || value === "false" || value === "disabled") return false;
    }
  }
  const direct = cohort.metadata?.[UNIFIED_FEATURE_KEY];
  if (typeof direct === "boolean") return direct;
  return null;
}

export function resolveTrainingUxUnified(input: {
  cohort?: TrainingCohortRecord | null;
}): TrainingUxUnifiedResolution {
  const cohortOptIn = readUnifiedCohortOptIn(input.cohort ?? null);
  const mode = env.trainingUxUnifiedMode;

  if (mode === "off") {
    if (cohortOptIn === true) {
      return { enabled: true, reason: "cohort-opt-in" };
    }
    return { enabled: false, reason: "default-on" };
  }

  if (cohortOptIn === false) {
    return { enabled: false, reason: "cohort-opt-out" };
  }

  return { enabled: true, reason: cohortOptIn ? "cohort-opt-in" : "global-on" };
}

export function isTrainingUxUnifiedEnabled(input: {
  cohort?: TrainingCohortRecord | null;
}): boolean {
  return resolveTrainingUxUnified(input).enabled;
}
