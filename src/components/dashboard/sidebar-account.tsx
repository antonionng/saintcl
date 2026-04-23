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
  const accountLabel = displayName ?? email ?? orgName ?? "SaintClaw";

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
      <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center lg:gap-phi-2 lg:py-phi-2">
        <UserAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
          className="size-10 rounded-lg"
        />
        <Button variant="ghost" asChild className="size-10 rounded-md px-0">
          <Link href="/account" aria-label="Account" title="Account">
            <UserCircle2 className="size-4" />
          </Link>
        </Button>
        {hasSupabase && email ? (
          <Button
            variant="ghost"
            className="size-10 rounded-md px-0"
            onClick={handleLogout}
            disabled={loading}
            aria-label={loading ? "Signing out" : "Log out"}
            title={loading ? "Signing out" : "Log out"}
          >
            <LogOut className="size-4" />
          </Button>
        ) : (
          <Button variant="ghost" asChild className="size-10 rounded-md px-0">
            <Link href="/login" aria-label="Log in" title="Log in">
              <LogIn className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-border-subtle pt-phi-5">
      <div className="flex items-center gap-phi-3">
        <UserAvatar avatarUrl={avatarUrl} displayName={displayName} email={email} className="size-9 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[length:var(--text-sm)] font-medium text-white/95">
            {accountLabel}
          </p>
          <p className="truncate text-[length:var(--text-xs)] text-zinc-500">
            {hasSupabase ? orgName ?? "Workspace" : "Demo mode"}
            {role ? ` · ${role}` : ""}
          </p>
        </div>
      </div>

      <WorkspaceSwitcher
        workspaces={workspaces}
        currentOrgId={currentOrgId}
        className="mt-phi-3"
        labelClassName="text-[length:var(--text-xs)]"
        selectClassName="rounded-md py-2"
      />

      <div className="mt-phi-3 flex items-center gap-phi-2">
        <Button variant="ghost" asChild size="sm" className="rounded-md">
          <Link href="/account" aria-label="Account" title="Account">
            <UserCircle2 className="size-3.5" />
            <span>Account</span>
          </Link>
        </Button>
        {hasSupabase && email ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md"
            onClick={handleLogout}
            disabled={loading}
            aria-label={loading ? "Signing out" : "Log out"}
            title={loading ? "Signing out" : "Log out"}
          >
            <LogOut className="size-3.5" />
            <span>{loading ? "Signing out..." : "Log out"}</span>
          </Button>
        ) : (
          <Button variant="ghost" asChild size="sm" className="rounded-md">
            <Link href="/login" aria-label="Log in" title="Log in">
              <LogIn className="size-3.5" />
              <span>Log in</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
