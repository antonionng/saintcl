"use client";

import { useState } from "react";
import { Check, Code, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmbedSnippet({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/share`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not generate snippet.");
      }
      const json = await response.json();
      const token = json?.data?.token;
      if (!token) throw new Error("Invalid share token.");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const code = `<iframe src="${origin}/share/${token}" width="420" height="600" style="border:0; border-radius:12px;" title="Chat agent"></iframe>`;
      setSnippet(code);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate snippet.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <Button onClick={generate} variant="secondary" size="sm" disabled={creating}>
        {creating ? <Loader2 className="size-4 animate-spin" /> : <Code className="size-4" />}
        <span>Embed on site</span>
      </Button>
      {open && snippet ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-96 rounded-lg border border-border-subtle bg-surface-1 p-4 shadow-lg">
          <p className="text-sm font-medium text-white">Paste anywhere on your site</p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border-subtle bg-surface-0 p-3 text-xs text-zinc-300">
            {snippet}
          </pre>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleCopy} variant="secondary" size="sm">
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <p className="absolute right-0 top-full mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
