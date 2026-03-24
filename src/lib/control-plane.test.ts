import { describe, expect, it } from "vitest";

import {
  canSessionAccessAssignment,
  getAuthenticatedHomePath,
  getRoleCapabilities,
} from "./access";
import { calculateNextBalance } from "./billing/math";
import { isBillableModel, requiresWalletBalance } from "./model-pricing";
import { buildObservabilityDedupeKey, projectSessionUsageLogs } from "./observability-shared";
import { buildModelCatalogSnapshotFromDiscovery } from "./openclaw/model-catalog";
import {
  getAgentTerminalConfig,
  normalizeAgentTerminalRepoPaths,
  resolveAgentWorkspaceFromConfig,
} from "./openclaw/agent-terminal";
import { paginateDiscoveryCatalog } from "./openclaw/discovery-pagination";
import { resolveKnowledgeMimeType } from "./knowledge";
import { resolveActiveWorkspace } from "./org-selection";
import { parseAgentSessionKey } from "./openclaw/session-keys";
import { createEmailActionToken, verifyEmailActionToken } from "./email/tokens";
import { renderEmailTemplate } from "./email/templates";
import { canProvisionAnotherAgent, getPlanAgentLimit, getPlanSeatPriceCents } from "./plans";
import { getIsSuperAdmin } from "./super-admin";
import type { CurrentOrgSession } from "../types";

function makeSession(role: CurrentOrgSession["role"], options?: { isSuperAdmin?: boolean }): CurrentOrgSession {
  const isSuperAdmin = options?.isSuperAdmin ?? false;
  return {
    org: {
      id: "org_123",
      name: "Acme",
      slug: "acme",
      plan: "pro",
      created_at: new Date().toISOString(),
    },
    role,
    isSuperAdmin,
    userId: "user_123",
    email: "user@example.com",
    capabilities: getRoleCapabilities(role, { isSuperAdmin }),
  };
}

describe("wallet balance math", () => {
  it("credits increase balance", () => {
    expect(calculateNextBalance(1000, 250, "credit")).toBe(1250);
  });

  it("debits reduce balance", () => {
    expect(calculateNextBalance(1000, 250, "debit")).toBe(750);
  });
});

describe("plan agent limits", () => {
  it("maps plans to agent caps", () => {
    expect(getPlanAgentLimit("starter")).toBe(3);
    expect(getPlanAgentLimit("pro")).toBe(10);
    expect(getPlanAgentLimit("business")).toBe(30);
  });

  it("allows provisioning only while under the plan cap", () => {
    expect(canProvisionAnotherAgent("starter", 2)).toBe(true);
    expect(canProvisionAnotherAgent("starter", 3)).toBe(false);
    expect(canProvisionAnotherAgent("pro", 9)).toBe(true);
    expect(canProvisionAnotherAgent("pro", 10)).toBe(false);
  });

  it("lets super admins bypass plan agent caps", () => {
    expect(canProvisionAnotherAgent("starter", 3, { isSuperAdmin: true })).toBe(true);
    expect(canProvisionAnotherAgent("pro", 99, { isSuperAdmin: true })).toBe(true);
  });

  it("caps active trials at one agent regardless of the paid tier they selected", () => {
    expect(canProvisionAnotherAgent("business", 0, { trialStatus: "active" })).toBe(true);
    expect(canProvisionAnotherAgent("business", 1, { trialStatus: "active" })).toBe(false);
  });

  it("exposes seat pricing for invite billing", () => {
    expect(getPlanSeatPriceCents("starter")).toBe(1200);
    expect(getPlanSeatPriceCents("pro")).toBe(900);
    expect(getPlanSeatPriceCents("business")).toBe(700);
  });
});

describe("super admin detection", () => {
  it("recognizes platform_role metadata", () => {
    expect(
      getIsSuperAdmin({
        app_metadata: {
          platform_role: "super_admin",
        },
      }),
    ).toBe(true);
  });

  it("ignores regular auth metadata", () => {
    expect(
      getIsSuperAdmin({
        app_metadata: {
          provider: "email",
          providers: ["email"],
        },
      }),
    ).toBe(false);
  });
});

