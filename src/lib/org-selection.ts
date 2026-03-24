import type { WorkspaceMembership } from "@/types";

export const ACTIVE_ORG_COOKIE_NAME = "saintclaw-active-org";

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
