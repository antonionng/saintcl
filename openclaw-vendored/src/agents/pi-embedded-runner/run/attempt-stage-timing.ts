export type EmbeddedRunStageTiming = {
  name: string;
  durationMs: number;
  elapsedMs: number;
};

export type EmbeddedRunStageSummary = {
  totalMs: number;
  stages: EmbeddedRunStageTiming[];
};

export type EmbeddedRunStageTracker = {
  mark: (name: string) => void;
  snapshot: () => EmbeddedRunStageSummary;
};

// Real Chat Latency: lowered defaults so the prep / startup stage summaries
// surface in production logs whenever a turn would already feel slow to the
// user. The previous defaults (10s total / 5s any stage) only logged when
// things had gone catastrophically wrong, hiding the 4-9s tail we're trying
// to fix. Override with OPENCLAW_STAGE_WARN_TOTAL_MS /
// OPENCLAW_STAGE_WARN_STAGE_MS if you need looser thresholds.
const FALLBACK_STAGE_WARN_TOTAL_MS = 1_500;
const FALLBACK_STAGE_WARN_STAGE_MS = 500;
function resolveEnvMs(envVar: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[envVar]?.trim() ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
const EMBEDDED_RUN_STAGE_WARN_TOTAL_MS = resolveEnvMs(
  "OPENCLAW_STAGE_WARN_TOTAL_MS",
  FALLBACK_STAGE_WARN_TOTAL_MS,
);
const EMBEDDED_RUN_STAGE_WARN_STAGE_MS = resolveEnvMs(
  "OPENCLAW_STAGE_WARN_STAGE_MS",
  FALLBACK_STAGE_WARN_STAGE_MS,
);

export function createEmbeddedRunStageTracker(options?: {
  now?: () => number;
}): EmbeddedRunStageTracker {
  const now = options?.now ?? Date.now;
  const startedAt = now();
  let previousAt = startedAt;
  const stages: EmbeddedRunStageTiming[] = [];

  const toMs = (value: number) => Math.max(0, Math.round(value));

  return {
    mark(name) {
      const currentAt = now();
      stages.push({
        name,
        durationMs: toMs(currentAt - previousAt),
        elapsedMs: toMs(currentAt - startedAt),
      });
      previousAt = currentAt;
    },
    snapshot() {
      return {
        totalMs: toMs(now() - startedAt),
        stages: stages.slice(),
      };
    },
  };
}

export function shouldWarnEmbeddedRunStageSummary(
  summary: EmbeddedRunStageSummary,
  options?: {
    totalThresholdMs?: number;
    stageThresholdMs?: number;
  },
): boolean {
  const totalThresholdMs = options?.totalThresholdMs ?? EMBEDDED_RUN_STAGE_WARN_TOTAL_MS;
  const stageThresholdMs = options?.stageThresholdMs ?? EMBEDDED_RUN_STAGE_WARN_STAGE_MS;
  return (
    summary.totalMs >= totalThresholdMs ||
    summary.stages.some((stage) => stage.durationMs >= stageThresholdMs)
  );
}

export function formatEmbeddedRunStageSummary(
  prefix: string,
  summary: EmbeddedRunStageSummary,
): string {
  const stages =
    summary.stages.length > 0
      ? summary.stages
          .map((stage) => `${stage.name}:${stage.durationMs}ms@${stage.elapsedMs}ms`)
          .join(",")
      : "none";
  return `${prefix} totalMs=${summary.totalMs} stages=${stages}`;
}
