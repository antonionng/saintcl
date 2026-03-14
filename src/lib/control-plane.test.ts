import { describe, expect, it } from "vitest";

import { canSessionAccessAssignment, getRoleCapabilities } from "./access";
import { calculateNextBalance } from "./billing/math";
import type { CurrentOrgSession } from "../types";

function makeSession(role: CurrentOrgSession["role"]): CurrentOrgSession {
  return {
    org: {
      id: "org_123",
      name: "Acme",
      slug: "acme",
      plan: "pro",
      created_at: new Date().toISOString(),
    },
    role,
    userId: "user_123",
    email: "user@example.com",
    capabilities: getRoleCapabilities(role),
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
    expect(capabilities.canManageAgents).toBe(true);
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