describe("model billing classification", () => {
  it("does not require wallet funding for free models", () => {
    expect(
      isBillableModel({
        id: "openrouter/meta-llama/llama-3.3-70b:free",
        label: "Free model",
        provider: "openrouter",
        isFree: true,
        source: "fallback",
      }),
    ).toBe(false);
  });

  it("does not require wallet funding for zero-priced models", () => {
    expect(
      isBillableModel({
        id: "openrouter/google/gemma-3-27b",
        label: "Gemma 3 27B",
        provider: "openrouter",
        inputCostPerMillionCents: 0,
        outputCostPerMillionCents: 0,
        source: "openrouter",
      }),
    ).toBe(false);
  });

  it("treats non-free models as billable", () => {
    expect(
      isBillableModel({
        id: "openrouter/openai/gpt-5-mini",
        label: "GPT-5 Mini",
        provider: "openrouter",
        source: "fallback",
      }),
    ).toBe(true);
  });

  it("keeps openrouter auto behind wallet checks for normal users", () => {
    expect(
      requiresWalletBalance({
        id: "openrouter/auto",
        label: "OpenRouter Auto",
        provider: "openrouter",
        source: "fallback",
      }),
    ).toBe(true);
  });

  it("lets super admins bypass wallet checks for billable models", () => {
    expect(
      requiresWalletBalance(
        {
          id: "openrouter/auto",
          label: "OpenRouter Auto",
          provider: "openrouter",
          source: "fallback",
        },
        { isSuperAdmin: true },
      ),
    ).toBe(false);
  });
});

describe("model catalog snapshot", () => {
  it("preserves free metadata when policy entries are minimal", () => {
    const snapshot = buildModelCatalogSnapshotFromDiscovery(
      {
        default_model: "openrouter/meta-llama/llama-3.3-70b:free",
        approved_models: [
          {
            id: "openrouter/meta-llama/llama-3.3-70b:free",
            label: "Llama 3.3 70B Free",
            provider: "openrouter",
          },
        ],
      },
      [
        {
          id: "openrouter/meta-llama/llama-3.3-70b:free",
          label: "Llama 3.3 70B Free",
          provider: "openrouter",
          inputCostPerMillionCents: 0,
          outputCostPerMillionCents: 0,
          isFree: true,
          source: "openrouter",
        },
      ],
      "openrouter/auto",
    );

    expect(snapshot.defaultModel).toBe("openrouter/meta-llama/llama-3.3-70b:free");
    expect(snapshot.approvedModels).toHaveLength(1);
    expect(snapshot.approvedModels[0]?.isFree).toBe(true);
    expect(snapshot.approvedModels[0]?.inputCostPerMillionCents).toBe(0);
    expect(snapshot.approvedModels[0]?.outputCostPerMillionCents).toBe(0);
  });
});

describe("role capabilities", () => {
  it("owner gets billing and console management", () => {
    const capabilities = getRoleCapabilities("owner");
    expect(capabilities.canManageBilling).toBe(true);
    expect(capabilities.canManageConsole).toBe(true);
    expect(capabilities.canViewAllAgents).toBe(true);
  });

  it("employee cannot manage billing or console", () => {
    const capabilities = getRoleCapabilities("employee");
    expect(capabilities.canManageBilling).toBe(false);
    expect(capabilities.canManageConsole).toBe(false);
    expect(capabilities.canManageAgents).toBe(false);
  });

  it("lets super admins inherit admin capabilities inside a workspace", () => {
    const capabilities = getRoleCapabilities("employee", { isSuperAdmin: true });
    expect(capabilities.canManageBilling).toBe(true);
    expect(capabilities.canManageConsole).toBe(true);
    expect(capabilities.canViewAllAgents).toBe(true);
    expect(capabilities.canManageAdminTools).toBe(true);
  });

  it("routes admins to the dashboard and employees to the workspace", () => {
    expect(getAuthenticatedHomePath("owner")).toBe("/dashboard");
    expect(getAuthenticatedHomePath("admin")).toBe("/dashboard");
    expect(getAuthenticatedHomePath("employee")).toBe("/workspace");
    expect(getAuthenticatedHomePath("member")).toBe("/workspace");
  });

  it("routes super admins to the dashboard even if their workspace role is employee", () => {
    expect(getAuthenticatedHomePath("employee", { isSuperAdmin: true })).toBe("/dashboard");
    expect(getAuthenticatedHomePath("member", { isSuperAdmin: true })).toBe("/dashboard");
  });
});

