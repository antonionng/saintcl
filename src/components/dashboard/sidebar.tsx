"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bot,
  Cable,
  Command,
  CreditCard,
  Database,
  LayoutDashboard,
  Settings,
  TerminalSquare,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/openclaw", label: "OpenClaw Console", icon: Command, requires: "canManageConsole" },
  { href: "/connections", label: "Connections", icon: Cable },
  { href: "/knowledge", label: "Knowledge", icon: Database },
  { href: "/admin-tools", label: "Admin Tools", icon: TerminalSquare, requires: "canManageAdminTools" },
  { href: "/billing", label: "Billing", icon: CreditCard, requires: "canManageBilling" },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar({
  platformStatus,
}: {
  platformStatus: {
    supabase: boolean;
    openclaw: boolean;
    orgName: string | null;
    capabilities: {
      canManageBilling: boolean;
      canManagePolicies: boolean;
      canManageAgents: boolean;
      canViewAllAgents: boolean;
      canManageConsole: boolean;
      canManageAdminTools: boolean;
    };
  };
}) {
  const pathname = usePathname();

  const allConnected = platformStatus.supabase && platformStatus.openclaw;
  const StatusIcon = allConnected ? Activity : AlertTriangle;
  const statusColor = allConnected ? "text-emerald-400" : "text-amber-400";

  const statusLines: string[] = [];
  if (!platformStatus.supabase) statusLines.push("Supabase not configured");
  if (!platformStatus.openclaw) statusLines.push("OpenClaw gateway not connected");
  if (statusLines.length === 0) statusLines.push("All services connected");

  return (
    <aside className="flex h-full min-h-screen flex-col border-r border-white/10 bg-black/70 px-6 py-8">
      <Logo className="mb-10" />
      <nav className="space-y-2">
        {navigation
          .filter((item) => !("requires" in item) || platformStatus.capabilities[item.requires])
          .map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white",
                active && "bg-white/8 text-white",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-3 text-white">
          <StatusIcon className={cn("size-4", statusColor)} />
          {allConnected ? "Platform online" : "Setup required"}
        </div>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {platformStatus.orgName
            ? `${platformStatus.orgName} — ${statusLines.join(". ")}.`
            : statusLines.join(". ") + "."}
        </p>
      </div>
    </aside>
  );
}
