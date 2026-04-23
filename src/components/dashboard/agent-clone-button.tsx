"use client";

import { Copy, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AgentCloneButton({
  agentId,
  size = "sm",
  variant = "ghost",
  redirectToChat = true,
}: {
  agentId: string;
  size?: "sm" | "default";
  variant?: "ghost" | "secondary" | "default" | "outline";
  redirectToChat?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/clone`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { data?: { id?: string }; error?: { message?: string } } | null;
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Could not duplicate agent.");
      }
      const newId = body?.data?.id;
      if (newId && redirectToChat) {
        router.push(`/agents/${newId}/chat`);
      } else {
        router.refresh();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not duplicate agent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleClone} disabled={loading}>
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Copy className="size-4" />}
      <span>{loading ? "Duplicating..." : "Duplicate"}</span>
    </Button>
  );
}
