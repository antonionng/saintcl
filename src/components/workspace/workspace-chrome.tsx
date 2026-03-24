"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageSquare, UserCircle2 } from "lucide-react";

import { UserDropdownMenu } from "@/components/account/user-dropdown-menu";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import type { WorkspaceMembership } from "@/types";

const workspaceNavItems = [
  {
    href: "/workspace",
    label: "Workspace",
    icon: MessageSquare,
    matches: (pathname: string) => pathname === "/workspace",
  },
  {
    href: "/workspace/knowledge",
    label: "Knowledge",
    icon: BookOpen,
    matches: (pathname: string) => pathname === "/workspace/knowledge" || pathname.startsWith("/workspace/knowledge/"),
  },
  {
    href: "/account",
    label: "Account",
    icon: UserCircle2,
    matches: (pathname: string) => pathname === "/account" || pathname.startsWith("/account/"),
  },
] as const;

export function WorkspaceChrome({
  children,
  email,
  displayName,
  avatarUrl,
  workspaces = [],
  currentOrgId,
}: {
  children: React.ReactNode;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  workspaces?: WorkspaceMembership[];
  currentOrgId?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,#111316_0%,#090a0d_40%,#08090b_100%)] text-white lg:grid lg:grid-cols-[88px_minmax(0,1fr)]">
      <aside className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(7,8,10,0.92),rgba(10,11,14,0.88))] backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:h-full lg:flex-col lg:items-center lg:justify-start lg:gap-5 lg:px-2.5 lg:py-5">
          <Logo className="shrink-0 lg:self-center" showWordmark={false} />

          <UserDropdownMenu
            email={email}
            displayName={displayName}
            avatarUrl={avatarUrl}
            homeHref="/workspace"
            homeLabel="Workspace"
            align="left"
            showLabel={false}
            workspaces={workspaces}
            currentOrgId={currentOrgId}
            className="shrink-0"
            triggerClassName="rounded-2xl border-white/8 bg-white/[0.04] px-2 py-2 lg:h-12 lg:w-12 lg:justify-center lg:px-0"
          />

          <nav className="flex flex-1 items-center justify-end gap-2 lg:w-full lg:flex-col lg:justify-start">
            {workspaceNavItems.map((item) => {
              const active = item.matches(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "flex h-11 min-w-11 items-center justify-center rounded-2xl border border-white/0 bg-transparent text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/[0.04] hover:text-white lg:w-11",
                    active &&
                      "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.2)]",
                  )}
                >
                  <item.icon className="size-4" />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
