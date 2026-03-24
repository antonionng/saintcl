"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsAllowlistForm() {
  const router = useRouter();
  const [pattern, setPattern] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function addAllowlistPattern() {
    const nextPattern = pattern.trim();
    if (!nextPattern) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/repo-allowlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: nextPattern }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to add repo allowlist.");
      }

      setPattern("");
      setSuccess("Repo allowlist saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add repo allowlist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.4rem] border border-dashed border-white/16 p-4">
      <p className="text-sm text-zinc-400">Add a GitHub or GitLab org pattern</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder="github.com/your-org"
          readOnly={saving}
        />
        <Button variant="secondary" onClick={addAllowlistPattern} disabled={!pattern.trim() || saving}>
          {saving ? "Adding..." : "Add"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
    </div>
  );
}
