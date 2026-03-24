"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  Database,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  UserCircle2,
} from "lucide-react";

import { SidebarAccount } from "@/components/dashboard/sidebar-account";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { getVisibleSettingsTabs, resolveSettingsTab } from "@/lib/settings-tabs";
import { cn } from "@/lib/utils";
import type { WorkspaceMembership } from "@/types";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requires?: "canManageConsole";
};

type NavigationSection = {
  id: string;
  label?: string;
  items: NavigationItem[];
};

export function DashboardSidebar({
  platformStatus,
  collapsed = false,
  onToggle,
}: {
  platformStatus: {
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
    };
  };
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hash, setHash] = useState("");
  const isSettingsRoute = pathname === "/settings" || pathname.startsWith("/settings/");
  const isAgentsRoute = pathname === "/agents" || pathname.startsWith("/agents/");
  const isKnowledgeRoute = pathname === "/knowledge" || pathname.startsWith("/knowledge/");
  const isConsoleRoute = pathname === "/openclaw" || pathname.startsWith("/openclaw/");
  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");
  const activeSettingsTab = resolveSettingsTab(searchParams.get("tab") ?? undefined, platformStatus.capabilities);
  const visibleSettingsTabs = getVisibleSettingsTabs(platformStatus.capabilities);

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash || "");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const allConnected = platformStatus.supabase && platformStatus.openclaw;
  const StatusIcon = allConnected ? Activity : AlertTriangle;
  const statusColor = allConnected ? "text-emerald-400" : "text-amber-400";
  const orgLabel = platformStatus.orgName ?? "Personal workspace";
  const visibleAgents = platformStatus.visibleAgents ?? [];
  const hasSingleVisibleAgent = visibleAgents.length === 1;
  const agentNavLabel = hasSingleVisibleAgent ? "My agent" : "My agents";

  const statusLines: string[] = [];
  if (!platformStatus.supabase) statusLines.push("Supabase not configured");
  if (!platformStatus.openclaw) statusLines.push("Runtime gateway not connected");
  if (statusLines.length === 0) statusLines.push("All services connected");
  const orgInitials =
    orgLabel
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SC";
  const visibleAgentItems = visibleAgents.map((agent) => ({
    href: `/agents/${agent.id}`,
    label: agent.name,
    active: pathname === `/agents/${agent.id}` || pathname === `/agents/${agent.id}/logs`,
  }));
  const singleVisibleAgent = hasSingleVisibleAgent ? visibleAgents[0] : null;
  const fleetItems = [
    {
      href: "/agents",
      label: visibleAgents.length > 1 ? "All agents" : "Agent list",
      active: pathname === "/agents",
    },
    ...(platformStatus.capabilities.canManageAgents
      ? [
          {
            href: "/agents/new",
            label: "New agent",
            active: pathname === "/agents/new",
          },
        ]
      : []),
  ];
  const agentContextualGroups = [
    ...(singleVisibleAgent
      ? [
          {
            id: "my-agent",
            label: "My agent",
            items: [
              {
                href: `/agents/${singleVisibleAgent.id}`,
                label: singleVisibleAgent.name,
                active: pathname === `/agents/${singleVisibleAgent.id}`,
              },
              {
                href: `/agents/${singleVisibleAgent.id}/logs`,
                label: "Logs",
                active: pathname === `/agents/${singleVisibleAgent.id}/logs`,
              },
            ],
          },
        ]
      : visibleAgentItems.length > 0
        ? [
            {
              id: "my-agents",
              label: "My agents",
              items: visibleAgentItems,
            },
          ]
        : []),
    {
      id: "fleet",
      label: "Browse",
      items: fleetItems,
    },
  ].filter((group) => group.items.length > 0);
  const navigationSections: NavigationSection[] = [
    {
      id: "main",
      items: [
        { href: "/openclaw", label: agentNavLabel, icon: Bot, requires: "canManageConsole" },
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/agents", label: "Agents", icon: Command },
        { href: "/observability", label: "Observability", icon: Activity },
        { href: "/knowledge", label: "Knowledge", icon: Database },
        { href: "/account", label: "Account", icon: UserCircle2 },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      items: [{ href: "/settings", label: "Settings", icon: Settings }],
    },
  ];

  const contextualGroups = {
    settings: [
      {
        id: "organization",
        label: "Organization",
        items: visibleSettingsTabs
          .filter((tab) => tab.section === "organization")
          .map((tab) => ({
            href: `/settings?tab=${tab.id}`,
            label: tab.label,
            active: tab.id === activeSettingsTab,
          })),
      },
      {
        id: "operations",
        label: "Operations",
        items: visibleSettingsTabs
          .filter((tab) => tab.section === "operations")
          .map((tab) => ({
            href: `/settings?tab=${tab.id}`,
            label: tab.label,
            active: tab.id === activeSettingsTab,
          })),
      },
    ].filter((group) => group.items.length > 0),
    agents: agentContextualGroups,
    knowledge: [
      {
        id: "knowledge",
        label: "Knowledge base",
        items: [
          {
            href: "/knowledge#upload",
            label: "Upload",
            active: pathname === "/knowledge",
          },
          {
            href: "/knowledge#documents",
            label: "Documents",
            active: pathname === "/knowledge",
          },
        ],
      },
    ],
    account: [
      {
        id: "account",
        label: "Profile",
        items: [
          {
            href: "/account#profile",
            label: "Personal profile",
            active: hash ? hash === "#profile" : true,
          },
          {
            href: "/account#details",
            label: "Account details",
            active: hash === "#details",
          },
          {
            href: "/account#agent-context",
            label: "How agents use this",
            active: hash === "#agent-context",
          },
        ],
      },
    ],
    console: agentContextualGroups,
  };

  return (
    <aside className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(7,8,10,0.92),rgba(10,11,14,0.88))] backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div
        className={cn(
          "flex h-full flex-col gap-6 px-4 py-4 sm:px-6 lg:px-4 lg:py-5",
          collapsed && "lg:items-center lg:gap-4 lg:px-2.5",
        )}
      >
        <div className={cn("space-y-4", collapsed && "lg:flex lg:w-full lg:flex-col lg:items-center lg:space-y-3")}>
          <div className="flex items-start justify-between gap-3">
            <div className={cn("flex w-full items-start justify-between gap-3", collapsed && "lg:flex-col lg:items-center lg:justify-center")}>
              <Logo className="self-start" showWordmark={!collapsed} />
              {onToggle ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("hidden lg:inline-flex", collapsed && "lg:size-10 lg:rounded-2xl lg:border lg:border-white/8 lg:bg-white/[0.03]")}
                  onClick={onToggle}
                  aria-label={collapsed ? "Expand left menu" : "Collapse left menu"}
                  title={collapsed ? "Expand left menu" : "Collapse left menu"}
                >
                  {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                </Button>
              ) : null}
            </div>
          </div>
          <div
            className={cn(
              "rounded-2xl border border-white/8 bg-white/[0.025] px-3.5 py-3",
              collapsed && "lg:w-full lg:rounded-[1.75rem] lg:px-2 lg:py-2.5",
            )}
            title={collapsed ? orgLabel : undefined}
          >
            <div className={cn(collapsed && "lg:flex lg:flex-col lg:items-center lg:gap-2")}>
              <p className={cn("text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500", collapsed && "lg:hidden")}>
                Workspace
              </p>
              <div className={cn("mt-3 flex items-center gap-3", collapsed && "lg:mt-0 lg:flex-col lg:gap-2")}>
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
                    collapsed && "lg:size-11",
                  )}
                >
                  {platformStatus.orgLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={platformStatus.orgLogoUrl}
                      alt={`${orgLabel} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">{orgInitials}</span>
                  )}
                </div>
                <div className={cn("min-w-0", collapsed && "lg:hidden")}>
                  <p className="truncate text-sm font-medium text-white">{orgLabel}</p>
                </div>
                <p
                  className={cn(
                    "hidden text-sm font-medium text-white",
                    collapsed && "lg:inline lg:text-[0.7rem] lg:tracking-[0.16em]",
                  )}
                >
                  {orgInitials}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className={cn("overflow-x-auto lg:flex-1 lg:overflow-visible", collapsed && "lg:w-full")}>
          <div
            className={cn(
              "flex gap-2 pb-1 lg:flex-col lg:gap-6",
              collapsed &&
                "lg:rounded-[2rem] lg:border lg:border-white/8 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] lg:px-2 lg:py-3",
            )}
          >
            {navigationSections.map((section) => {
              const items = section.items.filter((item) => {
                const requiredCapability = item.requires;
                return !requiredCapability || platformStatus.capabilities[requiredCapability];
              });

              if (items.length === 0) {
                return null;
              }

              return (
                <div
                  key={section.id}
                  className={cn(
                    "space-y-2.5",
                    collapsed && "lg:space-y-2",
                    collapsed && section.id === "admin" && "lg:border-t lg:border-white/8 lg:pt-2",
                  )}
                >
                  {section.label ? (
                    <p className={cn("hidden px-2 text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500 lg:block", collapsed && "lg:hidden")}>
                      {section.label}
                    </p>
                  ) : null}
                  <div className="flex gap-2 lg:flex-col lg:gap-1">
                    {items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const contextualChildren =
                        item.href === "/settings" && isSettingsRoute
                          ? contextualGroups.settings
                          : item.href === "/agents" && isAgentsRoute
                            ? contextualGroups.agents
                            : item.href === "/knowledge" && isKnowledgeRoute
                              ? contextualGroups.knowledge
                              : item.href === "/account" && isAccountRoute
                                ? contextualGroups.account
                              : item.href === "/openclaw" && isConsoleRoute
                                ? contextualGroups.console
                                : [];

                      return (
                        <div key={item.href} className="space-y-1">
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              "flex shrink-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white lg:w-full",
                              collapsed &&
                                "lg:size-11 lg:w-11 lg:justify-center lg:rounded-2xl lg:border-white/0 lg:px-0 lg:text-zinc-500 hover:lg:border-white/10 hover:lg:bg-white/[0.04]",
                              active && "border-white/8 bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
                              collapsed &&
                                active &&
                                "lg:border-white/12 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.2)]",
                            )}
                          >
                            <item.icon className="size-4" />
                            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                          </Link>
                          {contextualChildren.length > 0 ? (
                            <div className={cn("ml-3 space-y-4 border-l border-white/8 pl-4", collapsed && "lg:hidden")}>
                              {contextualChildren.map((group) => (
                                <div key={group.id} className="space-y-1.5">
                                  <p className="px-2 text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                                    {group.label}
                                  </p>
                                  {group.items.map((subitem) => (
                                    <Link
                                      key={subitem.href}
                                      href={subitem.href}
                                      className={cn(
                                        "block rounded-lg px-2.5 py-2 text-sm transition-colors",
                                        subitem.active
                                          ? "bg-white/[0.08] text-white"
                                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                                      )}
                                    >
                                      {subitem.label}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <SidebarAccount
          email={platformStatus.email}
          displayName={platformStatus.displayName}
          avatarUrl={platformStatus.avatarUrl}
          orgName={platformStatus.orgName}
          role={platformStatus.role}
          workspaces={platformStatus.workspaces}
          currentOrgId={platformStatus.currentOrgId}
          hasSupabase={platformStatus.supabase}
          collapsed={collapsed}
        />

        <div
          className={cn(
            "rounded-2xl border border-white/8 bg-white/[0.025] p-4",
            collapsed && "lg:flex lg:w-full lg:flex-col lg:items-center lg:rounded-[1.75rem] lg:px-2 lg:py-2.5",
          )}
          title={collapsed ? statusLines.join(". ") : undefined}
        >
          <div className={cn("mb-3 flex items-center justify-between gap-3", collapsed && "lg:mb-0")}>
            <p className={cn("text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500", collapsed && "lg:hidden")}>
              Platform
            </p>
            <div
              className={cn(
                "flex items-center gap-2 text-xs text-zinc-400",
                collapsed && "lg:flex-col lg:gap-1.5",
              )}
              title={allConnected ? "Platform online" : "Platform needs setup"}
            >
              <div
                className={cn(
                  "flex items-center justify-center",
                  collapsed &&
                    "lg:size-11 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
                )}
              >
                <StatusIcon className={cn("size-3.5", statusColor)} />
              </div>
              <span className={cn(collapsed && "lg:hidden")}>{allConnected ? "Online" : "Check setup"}</span>
            </div>
          </div>
          <p className={cn("text-sm leading-6 text-zinc-400", collapsed && "lg:hidden")}>{statusLines.join(". ")}.</p>
          <div className={cn("mt-4 flex items-center gap-2", collapsed && "lg:mt-2 lg:flex-col")}>
            <span className={cn("size-2 rounded-full", statusColor)} />
            <p className={cn("text-xs text-zinc-500", collapsed && "lg:hidden")}>{orgLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
