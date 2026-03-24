"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AgentDeleteButton({
  agentId,
  agentName,
  redirectTo,
}: {
  agentId: string;
  agentName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${agentName}? This removes its workspace files, runtime state, and channel bindings.`,
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message || "Unable to delete agent.");
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete agent.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
      {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      <span>{deleting ? "Deleting..." : "Delete"}</span>
    </Button>
  );
}
