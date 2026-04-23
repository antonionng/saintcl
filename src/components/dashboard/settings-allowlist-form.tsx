"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wizard } from "@/components/ui/wizard";

export function SettingsAllowlistForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPattern("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  async function submit() {
    const next = pattern.trim();
    if (!next) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/repo-allowlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: next }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to add repo allowlist.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add repo allowlist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        <span>Add allowlist entry</span>
      </Button>

      <Wizard
        open={open}
        onOpenChange={setOpen}
        title="Add repo allowlist"
        description="Allow agents to access repositories under this pattern."
        steps={["Pattern"]}
        finalLabel="Add"
        onFinalClick={submit}
        finalLoading={saving}
        finalDisabled={!pattern.trim()}
      >
        <Wizard.Step>
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Pattern
            </label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="github.com/your-org"
            />
            <p className="text-[length:var(--text-xs)] text-white/45">
              Examples: github.com/your-org, gitlab.com/your-group/*
            </p>
          </div>
          {error ? (
            <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
              {error}
            </p>
          ) : null}
        </Wizard.Step>
      </Wizard>
    </>
  );
}
