import { describe, expect, it } from "vitest";

import {
  canSessionAccessAssignment,
  getAuthenticatedHomePath,
  getRoleCapabilities,
} from "./access";
import {
  BillingGateError,
  billingGateErrorToJson,
  isBillingGateError,
} from "./billing/errors";
import { applyLlmUsageMarkup, calculateNextBalance, LLM_USAGE_MARKUP_PERCENT } from "./billing/math";
import { isBillableModel, requiresWalletBalance } from "./model-pricing";
import { buildObservabilityDedupeKey, projectSessionUsageLogs } from "./observability-shared";
import {
  buildModelCatalogSnapshotFromDiscovery,
  restrictSnapshotToTrialFreeModels,
} from "./openclaw/model-catalog";
import {
  buildManagedAgentRuntimeConfigPatch,
  channelAgentBindingMatchesSnapshot,
  managedAgentRuntimeConfigMatchesSnapshot,
  whatsappAgentBindingMatchesSnapshot,
} from "./openclaw/client";
import {
  GatewayAssignmentDriftError,
  resolveTenantGatewayAssignmentFromRow,
} from "./openclaw/gateway-assignments";
import {
  getAgentTerminalConfig,
  normalizeAgentTerminalRepoPaths,
  resolveAgentWorkspaceFromConfig,
} from "./openclaw/agent-terminal";
import {
  assertAdminRole,
  assertCommandAllowed,
  assertRepoAllowed,
} from "./openclaw/terminal-policy";
import { paginateDiscoveryCatalog } from "./openclaw/discovery-pagination";
import { resolveKnowledgeMimeType } from "./knowledge";
import { resolveActiveWorkspace, sortWorkspaceMemberships } from "./org-selection";
import { agentSessionKeyBelongsToAgent, parseAgentSessionKey } from "./openclaw/session-keys";
import { createEmailActionToken, verifyEmailActionToken } from "./email/tokens";
import { renderEmailTemplate } from "./email/templates";
import {
  canProvisionAnotherAgent,
  getPlanAgentLimit,
  getPlanSeatPriceCents,
  hasTrialMessageCapacity,
  isTrialModelRestrictionActive,
  TRIAL_LENGTH_DAYS,
  TRIAL_MESSAGE_LIMIT,
} from "./plans";
import { getIsSuperAdmin } from "./super-admin";
import type { CurrentOrgSession } from "../types";

