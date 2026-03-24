"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { WorkspaceMembership } from "@/types";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceMembership[];
  currentOrgId?: string | null;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
};

export function WorkspaceSwitcher({
  workspaces,
  currentOrgId,
  className,
  labelClassName,
  selectClassName,
  errorClassName,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrgId ?? workspaces[0]?.org.id ?? "");
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOrgId(currentOrgId ?? workspaces[0]?.org.id ?? "");
  }, [currentOrgId, workspaces]);

  if (workspaces.length <= 1) {
    return null;
  }

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextOrgId = event.target.value;
    setSelectedOrgId(nextOrgId);
    setError(null);

    if (!nextOrgId || nextOrgId === currentOrgId) {
      return;
    }

    setSwitching(true);

    try {
      const response = await fetch("/api/org/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId: nextOrgId }),
      });

      const payload = (await response.json()) as {
        data?: { redirectTo?: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data?.redirectTo) {
        throw new Error(payload.error?.message || "Unable to switch workspaces.");
      }

      router.push(payload.data.redirectTo);
      router.refresh();
    } catch (switchError) {
      setSelectedOrgId(currentOrgId ?? workspaces[0]?.org.id ?? "");
      setError(switchError instanceof Error ? switchError.message : "Unable to switch workspaces.");
      setSwitching(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500", labelClassName)}>
          Switch workspace
        </p>
        {switching ? <LoaderCircle className="size-3.5 animate-spin text-zinc-400" /> : null}
      </div>
      <select
        value={selectedOrgId}
        onChange={handleChange}
        disabled={switching}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-70",
          selectClassName,
        )}
        aria-label="Switch workspace"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.org.id} value={workspace.org.id} className="bg-[#090b10] text-white">
            {workspace.org.name}
          </option>
        ))}
      </select>
      {error ? <p className={cn("text-xs text-amber-200", errorClassName)}>{error}</p> : null}
    </div>
  );
}
