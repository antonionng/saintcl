"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PersonaRecord } from "@/types";

type PersonaFormState = {
  name: string;
  description: string;
  instructions: string;
  icon: string;
};

const EMPTY_FORM: PersonaFormState = {
  name: "",
  description: "",
  instructions: "",
  icon: "",
};

function sortOrgPersonas(personas: PersonaRecord[]) {
  return [...personas].sort((a, b) => a.name.localeCompare(b.name));
}

function toFormState(persona: PersonaRecord | null): PersonaFormState {
  if (!persona) {
    return EMPTY_FORM;
  }

  return {
    name: persona.name,
    description: persona.description,
    instructions: persona.instructions,
    icon: persona.icon ?? "",
  };
}

export function SettingsPersonasForm({
  builtInPersonas,
  initialOrgPersonas,
  canEdit,
}: {
  builtInPersonas: PersonaRecord[];
  initialOrgPersonas: PersonaRecord[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [orgPersonas, setOrgPersonas] = useState(() => sortOrgPersonas(initialOrgPersonas));
  const [selectedId, setSelectedId] = useState<string | null>(initialOrgPersonas[0]?.id ?? null);
  const [form, setForm] = useState<PersonaFormState>(() => toFormState(initialOrgPersonas[0] ?? null));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPersona = useMemo(
    () => orgPersonas.find((persona) => persona.id === selectedId) ?? null,
    [orgPersonas, selectedId],
  );

  useEffect(() => {
    setOrgPersonas(sortOrgPersonas(initialOrgPersonas));
  }, [initialOrgPersonas]);

  useEffect(() => {
    setForm(toFormState(selectedPersona));
    setError(null);
    setSuccess(null);
  }, [selectedPersona]);

  const hasChanges = useMemo(() => {
    const baseline = toFormState(selectedPersona);
    return (
      form.name.trim() !== baseline.name.trim() ||
      form.description.trim() !== baseline.description.trim() ||
      form.instructions.trim() !== baseline.instructions.trim() ||
      form.icon.trim() !== baseline.icon.trim()
    );
  }, [form, selectedPersona]);

  function startNewPersona() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
  }

  async function savePersona() {
    if (!canEdit) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(selectedId ? `/api/personas/${selectedId}` : "/api/personas", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          instructions: form.instructions.trim(),
          icon: form.icon.trim() || null,
        }),
      });

      const body = (await response.json()) as {
        data?: PersonaRecord;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to save persona.");
      }

      const nextPersonas = selectedId
        ? orgPersonas.map((persona) => (persona.id === body.data?.id ? body.data : persona))
        : [...orgPersonas, body.data];
      const sorted = sortOrgPersonas(nextPersonas);

      setOrgPersonas(sorted);
      setSelectedId(body.data.id);
      setForm(toFormState(body.data));
      setSuccess(selectedId ? "Persona updated." : "Persona created.");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save persona.");
    } finally {
      setSaving(false);
    }
  }

  async function removePersona() {
    if (!canEdit || !selectedId || !selectedPersona) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedPersona.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/personas/${selectedId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message || "Unable to delete persona.");
      }

      const remaining = orgPersonas.filter((persona) => persona.id !== selectedId);
      setOrgPersonas(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setForm(toFormState(remaining[0] ?? null));
      setSuccess("Persona deleted.");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete persona.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Built-in personas</CardTitle>
            <CardDescription>
              Shipped SaintClaw persona templates available during agent provisioning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {builtInPersonas.map((persona) => (
              <div key={persona.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{persona.name}</p>
                    <p className="mt-2 text-sm text-zinc-400">{persona.description}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">Built-in</span>
                </div>
                <Textarea className="mt-4" value={persona.instructions} rows={6} readOnly />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>Custom personas</CardTitle>
            <CardDescription>
              Create org-specific personas for roles, teams, or working styles unique to your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {canEdit ? (
                <Button type="button" variant="secondary" onClick={startNewPersona} disabled={saving || deleting}>
                  New persona
                </Button>
              ) : null}
              {!canEdit ? (
                <p className="text-sm text-zinc-500">Only admins can create or edit custom personas.</p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-3">
                {orgPersonas.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                    No custom personas yet.
                  </div>
                ) : (
                  orgPersonas.map((persona) => {
                    const active = selectedId === persona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setSelectedId(persona.id)}
                        className={`w-full rounded-[1.4rem] border p-4 text-left transition-colors ${
                          active
                            ? "border-white/18 bg-white/[0.07]"
                            : "border-white/8 bg-white/[0.03] hover:border-white/14"
                        }`}
                      >
                        <p className="font-medium text-white">{persona.name}</p>
                        <p className="mt-2 text-sm text-zinc-400">{persona.description || "No description yet."}</p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="space-y-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="space-y-2">
                  <label className="app-field-label">Name</label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    readOnly={!canEdit || saving || deleting}
                    placeholder="Account Executive"
                  />
                </div>
                <div className="space-y-2">
                  <label className="app-field-label">Description</label>
                  <Input
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    readOnly={!canEdit || saving || deleting}
                    placeholder="Short summary shown in the picker"
                  />
                </div>
                <div className="space-y-2">
                  <label className="app-field-label">Icon (optional)</label>
                  <Input
                    value={form.icon}
                    onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                    readOnly={!canEdit || saving || deleting}
                    placeholder="briefcase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="app-field-label">Instructions</label>
                  <Textarea
                    value={form.instructions}
                    onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                    readOnly={!canEdit || saving || deleting}
                    rows={12}
                    placeholder="Describe the persona's working style, priorities, and communication approach."
                  />
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
                {canEdit ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={savePersona}
                      disabled={
                        saving ||
                        deleting ||
                        form.name.trim().length < 2 ||
                        form.instructions.trim().length < 3 ||
                        (selectedId ? !hasChanges : false)
                      }
                    >
                      {saving ? "Saving..." : selectedId ? "Save persona" : "Create persona"}
                    </Button>
                    {selectedId ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="border-red-400/30 bg-red-400/10 text-red-100 hover:border-red-400/40 hover:bg-red-400/[0.16]"
                        onClick={removePersona}
                        disabled={saving || deleting}
                      >
                        {deleting ? "Deleting..." : "Delete persona"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
