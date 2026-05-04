"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AgentPersonaEditorProps = {
  agentId: string;
  initialPersona: string;
  canEdit: boolean;
};

export function AgentPersonaEditor({
  agentId,
  initialPersona,
  canEdit,
}: AgentPersonaEditorProps) {
  const router = useRouter();
  const [persona, setPersona] = useState(initialPersona);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = persona !== initialPersona;

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: persona.trim() }),
      });
      const body = (await response.json()) as {
        data?: unknown;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(body.error?.message ?? "Unable to update persona.");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update persona.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={persona}
        onChange={(event) => {
          setPersona(event.target.value);
          setSaved(false);
        }}
        readOnly={!canEdit}
        rows={6}
        className="min-h-32 text-sm leading-7"
      />
      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : "Save persona"}
          </Button>
          {saved ? <p className="text-xs text-emerald-400">Persona updated and synced to agent.</p> : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
