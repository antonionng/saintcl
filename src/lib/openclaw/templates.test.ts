import { describe, expect, it } from "vitest";

import { renderAgentBootstrapFiles, renderTenantOpenClawConfig } from "./templates";

describe("openclaw agent bootstrap templates", () => {
  it("configures managed runtimes to use SaintAGI bootstrap files", () => {
    const config = JSON.parse(
      renderTenantOpenClawConfig(
        {
          id: "rt_org",
          orgId: "org_1",
          gatewayPort: 18000,
          gatewayUrl: "ws://127.0.0.1:18000",
          vendorPath: "/repo/openclaw-vendored",
          status: "stopped",
          paths: {
            root: "/runtime/org_1",
            stateRoot: "/runtime/org_1/state",
            configDir: "/runtime/org_1/config",
            configPath: "/runtime/org_1/config/openclaw.json",
            workspaceRoot: "/runtime/org_1/workspaces",
            logsDir: "/runtime/org_1/logs",
            gatewayLogPath: "/runtime/org_1/logs/gateway.log",
            metadataPath: "/runtime/org_1/runtime.json",
          },
        },
        {
          orgId: "org_1",
          defaultModel: "openrouter/auto",
          approvedModels: [{ id: "openrouter/auto", label: "Auto" }],
        },
      ),
    ) as { agents: { defaults: { skipBootstrap?: boolean } } };

    expect(config.agents.defaults.skipBootstrap).toBe(true);
  });

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

  it("renders HEARTBEAT.md with platform-owned status and a no-rewrite hint", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Help the user move quickly.",
      org: { name: "SaintAGI" },
      user: { displayName: "Antonio" },
    });

    expect(files.heartbeat).toContain("# HEARTBEAT.md");
    expect(files.heartbeat).toContain("Saint AGI control plane");
    expect(files.heartbeat).toContain("Org: SaintAGI");
    expect(files.heartbeat).toContain("Working with: Antonio");
    expect(files.heartbeat).toContain("Do not rewrite it inside a customer chat turn");
  });

  it("instructs the agent not to self-optimize during a chat turn", () => {
    const files = renderAgentBootstrapFiles({
      agentId: "agent-1",
      name: "Alex Agent",
      model: "openrouter/auto",
      persona: "Help the user move quickly.",
    });

    expect(files.soul).toContain("Do not run setup, provisioning, or self-optimization steps");
    expect(files.soul).toContain("Do not attempt to enable, disable, or reconfigure memorySearch");
    expect(files.tools).toContain("Do not call gateway control-plane RPCs");
    expect(files.agents).toContain("Never run provisioning or self-optimization steps inside a chat");
  });
});