function makeSession(
  role: CurrentOrgSession["role"],
  options?: { isSuperAdmin?: boolean; teamIds?: string[] },
): CurrentOrgSession {
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
    teamIds: options?.teamIds ?? [],
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

  it("applies the platform LLM usage margin", () => {
    expect(LLM_USAGE_MARKUP_PERCENT).toBe(30);
    expect(applyLlmUsageMarkup(100)).toBe(130);
    expect(applyLlmUsageMarkup(101)).toBe(132);
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

  it("keeps active trials short and message capped", () => {
    const activeTrial = { trialStatus: "active", trialEndsAt: new Date(Date.now() + 60_000).toISOString() };
    expect(TRIAL_LENGTH_DAYS).toBe(7);
    expect(TRIAL_MESSAGE_LIMIT).toBe(150);
    expect(hasTrialMessageCapacity(149, activeTrial)).toBe(true);
    expect(hasTrialMessageCapacity(150, activeTrial)).toBe(false);
  });

  it("restricts non-super-admin active trials to free models", () => {
    const activeTrial = { trialStatus: "active", trialEndsAt: new Date(Date.now() + 60_000).toISOString() };
    expect(isTrialModelRestrictionActive(activeTrial)).toBe(true);
    expect(isTrialModelRestrictionActive({ ...activeTrial, isSuperAdmin: true })).toBe(false);
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

  it("recognizes the support super admin email allowlist", () => {
    expect(getIsSuperAdmin({ email: "ag@expert.com", app_metadata: {} })).toBe(true);
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
        id: "openrouter/openrouter/free",
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
        default_model: "openrouter/openrouter/free",
        approved_models: [
          {
            id: "openrouter/openrouter/free",
            label: "OpenRouter Free Models Router",
            provider: "openrouter",
          },
        ],
      },
      [
        {
          id: "openrouter/openrouter/free",
          label: "OpenRouter Free Models Router",
          provider: "openrouter",
          inputCostPerMillionCents: 0,
          outputCostPerMillionCents: 0,
          isFree: true,
          source: "openrouter",
        },
      ],
      "openrouter/auto",
    );

    expect(snapshot.defaultModel).toBe("openrouter/openrouter/free");
    expect(snapshot.approvedModels).toHaveLength(1);
    expect(snapshot.approvedModels[0]?.isFree).toBe(true);
    expect(snapshot.approvedModels[0]?.inputCostPerMillionCents).toBe(0);
    expect(snapshot.approvedModels[0]?.outputCostPerMillionCents).toBe(0);
  });
});

describe("usage alert email copy", () => {
  it("renders trial warning alerts", () => {
    const rendered = renderEmailTemplate({
      templateKey: "usage-alert",
      orgName: "Acme",
      usageAlert: {
        kind: "trial-warning",
        trialMessageCount: 130,
        trialMessageLimit: 150,
      },
    });

    expect(rendered.subject).toContain("close to the trial message limit");
    expect(rendered.text).toContain("130 of 150");
  });

  it("renders low wallet alerts", () => {
    const rendered = renderEmailTemplate({
      templateKey: "usage-alert",
      orgName: "Acme",
      usageAlert: {
        kind: "wallet-low",
        walletBalanceCents: 900,
        lowBalanceThresholdCents: 2000,
      },
    });

    expect(rendered.subject).toContain("wallet balance is low");
    expect(rendered.text).toContain("£9");
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

  it("routes authenticated users to the workspace", () => {
    expect(getAuthenticatedHomePath("owner")).toBe("/workspace");
    expect(getAuthenticatedHomePath("admin")).toBe("/workspace");
    expect(getAuthenticatedHomePath("employee")).toBe("/workspace");
    expect(getAuthenticatedHomePath("member")).toBe("/workspace");
  });

  it("routes super admins to the same workspace-first home", () => {
    expect(getAuthenticatedHomePath("employee", { isSuperAdmin: true })).toBe("/workspace");
    expect(getAuthenticatedHomePath("member", { isSuperAdmin: true })).toBe("/workspace");
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

  it("allows employees to see assignments for their teams", () => {
    expect(
      canSessionAccessAssignment(makeSession("employee", { teamIds: ["team_123"] }), {
        assignee_type: "team",
        assignee_ref: "team_123",
      }),
    ).toBe(true);
  });

  it("blocks employees from unrelated team assignments", () => {
    expect(
      canSessionAccessAssignment(makeSession("employee", { teamIds: ["team_123"] }), {
        assignee_type: "team",
        assignee_ref: "team_456",
      }),
    ).toBe(false);
  });
});

describe("workspace selection", () => {
  const workspaces = [
    {
      org: {
        id: "org_alpha",
        name: "Saint",
        slug: "alpha",
        plan: "pro",
        created_at: "2026-01-01T00:00:00.000Z",
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
        created_at: "2026-02-01T00:00:00.000Z",
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

  it("orders fallback workspaces by creation time before name", () => {
    expect(sortWorkspaceMemberships([...workspaces].reverse()).map((workspace) => workspace.org.id)).toEqual([
      "org_alpha",
      "org_beta",
    ]);
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

  it("accepts PDF files", () => {
    expect(resolveKnowledgeMimeType("brief.pdf", "application/pdf")).toBe("application/pdf");
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

  it("rejects session keys owned by a different agent", () => {
    expect(agentSessionKeyBelongsToAgent("agent:alpha:main", "alpha")).toBe(true);
    expect(agentSessionKeyBelongsToAgent("agent:beta:main", "alpha")).toBe(false);
    expect(agentSessionKeyBelongsToAgent("main", "alpha")).toBe(false);
  });
});

describe("managed OpenClaw agent isolation config", () => {
  it("upserts one managed agent without dropping sibling agents or channel bindings", () => {
    const patch = buildManagedAgentRuntimeConfigPatch(
      {
        agentId: "agent_alpha",
        workspace: "/runtime/org_123/agents/agent_alpha",
        model: "openrouter/anthropic/claude-4.5-haiku",
        name: "Alpha",
      },
      {
        hash: "hash_123",
        config: {
          agents: {
            list: [
              { id: "agent_beta", workspace: "/runtime/org_123/agents/agent_beta", model: "model-beta" },
              { id: "agent_alpha", workspace: "/old", model: "old-model", identity: { name: "Old Alpha" } },
            ],
          },
          bindings: [{ agentId: "agent_beta", match: { channel: "whatsapp", accountId: "agent_beta" } }],
        },
      } as never,
    );

    expect(patch.agents.list).toHaveLength(2);
    expect(patch.agents.list.find((entry) => entry.id === "agent_beta")).toMatchObject({
      id: "agent_beta",
      workspace: "/runtime/org_123/agents/agent_beta",
    });
    expect(patch.agents.list.find((entry) => entry.id === "agent_alpha")).toMatchObject({
      id: "agent_alpha",
      workspace: "/runtime/org_123/agents/agent_alpha",
      model: "openrouter/anthropic/claude-4.5-haiku",
      fastModeDefault: true,
      memorySearch: { enabled: false },
    });
    expect(patch.bindings).toContainEqual({
      agentId: "agent_alpha",
      match: { channel: "whatsapp", accountId: "agent_alpha" },
    });
    expect(patch.channels.whatsapp.accounts.agent_alpha).toMatchObject({
      enabled: true,
      dmPolicy: "allowlist",
    });
    expect(patch.session).toEqual({ routeFallback: "deny" });
  });

  it("requires the agent-scoped WhatsApp binding and allowlist policy for a managed config match", () => {
    const baseSnapshot = {
      hash: "hash_123",
      config: {
        agents: {
          defaults: {
            skipBootstrap: true,
            thinkingDefault: "off",
            memorySearch: { enabled: false, sync: { onSessionStart: false, onSearch: false, watch: false } },
          },
          list: [
            {
              id: "agent_alpha",
              workspace: "/runtime/org_123/agents/agent_alpha",
              model: "openrouter/anthropic/claude-4.5-haiku",
              fastModeDefault: true,
              memorySearch: { enabled: false },
            },
          ],
        },
      },
    };

    expect(
      managedAgentRuntimeConfigMatchesSnapshot(baseSnapshot as never, {
        agentId: "agent_alpha",
        workspace: "/runtime/org_123/agents/agent_alpha",
        model: "openrouter/anthropic/claude-4.5-haiku",
      }),
    ).toBe(false);

    const withBinding = {
      ...baseSnapshot,
      config: {
        ...baseSnapshot.config,
        bindings: [{ agentId: "agent_alpha", match: { channel: "whatsapp", accountId: "agent_alpha" } }],
      },
    };

    expect(
      whatsappAgentBindingMatchesSnapshot(withBinding as never, { agentId: "agent_alpha", accountId: "agent_alpha" }),
    ).toBe(true);
    expect(
      managedAgentRuntimeConfigMatchesSnapshot(withBinding as never, {
        agentId: "agent_alpha",
        workspace: "/runtime/org_123/agents/agent_alpha",
        model: "openrouter/anthropic/claude-4.5-haiku",
      }),
    ).toBe(false);

    const withManagedWhatsAppAccount = {
      ...withBinding,
      config: {
        ...withBinding.config,
        channels: {
          whatsapp: {
            accounts: {
              agent_alpha: {
                enabled: true,
                dmPolicy: "allowlist",
              },
            },
          },
        },
        session: { routeFallback: "deny" },
      },
    };

    expect(
      managedAgentRuntimeConfigMatchesSnapshot(withManagedWhatsAppAccount as never, {
        agentId: "agent_alpha",
        workspace: "/runtime/org_123/agents/agent_alpha",
        model: "openrouter/anthropic/claude-4.5-haiku",
      }),
    ).toBe(true);
  });

  it("matches channel bindings by both channel and account id", () => {
    const snapshot = {
      hash: "hash_123",
      config: {
        bindings: [
          { agentId: "agent_alpha", match: { channel: "telegram", accountId: "agent_alpha" } },
          { agentId: "agent_alpha", match: { channel: "slack", accountId: "T123" } },
        ],
      },
    };

    expect(
      channelAgentBindingMatchesSnapshot(snapshot as never, {
        channel: "telegram",
        agentId: "agent_alpha",
        accountId: "agent_alpha",
      }),
    ).toBe(true);
    expect(
      channelAgentBindingMatchesSnapshot(snapshot as never, {
        channel: "telegram",
        agentId: "agent_alpha",
        accountId: "default",
      }),
    ).toBe(false);
    expect(
      channelAgentBindingMatchesSnapshot(snapshot as never, {
        channel: "whatsapp",
        agentId: "agent_alpha",
        accountId: "agent_alpha",
      }),
    ).toBe(false);
  });
});

describe("tenant gateway assignments", () => {
  it("resolves active URL assignments and ignores disabled rows", () => {
    process.env.OPENCLAW_TEST_GATEWAY_TOKEN = "token_123";

    expect(
      resolveTenantGatewayAssignmentFromRow({
        org_id: "org_123",
        ws_url: "wss://tenant-a.up.railway.app",
        token_env_key: "OPENCLAW_TEST_GATEWAY_TOKEN",
        status: "active",
        dedicated: true,
        assignment_reason: "paid",
      }),
    ).toEqual({
      orgId: "org_123",
      shardId: undefined,
      wsUrl: "wss://tenant-a.up.railway.app",
      token: "token_123",
      status: "active",
      dedicated: true,
      assignmentReason: "paid",
    });

    expect(
      resolveTenantGatewayAssignmentFromRow({
        org_id: "org_123",
        ws_url: "wss://tenant-a.up.railway.app",
        status: "disabled",
      }),
    ).toBeNull();

    delete process.env.OPENCLAW_TEST_GATEWAY_TOKEN;
  });

  it("returns null when an active row pins a missing shard but provides no ws_url fallback", () => {
    expect(
      resolveTenantGatewayAssignmentFromRow({
        org_id: "org_drift",
        shard_id: "shard-vanished",
        status: "active",
      }),
    ).toBeNull();
  });

  it("constructs a drift error that names the orphaned shard id", () => {
    const error = new GatewayAssignmentDriftError({
      orgId: "org_drift",
      shardId: "shard-vanished",
      assignmentReason: "trial",
      reason: 'shard "shard-vanished" is not present in OPENCLAW_GATEWAY_SHARDS and the row has no fallback ws_url',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("GatewayAssignmentDriftError");
    expect(error.shardId).toBe("shard-vanished");
    expect(error.assignmentReason).toBe("trial");
    expect(error.message).toContain("org_drift");
    expect(error.message).toContain("shard-vanished");
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

describe("terminal security policy", () => {
  it("allows owner and admin roles", () => {
    expect(() => assertAdminRole("owner")).not.toThrow();
    expect(() => assertAdminRole("admin")).not.toThrow();
  });

  it("rejects non-admin roles", () => {
    expect(() => assertAdminRole("employee")).toThrow("Terminal access is restricted to tenant admins.");
    expect(() => assertAdminRole("member")).toThrow("Terminal access is restricted to tenant admins.");
  });

  it("blocks dangerous commands", () => {
    expect(() => assertCommandAllowed("rm -rf /")).toThrow("blocked");
    expect(() => assertCommandAllowed("shutdown")).toThrow("blocked");
    expect(() => assertCommandAllowed("reboot")).toThrow("blocked");
    expect(() => assertCommandAllowed("mkfs /dev/sda")).toThrow("blocked");
    expect(() => assertCommandAllowed("dd if=/dev/zero")).toThrow("blocked");
  });

  it("allows safe commands", () => {
    expect(() => assertCommandAllowed("ls -la")).not.toThrow();
    expect(() => assertCommandAllowed("git status")).not.toThrow();
    expect(() => assertCommandAllowed("npm run build")).not.toThrow();
  });

  it("denies repo-scoped commands when no allowlists are configured", () => {
    expect(() => assertRepoAllowed("my-repo", [])).toThrow(
      "No repo allowlists configured",
    );
  });

  it("allows commands without a repo regardless of allowlist state", () => {
    expect(() => assertRepoAllowed(undefined, [])).not.toThrow();
    expect(() => assertRepoAllowed(undefined, ["pattern"])).not.toThrow();
  });

  it("allows repos that match an allowlist pattern", () => {
    expect(() => assertRepoAllowed("repos/app", ["repos/app", "repos/docs"])).not.toThrow();
  });

  it("rejects repos not in the allowlist", () => {
    expect(() => assertRepoAllowed("repos/secret", ["repos/app"])).toThrow(
      "not included in the tenant allowlist",
    );
  });
});

describe("provisioning role requirements", () => {
  it("gives admins the canManageAgents capability required for provisioning", () => {
    const admin = getRoleCapabilities("admin");
    expect(admin.canManageAgents).toBe(true);
  });

  it("denies employees the canManageAgents capability", () => {
    const employee = getRoleCapabilities("employee");
    expect(employee.canManageAgents).toBe(false);
  });

  it("gives super admins provisioning access even in an employee role", () => {
    const superEmployee = getRoleCapabilities("employee", { isSuperAdmin: true });
    expect(superEmployee.canManageAgents).toBe(true);
  });

  it("requires canManageAdminTools for terminal access", () => {
    expect(getRoleCapabilities("admin").canManageAdminTools).toBe(true);
    expect(getRoleCapabilities("employee").canManageAdminTools).toBe(false);
  });

  it("requires canManageConsole for gateway console access", () => {
    expect(getRoleCapabilities("owner").canManageConsole).toBe(true);
    expect(getRoleCapabilities("employee").canManageConsole).toBe(false);
  });
});

describe("billing gate errors", () => {
  it("packs trial paid model rejection into upgrade cta", () => {
    const error = new BillingGateError({
      code: "TRIAL_PAID_MODEL_BLOCKED",
      message: "Paid models unlock when you upgrade.",
    });

    expect(isBillingGateError(error)).toBe(true);
    expect(error.cta).toBe("upgrade");
    expect(error.status).toBe(402);
    expect(billingGateErrorToJson(error)).toEqual({
      error: {
        code: "TRIAL_PAID_MODEL_BLOCKED",
        message: "Paid models unlock when you upgrade.",
        cta: "upgrade",
      },
    });
  });

  it("packs wallet-empty rejection into topup cta", () => {
    const error = new BillingGateError({
      code: "WALLET_INSUFFICIENT",
      message: "Wallet is empty.",
    });

    expect(error.cta).toBe("topup");
    expect(error.status).toBe(402);
  });

  it("packs premium-approval rejection into approval cta with 403", () => {
    const error = new BillingGateError({
      code: "PREMIUM_REQUIRES_APPROVAL",
      message: "Needs admin approval.",
      status: 403,
    });

    expect(error.cta).toBe("approval");
    expect(error.status).toBe(403);
  });

  it("recognises gate errors thrown across realms via the symbol flag", () => {
    const plain = Object.assign(new Error("forged"), {
      name: "BillingGateError",
      code: "TRIAL_PAID_MODEL_BLOCKED",
      cta: "upgrade",
      status: 402,
      [Symbol.for("saintagi.billing-gate-error")]: true,
    });
    expect(isBillingGateError(plain)).toBe(true);
  });
});

describe("trial model snapshot", () => {
  function buildSnapshotForTrial() {
    return buildModelCatalogSnapshotFromDiscovery(
      {
        default_model: "openrouter/anthropic/claude-haiku-4.5",
        approved_models: [
          { id: "openrouter/anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "openrouter" },
          { id: "openrouter/openai/gpt-5-mini", label: "GPT-5 Mini", provider: "openrouter" },
          { id: "openrouter/anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "openrouter" },
          { id: "openrouter/openrouter/free", label: "OpenRouter Free Models Router", provider: "openrouter" },
        ],
      },
      [
        {
          id: "openrouter/openai/gpt-5-mini",
          label: "GPT-5 Mini",
          provider: "openrouter",
          inputCostPerMillionCents: 50,
          outputCostPerMillionCents: 150,
          source: "openrouter",
        },
        {
          id: "openrouter/anthropic/claude-haiku-4.5",
          label: "Claude Haiku 4.5",
          provider: "openrouter",
          inputCostPerMillionCents: 80,
          outputCostPerMillionCents: 400,
          source: "openrouter",
        },
        {
          id: "openrouter/anthropic/claude-sonnet-4-5",
          label: "Claude Sonnet 4.5",
          provider: "openrouter",
          inputCostPerMillionCents: 80,
          outputCostPerMillionCents: 240,
          source: "openrouter",
        },
        {
          id: "openrouter/openrouter/free",
          label: "OpenRouter Free Models Router",
          provider: "openrouter",
          inputCostPerMillionCents: 0,
          outputCostPerMillionCents: 0,
          isFree: true,
          source: "openrouter",
        },
      ],
      "openrouter/auto",
    );
  }

  it("pins defaultModel to the fast trial default model", () => {
    const restricted = restrictSnapshotToTrialFreeModels(buildSnapshotForTrial());
    expect(restricted.defaultModel).toBe("openrouter/anthropic/claude-haiku-4.5");
  });

  it("keeps the trial default unlocked at the head of approvedModels", () => {
    const restricted = restrictSnapshotToTrialFreeModels(buildSnapshotForTrial());
    const head = restricted.approvedModels[0];
    expect(head?.id).toBe("openrouter/anthropic/claude-haiku-4.5");
    expect(head?.lockedReason ?? null).toBeNull();
    expect(head?.isFree).toBe(true);
  });

  it("includes the free router as an unlocked trial fallback", () => {
    const restricted = restrictSnapshotToTrialFreeModels(buildSnapshotForTrial());
    const fallback = restricted.approvedModels.find(
      (entry) => entry.id === "openrouter/openrouter/free",
    );
    expect(fallback).toBeTruthy();
    expect(fallback?.lockedReason ?? null).toBeNull();
    expect(fallback?.isFree).toBe(true);
  });

  it("surfaces paid models as locked rows so the UI can render the upgrade signal", () => {
    const restricted = restrictSnapshotToTrialFreeModels(buildSnapshotForTrial());
    const lockedIds = restricted.approvedModels
      .filter((entry) => entry.lockedReason === "trial_paid_model")
      .map((entry) => entry.id);
    expect(lockedIds).toContain("openrouter/anthropic/claude-sonnet-4-5");
  });

  it("does not advertise more than the locked-row cap to keep the picker tidy", () => {
    const restricted = restrictSnapshotToTrialFreeModels(buildSnapshotForTrial());
    const lockedRows = restricted.approvedModels.filter(
      (entry) => entry.lockedReason === "trial_paid_model",
    );
    expect(lockedRows.length).toBeLessThanOrEqual(12);
  });
});

