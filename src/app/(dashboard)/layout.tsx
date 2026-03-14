import { redirect } from "next/navigation";

import { AutoBootstrapAgent } from "@/components/dashboard/auto-bootstrap-agent";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getCurrentOrg } from "@/lib/dal";
import { isOpenClawConfigured, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let orgName: string | null = null;
  let capabilities = {
    canManageBilling: false,
    canManagePolicies: false,
    canManageAgents: true,
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
    orgName = result?.org.name ?? null;
    capabilities = result?.capabilities ?? capabilities;
  }

  const platformStatus = {
    supabase: isSupabaseConfigured(),
    openclaw: isOpenClawConfigured(),
    orgName,
    capabilities,
  };

  return (
    <div className="grid min-h-screen bg-black lg:grid-cols-[280px_1fr]">
      <DashboardSidebar platformStatus={platformStatus} />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_28%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
          <AutoBootstrapAgent />
          {children}
        </div>
      </div>
    </div>
  );
}
