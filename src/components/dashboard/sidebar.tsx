"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Cable,
  ChevronLeft,
  ChevronRight,
  Command,
  Database,
  LayoutDashboard,
  type LucideIcon,
  Puzzle,
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
  requires?: "canManageConsole" | "canManagePlatformTraining";
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
      canManageTraining: boolean;
      canManagePlatformTraining: boolean;
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
  const isChannelsRoute = pathname === "/channels" || pathname.startsWith("/channels/");
  const isSkillsRoute = pathname === "/skills" || pathname.startsWith("/skills/");

  const navigationSections: NavigationSection[] = [
    {
      id: "main",
      items: [
        { href: "/openclaw", label: agentNavLabel, icon: Bot, requires: "canManageConsole" },
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/agents", label: "Agents", icon: Command },
        { href: "/channels", label: "Channels", icon: Cable },
        { href: "/skills", label: "Skills", icon: Puzzle },
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
    channels: [
      {
        id: "channels-setup",
        label: "Setup",
        items: [
          {
            href: "/channels",
            label: "All channels",
            active: pathname === "/channels" && !hash,
          },
          {
            href: "/channels#connect",
            label: "Connect new",
            active: hash === "#connect",
          },
        ],
      },
      {
        id: "channels-health",
        label: "Health",
        items: [
          {
            href: "/channels#status",
            label: "Status",
            active: hash === "#status",
          },
        ],
      },
    ],
    skills: [
      {
        id: "skills-library",
        label: "Library",
        items: [
          {
            href: "/skills",
            label: "Browse skills",
            active: pathname === "/skills" && !hash,
          },
          {
            href: "/skills#installed",
            label: "Installed",
            active: hash === "#installed",
          },
        ],
      },
      {
        id: "skills-manage",
        label: "Manage",
        items: [
          {
            href: "/skills#updates",
            label: "Updates",
            active: hash === "#updates",
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
    <aside className="border-b border-border-subtle bg-surface-0 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-border-subtle">
      <div
        className={cn(
          "flex h-full flex-col px-phi-5 py-phi-5 sm:px-phi-8 lg:px-phi-5 lg:py-phi-8",
          collapsed && "lg:items-center lg:px-phi-3",
        )}
      >
        <div className={cn("space-y-phi-5", collapsed && "lg:flex lg:w-full lg:flex-col lg:items-center lg:space-y-phi-3")}>
          <div className="flex items-start justify-between gap-phi-3">
            <div className={cn("flex w-full items-start justify-between gap-phi-3", collapsed && "lg:flex-col lg:items-center lg:justify-center")}>
              <Logo className="self-start" showWordmark={!collapsed} />
              {onToggle ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("hidden lg:inline-flex", collapsed && "lg:size-9 lg:rounded-md")}
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
              "rounded-lg border border-border-subtle bg-surface-1 px-phi-3 py-phi-3",
              collapsed && "lg:w-full lg:px-phi-2 lg:py-phi-2",
            )}
            title={collapsed ? orgLabel : undefined}
          >
            <div className={cn(collapsed && "lg:flex lg:flex-col lg:items-center lg:gap-phi-2")}>
              <p className={cn("text-[length:var(--text-xs)] font-medium tracking-[0.08em] uppercase text-zinc-500", collapsed && "lg:hidden")}>
                Workspace
              </p>
              <div className={cn("mt-phi-3 flex items-center gap-phi-3", collapsed && "lg:mt-0 lg:flex-col lg:gap-phi-2")}>
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-2",
                    collapsed && "lg:size-10",
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
                    <span className="text-[length:var(--text-sm)] font-medium text-white">{orgInitials}</span>
                  )}
                </div>
                <div className={cn("min-w-0", collapsed && "lg:hidden")}>
                  <p className="truncate text-[length:var(--text-sm)] font-medium text-white">{orgLabel}</p>
                </div>
                <p
                  className={cn(
                    "hidden text-[length:var(--text-sm)] font-medium text-white",
                    collapsed && "lg:inline lg:text-[length:var(--text-xs)] lg:tracking-[0.12em]",
                  )}
                >
                  {orgInitials}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className={cn("mt-phi-8 overflow-x-auto lg:flex-1 lg:overflow-visible", collapsed && "lg:mt-phi-5 lg:w-full")}>
          <div
            className={cn(
              "flex gap-phi-2 pb-1 lg:flex-col lg:gap-phi-8",
              collapsed && "lg:gap-phi-3 lg:px-phi-1 lg:py-phi-2",
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
                    "space-y-phi-1",
                    collapsed && "lg:space-y-phi-1",
                    collapsed && section.id === "admin" && "lg:border-t lg:border-border-subtle lg:pt-phi-2",
                  )}
                >
                  {section.label ? (
                    <p className={cn("hidden px-phi-2 pb-phi-1 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500 lg:block", collapsed && "lg:hidden")}>
                      {section.label}
                    </p>
                  ) : null}
                  <div className="flex gap-phi-1 lg:flex-col lg:gap-0.5">
                    {items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const contextualChildren =
                        item.href === "/settings" && isSettingsRoute
                          ? contextualGroups.settings
                          : item.href === "/agents" && isAgentsRoute
                            ? contextualGroups.agents
                            : item.href === "/channels" && isChannelsRoute
                              ? contextualGroups.channels
                              : item.href === "/skills" && isSkillsRoute
                                ? contextualGroups.skills
                                : item.href === "/knowledge" && isKnowledgeRoute
                                  ? contextualGroups.knowledge
                                  : item.href === "/account" && isAccountRoute
                                    ? contextualGroups.account
                                    : item.href === "/openclaw" && isConsoleRoute
                                      ? contextualGroups.console
                                      : [];

                      return (
                        <div key={item.href} className="space-y-0.5">
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              "flex shrink-0 items-center gap-phi-3 rounded-md px-phi-3 py-phi-2 text-[length:var(--text-sm)] text-zinc-400 transition-colors hover:bg-surface-2 hover:text-white lg:w-full",
                              collapsed &&
                                "lg:size-10 lg:w-10 lg:justify-center lg:rounded-md lg:px-0 lg:text-zinc-500 hover:lg:bg-surface-2",
                              active && "bg-surface-3 text-white",
                              collapsed && active && "lg:bg-surface-3",
                            )}
                          >
                            <item.icon className="size-4" />
                            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                          </Link>
                          {contextualChildren.length > 0 ? (
                            <div className={cn("ml-phi-3 space-y-phi-3 border-l border-border-subtle pl-phi-3", collapsed && "lg:hidden")}>
                              {contextualChildren.map((group) => (
                                <div key={group.id} className="space-y-0.5">
                                  <p className="px-phi-2 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500">
                                    {group.label}
                                  </p>
                                  {group.items.map((subitem) => (
                                    <Link
                                      key={subitem.href}
                                      href={subitem.href}
                                      className={cn(
                                        "block rounded-md px-phi-2 py-phi-2 text-[length:var(--text-sm)] transition-colors",
                                        subitem.active
                                          ? "bg-surface-3 text-white"
                                          : "text-zinc-400 hover:bg-surface-2 hover:text-white",
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

        <div className="mt-auto flex flex-col gap-phi-5">
          <div
            className={cn(
              "flex items-center gap-phi-3 px-phi-3",
              collapsed && "lg:flex-col lg:items-center lg:gap-phi-2 lg:px-0",
            )}
            title={collapsed ? statusLines.join(". ") : statusLines.join(". ")}
          >
            <span className={cn("size-2 shrink-0 rounded-full", statusColor)} />
            <span className={cn("text-[length:var(--text-xs)] text-zinc-500", collapsed && "lg:hidden")}>
              {allConnected ? "All systems online" : statusLines.join(". ")}
            </span>
          </div>

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
        </div>
      </div>
    </aside>
  );
}