describe("assignment visibility", () => {
  it("allows employees to see org-wide assignments", () => {
    expect(
      canSessionAccessAssignment(makeSession("employee"), {
        assignee_type: "org",
        assignee_ref: "org_123",
      }),
    ).toBe(true);
  });

  it("allows employees to see direct assignments by user id", () => {
    expect(
      canSessionAccessAssignment(makeSession("employee"), {
        assignee_type: "employee",
        assignee_ref: "user_123",
      }),
    ).toBe(true);
  });

  it("blocks employees from unrelated assignments", () => {
    expect(
      canSessionAccessAssignment(makeSession("employee"), {
        assignee_type: "employee",
        assignee_ref: "someone-else",
      }),
    ).toBe(false);
  });
});

describe("workspace selection", () => {
  const workspaces = [
    {
      org: {
        id: "org_alpha",
        name: "Alpha",
        slug: "alpha",
        plan: "pro",
        created_at: new Date().toISOString(),
      },
      role: "owner" as const,
      capabilities: getRoleCapabilities("owner"),
    },
    {
      org: {
        id: "org_beta",
        name: "Beta",
        slug: "beta",
        plan: "business",
        created_at: new Date().toISOString(),
      },
      role: "employee" as const,
      capabilities: getRoleCapabilities("employee"),
    },
  ];

  it("uses the requested workspace when the user belongs to it", () => {
    expect(resolveActiveWorkspace(workspaces, "org_beta")?.org.id).toBe("org_beta");
  });

  it("falls back to the first workspace when the requested org is missing", () => {
    expect(resolveActiveWorkspace(workspaces, "org_missing")?.org.id).toBe("org_alpha");
  });
});

describe("model catalog pagination", () => {
  const entries = [
    {
      id: "openrouter/auto",
      label: "OpenRouter Auto",
      provider: "openrouter",
      description: "Automatic routing",
      source: "fallback" as const,
    },
    {
      id: "openrouter/openai/gpt-5-mini",
      label: "GPT-5 Mini",
      provider: "openrouter",
      description: "Fast general purpose model",
      source: "fallback" as const,
    },
    {
      id: "openrouter/google/gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      provider: "openrouter",
      description: "Large context model",
      source: "fallback" as const,
    },
  ];

  it("filters catalog entries by search text", () => {
    const page = paginateDiscoveryCatalog(entries, { search: "gemini", page: 1, pageSize: 12 });

    expect(page.total).toBe(1);
    expect(page.entries.map((entry) => entry.id)).toEqual(["openrouter/google/gemini-2.5-pro"]);
  });

  it("returns pagination metadata for later pages", () => {
    const page = paginateDiscoveryCatalog(entries, { page: 2, pageSize: 1 });

    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(1);
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(true);
    expect(page.entries.map((entry) => entry.id)).toEqual(["openrouter/openai/gpt-5-mini"]);
  });
});

describe("knowledge file support", () => {
  it("falls back to the file extension when the browser reports a generic csv mime type", () => {
    expect(resolveKnowledgeMimeType("Sales-Cash (7).csv", "application/vnd.ms-excel")).toBe("text/csv");
  });

  it("accepts markdown files even when the picker leaves mime type empty", () => {
    expect(resolveKnowledgeMimeType("workspace-notes.md", "")).toBe("text/markdown");
  });

  it("rejects unsupported file extensions", () => {
    expect(resolveKnowledgeMimeType("brief.pdf", "application/pdf")).toBeNull();
  });
});

