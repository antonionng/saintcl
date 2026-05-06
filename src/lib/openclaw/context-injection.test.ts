import { describe, expect, it } from "vitest";

import { buildKnowledgeFilePath } from "./context-injection";

describe("buildKnowledgeFilePath", () => {
  it("scopes org documents under knowledge/company", () => {
    expect(buildKnowledgeFilePath("org", "doc-1", "Brand Voice")).toBe(
      "knowledge/company/doc-1-Brand-Voice.md",
    );
  });

  it("scopes team documents under knowledge/team", () => {
    expect(buildKnowledgeFilePath("team", "doc-2", "Roadmap")).toBe(
      "knowledge/team/doc-2-Roadmap.md",
    );
  });

  it("scopes user documents under knowledge/personal", () => {
    expect(buildKnowledgeFilePath("user", "doc-3", "Notes")).toBe(
      "knowledge/personal/doc-3-Notes.md",
    );
  });

  it("does not double the .md extension when the source filename already ends in .md", () => {
    // Regression: previously generated `website-profile.md.md`, which the
    // OpenClaw gateway file allowlist rejected with `unsupported file ...`.
    expect(buildKnowledgeFilePath("org", "doc-x", "website-profile.md")).toBe(
      "knowledge/company/doc-x-website-profile.md",
    );
  });

  it("strips arbitrary upload extensions before appending .md", () => {
    expect(buildKnowledgeFilePath("org", "doc-y", "playbook.docx")).toBe(
      "knowledge/company/doc-y-playbook.md",
    );
    expect(buildKnowledgeFilePath("team", "doc-z", "report.PDF")).toBe(
      "knowledge/team/doc-z-report.md",
    );
  });

  it("sanitizes unsafe characters into hyphens", () => {
    expect(buildKnowledgeFilePath("org", "doc-1", "Q1 / Q2 plan!")).toBe(
      "knowledge/company/doc-1-Q1-Q2-plan-.md",
    );
  });

  it("falls back to a stable stem when the filename is only an extension", () => {
    expect(buildKnowledgeFilePath("org", "doc-1", ".md")).toBe(
      "knowledge/company/doc-1-doc.md",
    );
  });
});
