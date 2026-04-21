import { describe, expect, it } from "vitest";

import {
  buildLabPersonaSystemPrompt,
  getBeatAddendum,
  getLabCoachPersona,
} from "./training-lab-personas";

describe("training lab personas", () => {
  it("returns one persona per python lab", () => {
    expect(getLabCoachPersona("python-for-data", "lab-a-triage")?.name).toBe(
      "Triage Coach",
    );
    expect(getLabCoachPersona("python-for-data", "lab-b-kpi")?.name).toBe(
      "KPI Coach",
    );
    expect(getLabCoachPersona("python-for-data", "lab-c-pack")?.name).toBe(
      "Exec Pack Coach",
    );
    expect(getLabCoachPersona("python-for-data", "lab-d-handoff")?.name).toBe(
      "Handoff Coach",
    );
  });

  it("returns null for unknown module + checkpoint pairs", () => {
    expect(getLabCoachPersona("python-for-data", "lab-z-unknown")).toBeNull();
    expect(getLabCoachPersona("machine-learning-training", "lab-a-triage")).toBeNull();
    expect(getLabCoachPersona(null, "lab-a-triage")).toBeNull();
    expect(getLabCoachPersona("python-for-data", null)).toBeNull();
  });

  it("appends a beat addendum that names the current beat", () => {
    const persona = getLabCoachPersona("python-for-data", "lab-a-triage");
    expect(persona).not.toBeNull();
    const briefPrompt = buildLabPersonaSystemPrompt(persona!, "brief");
    const verifyPrompt = buildLabPersonaSystemPrompt(persona!, "verify");
    expect(briefPrompt).toContain("Triage Coach");
    expect(briefPrompt).toContain("Current beat: BRIEF");
    expect(verifyPrompt).toContain("Current beat: VERIFY");
    expect(briefPrompt).not.toBe(verifyPrompt);
  });

  it("returns the bare persona prompt when no beat is supplied", () => {
    const persona = getLabCoachPersona("python-for-data", "lab-b-kpi");
    expect(persona).not.toBeNull();
    const prompt = buildLabPersonaSystemPrompt(persona!, null);
    expect(prompt).toContain("KPI Coach");
    expect(prompt).not.toContain("Current beat");
  });

  it("provides a fallback addendum for every beat", () => {
    expect(getBeatAddendum("brief")).toContain("BRIEF");
    expect(getBeatAddendum("engage")).toContain("ENGAGE");
    expect(getBeatAddendum("verify")).toContain("VERIFY");
    expect(getBeatAddendum("defend")).toContain("DEFEND");
  });

  it("includes formatting rules in every persona prompt", () => {
    const persona = getLabCoachPersona("python-for-data", "lab-c-pack");
    expect(persona).not.toBeNull();
    const prompt = buildLabPersonaSystemPrompt(persona!, "engage");
    expect(prompt).toContain("Reply formatting rules");
    expect(prompt).toContain("**bold**");
    expect(prompt).toContain("```python");
  });
});
