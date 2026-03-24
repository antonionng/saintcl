"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/account/user-avatar";
import { WorkspaceSwitcher } from "@/components/account/workspace-switcher";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { WorkspaceMembership } from "@/types";

type UserDropdownMenuProps = {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  homeHref?: string;
  homeLabel?: string;
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  showLabel?: boolean;
  workspaces?: WorkspaceMembership[];
  currentOrgId?: string | null;
};

export function UserDropdownMenu({
  email,
  displayName,
  avatarUrl,
  homeHref = "/auth/landing",
  homeLabel = "Dashboard",
  align = "right",
  className,
  triggerClassName,
  menuClassName,
  showLabel = true,
  workspaces = [],
  currentOrgId,
}: UserDropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const accountLabel = displayName ?? email ?? "Your account";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    if (!supabase) {
      window.location.href = "/login";
      return;
    }

    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-2.5 py-2 text-left text-sm text-white/90 backdrop-blur transition-colors hover:border-white/20 hover:bg-black/75 hover:text-white",
          triggerClassName,
        )}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
      >
        <UserAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
          className="size-9 rounded-full border-white/15 bg-white/[0.08] text-xs"
        />
        {showLabel ? (
          <span className="hidden max-w-36 truncate sm:inline">{accountLabel}</span>
        ) : null}
        <ChevronDown className={cn("size-4 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-30 mt-3 w-[17rem] rounded-3xl border border-white/10 bg-[#090b10]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur",
            align === "left" ? "left-0" : "right-0",
            menuClassName,
          )}
        >
          <div className="flex items-center gap-3 rounded-[1.25rem] px-3 py-3">
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              email={email}
              className="size-11 rounded-2xl border-white/12 bg-white/[0.06]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{accountLabel}</p>
              {email ? <p className="truncate text-xs text-zinc-500">{email}</p> : null}
            </div>
          </div>

          <div className="mt-1 space-y-1">
            {workspaces.length > 1 ? (
              <div className="px-3 py-2">
                <WorkspaceSwitcher workspaces={workspaces} currentOrgId={currentOrgId} />
              </div>
            ) : null}
            <Link
              href={homeHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <LayoutDashboard className="size-4" />
              <span>{homeLabel}</span>
            </Link>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Settings className="size-4" />
              <span>Personal settings</span>
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="size-4" />
              <span>{loggingOut ? "Signing out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
