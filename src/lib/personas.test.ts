import { describe, expect, it } from "vitest";

import { getBuiltInPersonaById, getBuiltInPersonas, mergePersonaCatalog } from "./personas";

describe("persona helpers", () => {
  it("includes the custom persona in the built-in catalog", () => {
    const personas = getBuiltInPersonas();

    expect(personas.some((persona) => persona.id === "custom")).toBe(true);
    expect(personas.every((persona) => persona.source === "builtin")).toBe(true);
  });

  it("finds built-in personas by id", () => {
    expect(getBuiltInPersonaById("software-engineer")?.name).toBe("Software Engineer");
    expect(getBuiltInPersonaById("missing")).toBeNull();
  });

  it("merges built-in and org personas into one catalog", () => {
    const merged = mergePersonaCatalog([
      {
        id: "persona-1",
        orgId: "org-1",
        name: "Finance Analyst",
        description: "Custom org persona",
        instructions: "Help with finance workflows.",
        icon: "calculator",
        createdBy: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        source: "org",
      },
    ]);

    expect(merged.some((persona) => persona.id === "software-engineer")).toBe(true);
    expect(merged.some((persona) => persona.id === "persona-1" && persona.source === "org")).toBe(true);
  });
});
