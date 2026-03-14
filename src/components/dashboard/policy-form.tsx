"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PolicyForm({
  mission,
  reasonForAgents,
  defaultModel,
  requireApprovalOnSpend,
  guardrails,
  readOnly = false,
}: {
  mission: string;
  reasonForAgents: string;
  defaultModel?: string | null;
  requireApprovalOnSpend: boolean;
  guardrails: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const [nextMission, setNextMission] = useState(mission);
  const [nextReason, setNextReason] = useState(reasonForAgents);
  const [nextDefaultModel, setNextDefaultModel] = useState(defaultModel ?? "");
  const [nextRequireApproval, setNextRequireApproval] = useState(requireApprovalOnSpend);
  const [nextGuardrails, setNextGuardrails] = useState(
    JSON.stringify(guardrails ?? {}, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedGuardrails = useMemo(() => {
    try {
      return JSON.parse(nextGuardrails || "{}") as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [nextGuardrails]);

  async function savePolicies() {
    if (readOnly) return;
    if (!parsedGuardrails) {
      setError("Guardrails must be valid JSON.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/org-policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission: nextMission,
          reasonForAgents: nextReason,
          defaultModel: nextDefaultModel || null,
          requireApprovalOnSpend: nextRequireApproval,
          guardrails: parsedGuardrails,
        }),
      });

      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to save policies.");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save policies.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Company mission</label>
        <Textarea value={nextMission} onChange={(event) => setNextMission(event.target.value)} readOnly={readOnly} />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Why agents exist here</label>
        <Textarea value={nextReason} onChange={(event) => setNextReason(event.target.value)} readOnly={readOnly} />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Default model</label>
        <Input value={nextDefaultModel} onChange={(event) => setNextDefaultModel(event.target.value)} readOnly={readOnly} />
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={nextRequireApproval}
          onChange={(event) => setNextRequireApproval(event.target.checked)}
          disabled={readOnly}
        />
        Require approval when wallet thresholds are crossed
      </div>
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Guardrails JSON</label>
        <Textarea
          value={nextGuardrails}
          onChange={(event) => setNextGuardrails(event.target.value)}
          className="min-h-48 font-mono text-xs"
          readOnly={readOnly}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!readOnly ? (
        <Button onClick={savePolicies} disabled={saving}>
          {saving ? "Saving..." : "Save policies"}
        </Button>
      ) : null}
    </div>
  );
}

