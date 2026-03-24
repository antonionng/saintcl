import { redirect } from "next/navigation";

import { WorkspaceChrome } from "@/components/workspace/workspace-chrome";
import { isAdminRole } from "@/lib/access";
import { getCurrentOrg, getCurrentUserProfile, getCurrentUserWorkspaces } from "@/lib/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

    if (!user) {
      redirect("/login");
    }

    const result = await getCurrentOrg();
    if (result?.role && isAdminRole(result.role, { isSuperAdmin: result.isSuperAdmin })) {
      redirect("/openclaw");
    }

    const profile = await getCurrentUserProfile();
    const workspaces = await getCurrentUserWorkspaces();

    return (
      <WorkspaceChrome
        email={profile?.email ?? result?.email ?? user.email}
        displayName={profile?.displayName}
        avatarUrl={profile?.avatarUrl}
        workspaces={workspaces}
        currentOrgId={result?.org.id}
      >
        {children}
      </WorkspaceChrome>
    );
  }

  return <>{children}</>;
}
