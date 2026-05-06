import { performance } from "node:perf_hooks";
import {
  areDiagnosticsEnabledForProcess,
  emitDiagnosticEvent,
  type DiagnosticPhaseDetails,
  type DiagnosticPhaseSnapshot,
} from "../infra/diagnostic-events.js";
import { getLogger } from "./logger.js";

const RECENT_PHASE_CAPACITY = 40;

/** Embedded phases whose duration mostly reflects the user-visible LLM call (exclude from slow-phase warnings). */
const ATTEMPT_MODEL_PHASE_PREFIX = "attempt.active-session-prompt";

function resolveSlowDiagnosticPhaseThresholdMs(): number | undefined {
  const raw = process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS?.trim();
  if (!raw || raw === "0" || raw.toLowerCase() === "off" || raw.toLowerCase() === "false") {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function shouldEmitSlowDiagnosticPhaseLog(phaseName: string): boolean {
  if (phaseName === "reply.preflight-compaction" || phaseName === "reply.memory-flush") {
    return true;
  }
  if (phaseName.startsWith("attempt.") && !phaseName.startsWith(ATTEMPT_MODEL_PHASE_PREFIX)) {
    return true;
  }
  return false;
}

function maybeWarnSlowDiagnosticPhase(snapshot: DiagnosticPhaseSnapshot): void {
  const thresholdMs = resolveSlowDiagnosticPhaseThresholdMs();
  if (thresholdMs === undefined || snapshot.durationMs < thresholdMs) {
    return;
  }
  if (!shouldEmitSlowDiagnosticPhaseLog(snapshot.name)) {
    return;
  }
  try {
    getLogger().warn(
      {
        phase: snapshot.name,
        durationMs: snapshot.durationMs,
        cpuTotalMs: snapshot.cpuTotalMs,
      },
      `slow diagnostic phase phase=${snapshot.name} wallMs=${snapshot.durationMs} (OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS)`,
    );
  } catch {
    // Ignore logger failures: diagnostics must never break the reply pipeline.
  }
}

type ActiveDiagnosticPhase = {
  name: string;
  startedAt: number;
  startedWallMs: number;
  cpuStarted: NodeJS.CpuUsage;
  details?: DiagnosticPhaseDetails;
};

let activePhaseStack: ActiveDiagnosticPhase[] = [];
let recentPhases: DiagnosticPhaseSnapshot[] = [];

function roundMetric(value: number, digits = 1): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pushRecentPhase(snapshot: DiagnosticPhaseSnapshot): void {
  recentPhases.push(snapshot);
  if (recentPhases.length > RECENT_PHASE_CAPACITY) {
    recentPhases = recentPhases.slice(-RECENT_PHASE_CAPACITY);
  }
}

export function getCurrentDiagnosticPhase(): string | undefined {
  return activePhaseStack.at(-1)?.name;
}

export function getRecentDiagnosticPhases(limit = 8): DiagnosticPhaseSnapshot[] {
  return recentPhases.slice(-Math.max(0, limit)).map((phase) => Object.assign({}, phase));
}

export function recordDiagnosticPhase(snapshot: DiagnosticPhaseSnapshot): void {
  pushRecentPhase(snapshot);
  maybeWarnSlowDiagnosticPhase(snapshot);
  if (!areDiagnosticsEnabledForProcess()) {
    return;
  }
  emitDiagnosticEvent({
    type: "diagnostic.phase.completed",
    ...snapshot,
  });
}

export async function withDiagnosticPhase<T>(
  name: string,
  run: () => Promise<T> | T,
  details?: DiagnosticPhaseDetails,
): Promise<T> {
  const active: ActiveDiagnosticPhase = {
    name,
    startedAt: Date.now(),
    startedWallMs: performance.now(),
    cpuStarted: process.cpuUsage(),
    details,
  };
  activePhaseStack.push(active);
  try {
    return await run();
  } finally {
    const endedAt = Date.now();
    const durationMs = roundMetric(performance.now() - active.startedWallMs, 1);
    const cpu = process.cpuUsage(active.cpuStarted);
    const cpuUserMs = roundMetric(cpu.user / 1_000, 1);
    const cpuSystemMs = roundMetric(cpu.system / 1_000, 1);
    const cpuTotalMs = roundMetric(cpuUserMs + cpuSystemMs, 1);
    activePhaseStack = activePhaseStack.filter((entry) => entry !== active);
    recordDiagnosticPhase({
      name,
      startedAt: active.startedAt,
      endedAt,
      durationMs,
      cpuUserMs,
      cpuSystemMs,
      cpuTotalMs,
      cpuCoreRatio: roundMetric(cpuTotalMs / Math.max(1, durationMs), 3),
      details: active.details,
    });
  }
}

export function resetDiagnosticPhasesForTest(): void {
  activePhaseStack = [];
  recentPhases = [];
}
