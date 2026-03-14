import type { CurrentOrgSession, OrgCapabilities, OrgRole } from "../types";

export function getRoleCapabilities(role: OrgRole): OrgCapabilities {
  const isAdmin = role === "owner" || role === "admin";
  return {
    canManageBilling: isAdmin,
    canManagePolicies: isAdmin,
    canManageAgents: true,
    canViewAllAgents: isAdmin,
    canManageConsole: isAdmin,
    canManageAdminTools: isAdmin,
  };
}

export function isAdminRole(role?: string | null) {
  return role === "owner" || role === "admin";
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

