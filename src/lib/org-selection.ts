import type { WorkspaceMembership } from "@/types";

export const ACTIVE_ORG_COOKIE_NAME = "saintagi-active-org";
export const LEGACY_ACTIVE_ORG_COOKIE_NAMES = ["saintclaw-active-org"] as const;

export function sortWorkspaceMemberships(workspaces: WorkspaceMembership[]) {
  return [...workspaces].sort((a, b) => {
    const createdComparison = Date.parse(a.org.created_at) - Date.parse(b.org.created_at);
    if (createdComparison !== 0) {
      return createdComparison;
    }

    return a.org.name.localeCompare(b.org.name);
  });
}

export function resolveActiveWorkspace(
  workspaces: WorkspaceMembership[],
  activeOrgId?: string | null,
): WorkspaceMembership | null {
  if (workspaces.length === 0) {
    return null;
  }

  if (!activeOrgId) {
    return workspaces[0] ?? null;
  }

  return workspaces.find((workspace) => workspace.org.id === activeOrgId) ?? workspaces[0] ?? null;
}
