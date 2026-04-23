"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AgentShareButton({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createLink = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/share`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not create share link.");
      }
      const json = await response.json();
      const token = json?.data?.token;
      if (!token) throw new Error("Invalid share token.");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/share/${token}`);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create share link.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <Button onClick={createLink} variant="secondary" size="sm" disabled={creating}>
        {creating ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
        <span>Share test link</span>
      </Button>
      {open && shareUrl ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-lg border border-border-subtle bg-surface-1 p-4 shadow-lg">
          <p className="text-sm font-medium text-white">Share this link</p>
          <p className="mt-1 text-xs text-zinc-500">Valid for 7 days. Replies count against your wallet.</p>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-surface-0 px-3 py-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-white outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="text-zinc-400 hover:text-white"
              aria-label="Copy"
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="absolute right-0 top-full mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
