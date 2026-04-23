import type { CurrentOrgSession, OrgCapabilities, OrgRole } from "../types";

export function getRoleCapabilities(role: OrgRole, options?: { isSuperAdmin?: boolean }): OrgCapabilities {
  const isAdmin = options?.isSuperAdmin || role === "owner" || role === "admin";
  return {
    canManageBilling: isAdmin,
    canManagePolicies: isAdmin,
    canManageAgents: isAdmin,
    canViewAllAgents: isAdmin,
    canManageConsole: isAdmin,
    canManageAdminTools: isAdmin,
  };
}

export function isAdminRole(role?: string | null, options?: { isSuperAdmin?: boolean }) {
  return options?.isSuperAdmin || role === "owner" || role === "admin";
}

export function getAuthenticatedHomePath(role?: string | null, options?: { isSuperAdmin?: boolean }) {
  return isAdminRole(role, options) ? "/dashboard" : "/workspace";
}

export function canSessionAccessAssignment(
  session: CurrentOrgSession,
  assignment?: { assignee_type: string; assignee_ref: string } | null,
) {
  if (session.capabilities.canViewAllAgents) return true;
  if (!assignment) return false;
  if (assignment.assignee_type === "org") return true;
  if (assignment.assignee_type === "employee") {
    return assignment.assignee_ref === session.userId || assignment.assignee_ref === session.email;
  }
  return false;
}

