import { describe, expect, it } from "vitest";

import { buildFallbackSummary, parseStructuredSummary } from "./org-website-enrichment";

describe("parseStructuredSummary", () => {
  it("parses a clean JSON object with all fields", () => {
    const raw = JSON.stringify({
      companySummary: "Acme makes widgets.",
      agentBrief: "Talk like a pragmatic Acme rep.",
      knowledgeMarkdown: "# Acme\n\nAcme makes widgets for retailers.",
    });

    const result = parseStructuredSummary(raw);
    expect(result).not.toBeNull();
    expect(result?.companySummary).toBe("Acme makes widgets.");
    expect(result?.agentBrief).toBe("Talk like a pragmatic Acme rep.");
    expect(result?.knowledgeMarkdown).toContain("# Acme");
  });

  it("strips fenced code blocks before parsing", () => {
    const raw = "```json\n" + JSON.stringify({
      companySummary: "Beta sells SaaS.",
      agentBrief: "Speak confidently about Beta.",
      knowledgeMarkdown: "# Beta\n\nBeta sells SaaS to mid-market teams.",
    }) + "\n```";

    const result = parseStructuredSummary(raw);
    expect(result?.companySummary).toBe("Beta sells SaaS.");
  });

  it("falls back to companySummary when agentBrief is missing", () => {
    const raw = JSON.stringify({
      companySummary: "Gamma is a logistics network.",
      agentBrief: "",
      knowledgeMarkdown: "# Gamma\n\nGamma is a logistics network across Europe.",
    });

    const result = parseStructuredSummary(raw);
    expect(result?.agentBrief).toBe("Gamma is a logistics network.");
  });

  it("returns null when companySummary is missing", () => {
    const raw = JSON.stringify({ agentBrief: "x", knowledgeMarkdown: "y" });
    expect(parseStructuredSummary(raw)).toBeNull();
  });

  it("returns null on invalid JSON", () => {
    expect(parseStructuredSummary("not json at all")).toBeNull();
    expect(parseStructuredSummary(null)).toBeNull();
  });
});

describe("buildFallbackSummary", () => {
  it("returns a non-null summary when homepage text is long enough", () => {
    const text =
      "Delta Robotics builds factory-floor robots for the food industry. We help bakeries automate packaging with safe collaborative arms.";
    const result = buildFallbackSummary(text, "https://delta.example");
    expect(result).not.toBeNull();
    expect(result?.companySummary.length).toBeGreaterThan(0);
    expect(result?.agentBrief.length).toBeGreaterThan(0);
    expect(result?.knowledgeMarkdown).toContain("https://delta.example");
  });

  it("returns null when homepage text is too short", () => {
    expect(buildFallbackSummary("hello", "https://x.example")).toBeNull();
  });
});
