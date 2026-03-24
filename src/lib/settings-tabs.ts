import type { OrgCapabilities } from "@/types";

export type SettingsTabId = "general" | "members" | "governance" | "billing" | "integrations" | "security" | "email";

export const settingsTabs: Array<{
  id: SettingsTabId;
  label: string;
  heading: string;
  description: string;
  section: "organization" | "operations";
  requires?: keyof OrgCapabilities;
}> = [
  {
    id: "general",
    label: "General",
    heading: "Organization settings",
    description: "Workspace profile, identity, and durable organization metadata.",
    section: "organization",
  },
  {
    id: "members",
    label: "Members",
    heading: "Members and invites",
    description: "Invite teammates, review workspace access, and keep invite billing under control.",
    section: "organization",
    requires: "canManageBilling",
  },
  {
    id: "governance",
    label: "AI Governance",
    heading: "AI governance",
    description: "Mission, model catalog, approvals, and guardrails.",
    section: "organization",
    requires: "canManagePolicies",
  },
  {
    id: "billing",
    label: "Billing",
    heading: "Billing",
    description: "Wallet balance, plan management, credits, and ledger history.",
    section: "operations",
    requires: "canManageBilling",
  },
  {
    id: "integrations",
    label: "Integrations",
    heading: "Integrations",
    description: "Telegram and Slack channel bindings for tenant runtimes.",
    section: "operations",
    requires: "canManageAgents",
  },
  {
    id: "email",
    label: "Email",
    heading: "Email preferences",
    description: "Manage weekly, welcome, and role-based Saint AGI emails for this workspace.",
    section: "operations",
  },
  {
    id: "security",
    label: "Security",
    description: "Repo allowlists, terminal policy, and approval history.",
    heading: "Security",
    section: "operations",
    requires: "canManageAdminTools",
  },
];

export function canAccessSettingsTab(tabId: SettingsTabId, capabilities: OrgCapabilities) {
  const tab = settingsTabs.find((entry) => entry.id === tabId);
  if (!tab?.requires) {
    return true;
  }

  return capabilities[tab.requires];
}

export function getVisibleSettingsTabs(capabilities: OrgCapabilities) {
  return settingsTabs.filter((tab) => canAccessSettingsTab(tab.id, capabilities));
}

export function resolveSettingsTab(
  requestedTab: string | string[] | undefined,
  capabilities: OrgCapabilities,
): SettingsTabId {
  const candidate = Array.isArray(requestedTab) ? requestedTab[0] : requestedTab;
  const matched = settingsTabs.find((tab) => tab.id === candidate);

  if (matched && canAccessSettingsTab(matched.id, capabilities)) {
    return matched.id;
  }

  return getVisibleSettingsTabs(capabilities)[0]?.id ?? "general";
}
