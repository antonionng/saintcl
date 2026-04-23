import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isAdminRole } from "@/lib/access";
import {
  getCurrentOrg,
  getCurrentUserProfile,
  getCurrentUserWorkspaces,
  getVisibleAgentsForSession,
} from "@/lib/dal";
import { isOpenClawConfigured, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMembership } from "@/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let orgName: string | null = null;
  let email: string | null = null;
  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let orgLogoUrl: string | null = null;
  let role: string | null = null;
  let currentOrgId: string | null = null;
  let workspaces: WorkspaceMembership[] = [];
  let visibleAgents: Array<{ id: string; name: string }> = [];
  let capabilities = {
    canManageBilling: false,
    canManagePolicies: false,
    canManageAgents: false,
    canViewAllAgents: false,
    canManageConsole: false,
    canManageAdminTools: false,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

    if (!user) {
      redirect("/login");
    }

    const result = await getCurrentOrg();
    if (!result) {
      redirect("/login");
    }

    orgName = result.org.name ?? null;
    orgLogoUrl = result.org.logoUrl ?? null;
    email = result.email ?? null;
    role = result.role ?? null;
    currentOrgId = result.org.id ?? null;
    capabilities = result.capabilities ?? capabilities;

    if (result.role && !isAdminRole(result.role, { isSuperAdmin: result.isSuperAdmin })) {
      redirect("/workspace");
    }

    const [profile, workspaceMemberships, nextVisibleAgents] = await Promise.all([
      getCurrentUserProfile(),
      getCurrentUserWorkspaces(),
      getVisibleAgentsForSession(result),
    ]);
    workspaces = workspaceMemberships;
    visibleAgents = nextVisibleAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));
    displayName = profile?.displayName ?? null;
    avatarUrl = profile?.avatarUrl ?? null;
  }

  const platformStatus = {
    supabase: isSupabaseConfigured(),
    openclaw: isOpenClawConfigured(),
    orgName,
    orgLogoUrl,
    email,
    displayName,
    avatarUrl,
    role,
    currentOrgId,
    workspaces,
    visibleAgents,
    capabilities,
  };

  return <DashboardShell platformStatus={platformStatus}>{children}</DashboardShell>;
}
