"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_TEMPLATES, type AgentTemplate, getAgentTemplate } from "@/lib/agent-templates";
import { getBuiltInPersonaById } from "@/lib/personas";
import { cn } from "@/lib/utils";

const SCOPE_OPTIONS = [
  { value: "employee", label: "Just for me", description: "Only you can see and chat with this agent." },
  { value: "team", label: "For a team", description: "Shared with a specific team." },
  { value: "org", label: "For everyone", description: "Available across the whole organization." },
] as const;

type Team = { id: string; name: string; description: string };

type OrgProfile = {
  userId: string;
  email: string | null;
  isSuperAdmin?: boolean;
  displayName: string | null;
  members: Array<{ userId: string; email: string | null; displayName: string | null; role: string }>;
};

function NewAgentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTemplateId = params.get("template");
  const [step, setStep] = useState<"pick" | "configure">(initialTemplateId ? "configure" : "pick");
  const [template, setTemplate] = useState<AgentTemplate | null>(getAgentTemplate(initialTemplateId));
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"employee" | "team" | "org">("employee");
  const [assignee, setAssignee] = useState("");
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [persona, setPersona] = useState("");
  const [model, setModel] = useState("openrouter/auto");
  const [models, setModels] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!template) return;
    setName(template.agentName);
    const personaSeed = getBuiltInPersonaById(template.personaId);
    setPersona(personaSeed?.instructions ?? "");
  }, [template]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [orgRes, teamsRes, modelsRes] = await Promise.all([
          fetch("/api/org", { cache: "no-store" }),
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/models/catalog", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (orgRes.ok) {
          const body = (await orgRes.json()) as { data?: OrgProfile };
          setProfile(body.data ?? null);
          setAssignee((current) => current || body.data?.userId || "");
        }
        if (teamsRes.ok) {
          const body = (await teamsRes.json()) as { data?: Team[] };
          setTeams(body.data ?? []);
        }
        if (modelsRes.ok) {
          const body = (await modelsRes.json()) as {
            data?: { approvedModels?: Array<{ id: string; label: string }>; defaultModel?: string };
          };
          setModels(body.data?.approvedModels ?? []);
          if (body.data?.defaultModel) setModel(body.data.defaultModel);
        }
      } catch {
        // ignore - we'll fall back to defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAssigneeOptions = useMemo(() => {
    if (scope === "employee") return profile?.members ?? [];
    if (scope === "team") return teams.map((team) => ({ userId: team.id, email: null, displayName: team.name, role: "team" }));
    return [];
  }, [profile, scope, teams]);

  function handleSelectTemplate(next: AgentTemplate) {
    setTemplate(next);
    setStep("configure");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          model: model || undefined,
          persona: persona.trim() || undefined,
          personaTemplateId: template.personaId !== "custom" ? template.personaId : undefined,
          scope,
          assignee: scope === "org" ? undefined : assignee || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Could not create agent (${res.status})`);
      }
      const body = (await res.json()) as { data?: { id?: string } };
      const agentId = body.data?.id;
      router.push(agentId ? `/agents/${agentId}/chat` : "/agents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (step === "pick" || !template) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="New agent"
          description="Pick a template tuned for the job. You can change anything later."
          action={
            <Button asChild variant="ghost">
              <Link href="/agents">Cancel</Link>
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_TEMPLATES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleSelectTemplate(entry)}
                className="group flex flex-col gap-3 rounded-md border border-border bg-transparent p-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[length:var(--text-sm)] font-medium text-white">
                    {entry.name}
                  </p>
                  <p className="text-[length:var(--text-xs)] leading-5 text-white/55">
                    {entry.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = template.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Create your ${template.agentName}`}
        description={template.description}
        action={
          <Button variant="ghost" onClick={() => setStep("pick")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Different template</span>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form
          className="space-y-5 rounded-md border border-border bg-transparent p-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Agent name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={template.agentName}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Who can use this agent
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScope(opt.value)}
                  className={cn(
                    "rounded-sm border p-3 text-left transition-colors",
                    scope === opt.value
                      ? "border-white bg-white/[0.04]"
                      : "border-border bg-transparent hover:bg-white/[0.02]",
                  )}
                >
                  <p className="text-[length:var(--text-sm)] font-medium text-white">
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[length:var(--text-xs)] leading-5 text-white/55">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {scope !== "org" ? (
            <div className="space-y-1.5">
              <label className="text-[length:var(--text-xs)] font-medium text-white/70">
                {scope === "team" ? "Team" : "Person"}
              </label>
              <select
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 py-2 text-[length:var(--text-sm)] text-white focus:border-border-strong focus:outline-none"
              >
                {scope === "team" && visibleAssigneeOptions.length === 0 ? (
                  <option value="">No teams yet</option>
                ) : null}
                {visibleAssigneeOptions.map((member) => {
                  const label = member.displayName ?? member.email ?? member.userId;
                  const suffix = member.userId === profile?.userId ? " · You" : "";
                  return (
                    <option key={member.userId} value={member.userId}>
                      {label}
                      {suffix}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : null}

          <details
            open={advancedOpen}
            onToggle={(event) =>
              setAdvancedOpen((event.target as HTMLDetailsElement).open)
            }
            className="rounded-sm border border-border-subtle bg-transparent p-3"
          >
            <summary className="cursor-pointer select-none text-[length:var(--text-sm)] font-medium text-white">
              Advanced settings
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[length:var(--text-xs)] font-medium text-white/70">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 py-2 text-[length:var(--text-sm)] text-white focus:border-border-strong focus:outline-none"
                >
                  {models.length === 0 ? (
                    <option value="openrouter/auto">OpenRouter Auto</option>
                  ) : null}
                  {models.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[length:var(--text-xs)] font-medium text-white/70">
                  Persona instructions
                </label>
                <Textarea
                  rows={5}
                  value={persona}
                  onChange={(event) => setPersona(event.target.value)}
                  placeholder="Describe how this agent should think, communicate, and prioritize work."
                />
              </div>
            </div>
          </details>

          {error ? (
            <p className="text-[length:var(--text-sm)] text-red-400">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${template.agentName}`
              )}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/agents">Cancel</Link>
            </Button>
          </div>
        </form>

        <aside className="space-y-3 rounded-md border border-border bg-transparent p-5 h-fit">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle text-white">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[length:var(--text-sm)] font-medium text-white">
                {template.name}
              </p>
              <p className="text-[length:var(--text-xs)] text-white/45">
                {template.tagline}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-[length:var(--text-sm)] leading-5 text-white/65">
            <p>{template.description}</p>
            {template.suggestedAppIds.length > 0 ? (
              <div>
                <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
                  Suggested apps
                </p>
                <p className="mt-1 text-[length:var(--text-xs)] text-white/55">
                  {template.suggestedAppIds.join(" · ")}
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function NewAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
        </div>
      }
    >
      <NewAgentInner />
    </Suspense>
  );
}
