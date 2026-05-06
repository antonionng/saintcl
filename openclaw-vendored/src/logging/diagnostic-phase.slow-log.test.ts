import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLogger } from "./logger.js";

describe("slow diagnostic phase gateway logs", () => {
  const prevEnv = process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS;

  beforeEach(() => {
    process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS = "5";
  });

  afterEach(() => {
    if (prevEnv === undefined) {
      delete process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS;
    } else {
      process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS = prevEnv;
    }
    vi.restoreAllMocks();
  });

  it("warns when reply.preflight-compaction exceeds threshold", async () => {
    const warnSpy = vi.spyOn(getLogger(), "warn").mockImplementation(() => undefined);
    const { resetDiagnosticPhasesForTest, withDiagnosticPhase } = await import("./diagnostic-phase.js");
    resetDiagnosticPhasesForTest();
    await withDiagnosticPhase("reply.preflight-compaction", async () => {
      await new Promise((r) => setTimeout(r, 15));
    });
    expect(warnSpy).toHaveBeenCalled();
    const msg = String(warnSpy.mock.calls[0]?.[1] ?? "");
    expect(msg).toContain("reply.preflight-compaction");
  });

  it("does not warn for attempt.active-session-prompt even when slow", async () => {
    const warnSpy = vi.spyOn(getLogger(), "warn").mockImplementation(() => undefined);
    const { resetDiagnosticPhasesForTest, withDiagnosticPhase } = await import("./diagnostic-phase.js");
    resetDiagnosticPhasesForTest();
    await withDiagnosticPhase("attempt.active-session-prompt", async () => {
      await new Promise((r) => setTimeout(r, 15));
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS is unset", async () => {
    delete process.env.OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS;
    const warnSpy = vi.spyOn(getLogger(), "warn").mockImplementation(() => undefined);
    const { resetDiagnosticPhasesForTest, withDiagnosticPhase } = await import("./diagnostic-phase.js");
    resetDiagnosticPhasesForTest();
    await withDiagnosticPhase("reply.preflight-compaction", async () => {
      await new Promise((r) => setTimeout(r, 15));
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
