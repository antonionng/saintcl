"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const scopeOptions = [
  {
    value: "employee",
    label: "Per employee",
    description: "Dedicated agent for a single team member",
  },
  {
    value: "team",
    label: "Per team",
    description: "Shared agent across a functional team",
  },
  {
    value: "org",
    label: "Organization-wide",
    description: "Available to the entire organization",
  },
];

type CatalogModel = {
  id: string;
  label: string;
  description?: string | null;
  contextWindow?: number | null;
  inputCostPerMillionCents?: number | null;
  outputCostPerMillionCents?: number | null;
  isFree?: boolean;
  isPremium?: boolean;
};

type OrgProfile = {
  userId: string;
  email: string | null;
  isSuperAdmin?: boolean;
  displayName: string | null;
  members: OrgMember[];
};

type OrgMember = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: string;
};

type Team = {
  id: string;
  name: string;
  description: string;
};

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState("employee");
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("openrouter/auto");
  const [assignee, setAssignee] = useState("");
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [terminalEnabled, setTerminalEnabled] = useState(false);
  const [terminalRepoPaths, setTerminalRepoPaths] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const res = await fetch("/api/models/catalog", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: { approvedModels?: CatalogModel[]; defaultModel?: string };
        };
        if (cancelled) return;
        setModels(body.data?.approvedModels ?? []);
        setSelectedModel(body.data?.defaultModel ?? "openrouter/auto");
      } catch {
        if (!cancelled) {
          setModels([]);
          setSelectedModel("openrouter/auto");
        }
      }
    }

    async function loadProfile() {
      try {
        const res = await fetch("/api/org", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: OrgProfile;
        };
        if (cancelled || !body.data) return;
        setProfile(body.data);
        setAssignee((current) => current || body.data?.userId || "");
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      }
    }

    async function loadTeams() {
      try {
        const res = await fetch("/api/teams", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { data?: Team[] };
        if (cancelled || !body.data) return;
        setTeams(body.data);
      } catch {
        if (!cancelled) {
          setTeams([]);
        }
      }
    }

    void Promise.all([loadCatalog(), loadProfile(), loadTeams()]);
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMember = useMemo(
    () => profile?.members.find((member) => member.userId === assignee) ?? null,
    [assignee, profile],
  );

  useEffect(() => {
    if (scope === "employee" && profile?.userId && !profile.members.some((member) => member.userId === assignee)) {
      setAssignee(profile.userId);
    }

    if (scope === "team" && teams.length > 0 && !teams.some((team) => team.id === assignee)) {
      setAssignee(teams[0]?.id ?? "");
    }
  }, [assignee, profile, scope, teams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") || undefined,
          model: selectedModel || undefined,
          persona: form.get("persona") || undefined,
          scope,
          assignee: form.get("assignee") || undefined,
          terminalEnabled,
          terminalRepoPaths: terminalRepoPaths
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? `Provisioning failed (${res.status})`,
        );
      }

      router.push("/agents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Provisioning"
        title="Create a new agent"
        description="Create an agent for a person or team. The human leads, the agent adapts, and org guardrails stay enforced in the background."
      />

      <Card>
        <CardHeader>
          <CardTitle>Provisioning wizard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="text-sm text-zinc-400">Assign to</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {scopeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`rounded-[1.4rem] border p-4 text-left transition-colors ${
                      scope === opt.value
                        ? "border-white/18 bg-white/[0.07]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">
                      {opt.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {scope === "employee" ? (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Employee</label>
                <select
                  name="assignee"
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
                >
                  {profile?.members.map((member) => {
                    const label = member.displayName ?? member.email ?? member.userId;
                    const detail = member.email && member.displayName ? ` (${member.email})` : "";
                    const suffix = member.userId === profile.userId ? " · You" : "";
                    return (
                      <option key={member.userId} value={member.userId}>
                        {`${label}${detail}${suffix}`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-zinc-500">
                  {selectedMember
                    ? `Assigning to ${selectedMember.displayName ?? selectedMember.email ?? selectedMember.userId}.`
                    : "Defaults to your account. Pick a teammate to assign instead."}
                </p>
              </div>
            ) : scope === "team" ? (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Team</label>
                <select
                  name="assignee"
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Agent name (optional)</label>
              <Input name="name" placeholder="Auto-generated from employee or team" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Model</label>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
              >
                {models.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
                {models.length === 0 ? <option value="openrouter/auto">OpenRouter Auto</option> : null}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Starter instructions (optional)</label>
              <Textarea
                name="persona"
                rows={4}
                placeholder="What should this agent prioritize for this person/team?"
              />
            </div>

            <div className="space-y-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <label className="flex items-center gap-3 text-sm text-white">
                <input
                  type="checkbox"
                  className="app-checkbox"
                  checked={terminalEnabled}
                  onChange={(event) => setTerminalEnabled(event.target.checked)}
                />
                <span>Enable the admin terminal drawer for this agent</span>
              </label>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Git repo allowlist (optional)</label>
                <Textarea
                  rows={5}
                  value={terminalRepoPaths}
                  onChange={(event) => setTerminalRepoPaths(event.target.value)}
                  placeholder={".\nrepos/app\nrepos/docs"}
                />
                <p className="text-xs leading-6 text-zinc-500">
                  One relative path per line. Use `.` to allow git commands from the workspace root repo.
                </p>
              </div>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  "Provision agent"
                )}
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/agents">Cancel</Link>
              </Button>
            </div>
          </form>

          <div className="space-y-4 rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-6">
            <p className="app-kicker">What happens next</p>
            <ol className="space-y-4 text-sm leading-7 text-zinc-400">
              <li>
                1. Saint AGI creates an agents row scoped to the active
                organization.
              </li>
              <li>
                2. The provisioner calls config.patch on the OpenClaw gateway to
                register the agent.
              </li>
              <li>
                3. The agent gets a dedicated workspace, persona, and model
                binding.
              </li>
              <li>
                4. Connect a Telegram or Slack channel to start routing messages
                to the agent.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
