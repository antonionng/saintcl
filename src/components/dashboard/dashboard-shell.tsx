"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";
import type { WorkspaceMembership } from "@/types";

type PlatformStatus = {
  supabase: boolean;
  openclaw: boolean;
  orgName: string | null;
  orgLogoUrl?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  currentOrgId?: string | null;
  workspaces?: WorkspaceMembership[];
  visibleAgents?: Array<{
    id: string;
    name: string;
  }>;
  capabilities: {
    canManageBilling: boolean;
    canManagePolicies: boolean;
    canManageAgents: boolean;
    canViewAllAgents: boolean;
    canManageConsole: boolean;
    canManageAdminTools: boolean;
    canManageTraining: boolean;
    canManagePlatformTraining: boolean;
  };
};

export function DashboardShell({
  children,
  platformStatus,
}: {
  children: React.ReactNode;
  platformStatus: PlatformStatus;
}) {
  const pathname = usePathname();
  const isConsoleRoute = pathname === "/openclaw" || pathname.startsWith("/openclaw/");
  const isSettingsRoute = pathname === "/settings" || pathname.startsWith("/settings/");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("saintclaw:sidebar-collapsed") === "true";
  });
  const sidebarCollapsed = isConsoleRoute || isSidebarCollapsed;

  useEffect(() => {
    window.localStorage.setItem("saintclaw:sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div
      className={cn(
        "min-h-screen bg-surface-0 lg:grid",
        sidebarCollapsed ? "lg:grid-cols-[88px_minmax(0,1fr)]" : "lg:grid-cols-[280px_minmax(0,1fr)]",
      )}
    >
      <DashboardSidebar
        platformStatus={platformStatus}
        collapsed={sidebarCollapsed}
        onToggle={isConsoleRoute ? undefined : () => setIsSidebarCollapsed((current) => !current)}
      />
      <div className={cn("min-h-screen", isConsoleRoute && "overflow-hidden")}>
        <div
          className={cn(
            "flex min-h-screen w-full flex-col",
            isConsoleRoute
              ? "max-w-none px-0 py-0"
              : "max-w-[1240px] px-phi-5 py-phi-8 sm:px-phi-8 lg:px-phi-13 lg:py-phi-13",
            isSettingsRoute && "ml-0 mr-auto max-w-[1440px] px-phi-5 py-phi-8 sm:px-phi-8 lg:px-phi-8 lg:py-phi-13",
            !isConsoleRoute && !isSettingsRoute && "mx-auto",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
