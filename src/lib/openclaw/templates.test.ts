import { describe, expect, it } from "vitest";

import { renderAgentBootstrapFiles } from "./templates";

describe("openclaw agent bootstrap templates", () => {
  it("renders AGENTS.md with the startup sequence", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Help the user move quickly.",
      org: {
        name: "SaintAGI",
        website: "https://saintagi.com",
        companySummary: "AI workspace software",
        agentBrief: "Stay practical.",
      },
      user: {
        displayName: "Antonio",
        email: "ant@example.com",
        role: "owner",
        whatIDo: "Builds product",
        agentBrief: "Prefers concise updates",
      },
    });

    expect(files.agents).toContain("Read SOUL.md");
    expect(files.agents).toContain("Read USER.md");
    expect(files.agents).toContain("Model:");
  });

  it("renders SOUL.md and USER.md with structured context", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Operate like a strong software engineer.",
      org: {
        name: "SaintAGI",
        website: "https://saintagi.com",
        companySummary: "AI workspace software",
        agentBrief: "Stay practical.",
      },
      user: {
        displayName: "Antonio",
        email: "ant@example.com",
        role: "owner",
        whatIDo: "Builds product",
        agentBrief: "Prefers concise updates",
      },
    });

    expect(files.soul).toContain("Operate like a strong software engineer.");
    expect(files.soul).toContain("## Company Context");
    expect(files.soul).toContain("- Company description: AI workspace software");
    expect(files.soul).toContain("- Brief for agents: Stay practical.");
    expect(files.user).toContain("- Name: Antonio");
    expect(files.user).toContain("- Workspace role: owner");
  });

  it("renders IDENTITY.md so the gateway never falls back to its packaged template", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Help the user move quickly.",
    });

    expect(files.identity).toContain("# IDENTITY.md");
    expect(files.identity).toContain("- **Name:** Alex Agent");
    expect(files.identity).toContain("- **Model:** openrouter/auto");
    // The vendored template uses placeholder strings like
    // `_(pick something you like)_`. A real IDENTITY.md must not ship those.
    expect(files.identity).not.toContain("_(pick something you like)_");
  });

  it("references IDENTITY.md from the AGENTS.md startup sequence", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Help the user move quickly.",
    });

    expect(files.agents).toContain("Read IDENTITY.md");
  });
});
