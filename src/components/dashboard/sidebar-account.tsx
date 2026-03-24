"use client";

import { LogIn, LogOut, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UserAvatar } from "@/components/account/user-avatar";
import { WorkspaceSwitcher } from "@/components/account/workspace-switcher";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { WorkspaceMembership } from "@/types";

export function SidebarAccount({
  email,
  displayName,
  avatarUrl,
  orgName,
  role,
  hasSupabase,
  collapsed = false,
  workspaces = [],
  currentOrgId,
}: {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  orgName: string | null;
  role?: string | null;
  hasSupabase: boolean;
  collapsed?: boolean;
  workspaces?: WorkspaceMembership[];
  currentOrgId?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const accountLabel = displayName ?? email ?? orgName ?? "Saint AGI";

  async function handleLogout() {
    const supabase = createClient();
    if (!supabase) {
      router.push("/login");
      return;
    }

    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (collapsed) {
    return (
      <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center lg:gap-3 lg:rounded-[1.75rem] lg:border lg:border-white/8 lg:bg-white/[0.025] lg:px-2 lg:py-3 lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <UserAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
          className="size-12 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))]"
        />
        <Button variant="secondary" asChild className="size-11 rounded-2xl px-0">
          <Link href="/account" aria-label="Account" title="Account">
            <UserCircle2 className="size-4" />
          </Link>
        </Button>
        {hasSupabase && email ? (
          <Button
            variant="secondary"
            className="size-11 rounded-2xl px-0"
            onClick={handleLogout}
            disabled={loading}
            aria-label={loading ? "Signing out" : "Log out"}
            title={loading ? "Signing out" : "Log out"}
          >
            <LogOut className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary" asChild className="size-11 rounded-2xl px-0">
            <Link href="/login" aria-label="Log in" title="Log in">
              <LogIn className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">Account</p>
        {role ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-zinc-400">
            {role}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2.5">
        <UserAvatar avatarUrl={avatarUrl} displayName={displayName} email={email} className="size-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/95">
            {accountLabel}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {hasSupabase ? orgName ?? "Workspace" : "Demo mode"}
          </p>
        </div>
      </div>

      <WorkspaceSwitcher
        workspaces={workspaces}
        currentOrgId={currentOrgId}
        className="mt-3"
        labelClassName="text-[0.62rem]"
        selectClassName="rounded-lg py-2"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" asChild className="h-10 w-full justify-center rounded-lg px-3">
          <Link href="/account" aria-label="Account" title="Account">
            <UserCircle2 className="size-4" />
            <span>Account</span>
          </Link>
        </Button>
        {hasSupabase && email ? (
          <Button
            variant="secondary"
            className="h-10 w-full justify-center rounded-lg px-3"
            onClick={handleLogout}
            disabled={loading}
            aria-label={loading ? "Signing out" : "Log out"}
            title={loading ? "Signing out" : "Log out"}
          >
            <LogOut className="size-4" />
            <span>{loading ? "Signing out..." : "Log out"}</span>
          </Button>
        ) : (
          <Button variant="secondary" asChild className="h-10 w-full justify-center rounded-lg px-3">
            <Link href="/login" aria-label="Log in" title="Log in">
              <LogIn className="size-4" />
              <span>Log in</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