describe("observability projections", () => {
  it("builds stable dedupe keys", () => {
    const first = buildObservabilityDedupeKey(["org_123", "session_usage_logs", "assistant", 123]);
    const second = buildObservabilityDedupeKey(["org_123", "session_usage_logs", "assistant", 123]);

    expect(first).toBe(second);
  });

  it("projects session usage logs into request and activity events", () => {
    const projected = projectSessionUsageLogs({
      orgId: "org_123",
      session: {
        key: "agent:alpha:main",
        modelProvider: "openrouter",
        model: "openrouter/openai/gpt-5-mini",
        channel: "slack",
      },
      agentId: "agent_123",
      actorUserId: "user_123",
      logs: [
        {
          timestamp: 1000,
          role: "user",
          content: "Hello",
        },
        {
          timestamp: 2000,
          role: "assistant",
          content: "Hi there",
          tokens: 42,
          cost: 0.0123,
        },
      ],
    });

    expect(projected.activityEvents).toHaveLength(2);
    expect(projected.requestEvents).toHaveLength(1);
    expect(projected.requestEvents[0]?.totalTokens).toBe(42);
    expect(projected.requestEvents[0]?.costUsd).toBe(0.0123);
    expect(projected.requestEvents[0]?.provider).toBe("openrouter");
    expect(projected.activityEvents[1]?.message).toBe("Hi there");
  });

  it("parses agent-backed session keys", () => {
    expect(parseAgentSessionKey("agent:alpha:main")).toEqual({
      openclawAgentId: "alpha",
      sessionName: "main",
    });
    expect(parseAgentSessionKey("not-a-session-key")).toBeNull();
  });
});

describe("email action tokens", () => {
  it("round-trips unsubscribe payloads", () => {
    const token = createEmailActionToken({
      kind: "unsubscribe",
      orgId: "org_123",
      userId: "user_123",
      email: "alex@example.com",
      preference: "weekly",
    });

    expect(verifyEmailActionToken(token)).toEqual({
      kind: "unsubscribe",
      orgId: "org_123",
      userId: "user_123",
      email: "alex@example.com",
      preference: "weekly",
    });
  });

  it("rejects tampered tokens", () => {
    const token = createEmailActionToken({
      kind: "unsubscribe",
      orgId: "org_123",
      userId: "user_123",
      email: "alex@example.com",
      preference: "marketing",
    });

    expect(verifyEmailActionToken(`${token}tampered`)).toBeNull();
  });
});

describe("email templates", () => {
  it("renders invite billing language for team invites", () => {
    const template = renderEmailTemplate({
      templateKey: "team-invite",
      orgName: "Acme",
      recipientEmail: "joiner@example.com",
      inviterName: "Alex",
      inviteRoleLabel: "Member",
      inviteUrl: "https://example.com/invite/abc",
      billedAmountCents: 900,
    });

    expect(template.category).toBe("transactional");
    expect(template.subject).toContain("Acme");
    expect(template.html).toContain("£9");
  });
});

describe("agent terminal policy", () => {
  it("normalizes repo allowlist entries inside the workspace", () => {
    expect(normalizeAgentTerminalRepoPaths([".", "./repos/app", "repos/docs/"])).toEqual([
      ".",
      "repos/app",
      "repos/docs/",
    ]);
  });

  it("rejects repo allowlist entries that escape the workspace", () => {
    expect(() => normalizeAgentTerminalRepoPaths(["../outside"])).toThrow(
      "Repo allowlist paths must stay inside the agent workspace.",
    );
  });

  it("reads the terminal enabled flag from agent config", () => {
    expect(getAgentTerminalConfig({ terminal: { enabled: true } }).enabled).toBe(true);
    expect(getAgentTerminalConfig({ terminal: { enabled: false } }).enabled).toBe(false);
  });

  it("falls back to the deterministic hosted workspace path for relative legacy configs", () => {
    expect(
      resolveAgentWorkspaceFromConfig({
        orgId: "org_123",
        openClawAgentId: "alpha-agent",
        config: { workspace: "workspaces/alpha-agent" },
        source: "env",
      }),
    ).toBe("/data/workspace/org-123/alpha-agent");
  });
});

