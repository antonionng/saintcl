"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wizard } from "@/components/ui/wizard";
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
  if (!persona) return EMPTY_FORM;
  return {
    name: persona.name,
    description: persona.description,
    instructions: persona.instructions,
    icon: persona.icon ?? "",
  };
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        <h3 className="text-[length:var(--text-base)] font-medium text-white">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[length:var(--text-xs)] text-white/55">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
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
  const [editing, setEditing] = useState<PersonaRecord | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setOrgPersonas(sortOrgPersonas(initialOrgPersonas));
  }, [initialOrgPersonas]);

  function openCreate() {
    setEditing(null);
    setWizardOpen(true);
  }

  function openEdit(persona: PersonaRecord) {
    setEditing(persona);
    setWizardOpen(true);
  }

  async function deletePersona(id: string) {
    const target = orgPersonas.find((p) => p.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Delete "${target.name}"?`);
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/personas/${id}`, { method: "DELETE" });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to delete persona.");
      }
      setOrgPersonas((cur) => cur.filter((p) => p.id !== id));
      setSuccess("Persona deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete persona.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Custom personas"
          description="Workspace-specific personas available during agent provisioning."
          action={
            canEdit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" />
                <span>New persona</span>
              </Button>
            ) : undefined
          }
        />
        {error ? (
          <p className="mb-3 rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mb-3 rounded-sm border border-emerald-500/30 px-3 py-2 text-[length:var(--text-xs)] text-emerald-300">
            {success}
          </p>
        ) : null}
        <div className="border border-border rounded-md overflow-hidden">
          {orgPersonas.length === 0 ? (
            <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
              No custom personas yet.
            </p>
          ) : (
            <ul>
              {orgPersonas.map((persona) => (
                <li
                  key={persona.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0 hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">{persona.name}</p>
                    <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-white/45">
                      {persona.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(persona)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePersona(persona.id)}
                          disabled={deletingId === persona.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Built-in personas"
          description="Shipped Saint AGI templates available to all workspaces."
        />
        <div className="border border-border rounded-md overflow-hidden">
          {builtInPersonas.length === 0 ? (
            <p className="px-4 py-6 text-center text-[length:var(--text-sm)] text-white/55">
              None.
            </p>
          ) : (
            <ul>
              {builtInPersonas.map((persona) => (
                <li
                  key={persona.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-sm)] text-white">{persona.name}</p>
                    <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-white/45">
                      {persona.description}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-sm border border-border-subtle px-2 py-0.5 text-[length:var(--text-xs)] text-white/55">
                    Built-in
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <PersonaWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        editing={editing}
        onSaved={(persona, isNew) => {
          setOrgPersonas((cur) =>
            sortOrgPersonas(
              isNew ? [...cur, persona] : cur.map((p) => (p.id === persona.id ? persona : p)),
            ),
          );
          setWizardOpen(false);
          setSuccess(isNew ? "Persona created." : "Persona updated.");
          router.refresh();
        }}
      />
    </div>
  );
}

function PersonaWizard({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PersonaRecord | null;
  onSaved: (persona: PersonaRecord, isNew: boolean) => void;
}) {
  const isEdit = Boolean(editing);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PersonaFormState>(toFormState(editing));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toFormState(editing));
      setStep(0);
      setError(null);
      setSubmitting(false);
    }
  }, [open, editing]);

  const validBasics = form.name.trim().length >= 2;
  const validInstructions = form.instructions.trim().length >= 3;

  async function submit() {
    if (!validBasics || !validInstructions) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/personas/${editing!.id}` : "/api/personas", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          instructions: form.instructions.trim(),
          icon: form.icon.trim() || null,
        }),
      });
      const body = (await res.json()) as {
        data?: PersonaRecord;
        error?: { message?: string };
      };
      if (!res.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to save persona.");
      }
      onSaved(body.data, !isEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save persona.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit persona" : "New persona"}
      description="Personas shape the role and tone of your agents."
      steps={["Basics", "Instructions", "Review"]}
      step={step}
      onStepChange={setStep}
      finalLabel={isEdit ? "Save" : "Create"}
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={!validBasics || !validInstructions}
      nextDisabled={step === 0 ? !validBasics : step === 1 ? !validInstructions : false}
      size="lg"
    >
      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="Account Executive"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Description
          </label>
          <Input
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            placeholder="Short summary shown in the picker"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Icon (optional)
          </label>
          <Input
            value={form.icon}
            onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))}
            placeholder="briefcase"
          />
        </div>
      </Wizard.Step>

      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Instructions
          </label>
          <Textarea
            value={form.instructions}
            onChange={(e) => setForm((c) => ({ ...c, instructions: e.target.value }))}
            placeholder="Describe the persona's working style, priorities, and communication approach."
            rows={12}
            className="min-h-48"
          />
        </div>
      </Wizard.Step>

      <Wizard.Step>
        <ReviewRow label="Name" value={form.name || "-"} />
        <ReviewRow label="Description" value={form.description || "(none)"} />
        <ReviewRow label="Icon" value={form.icon || "(none)"} />
        <div className="flex flex-col gap-1 border-b border-border-subtle py-2 last:border-b-0">
          <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
            Instructions
          </span>
          <pre className="whitespace-pre-wrap text-[length:var(--text-xs)] leading-relaxed text-white/80">
            {form.instructions}
          </pre>
        </div>
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-sm)] text-white text-right">{value}</span>
    </div>
  );
}
