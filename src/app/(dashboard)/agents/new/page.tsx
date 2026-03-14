"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState("employee");

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
          model: form.get("model") || undefined,
          persona: form.get("persona") || undefined,
          scope,
          assignee: form.get("assignee") || undefined,
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
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      scope === opt.value
                        ? "border-white/25 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/14"
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
                <label className="text-sm text-zinc-400">Employee name or email</label>
                <Input name="assignee" placeholder="jane@company.com" />
              </div>
            ) : scope === "team" ? (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Team name</label>
                <Input name="assignee" placeholder="Revenue, Engineering, Ops…" />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Agent name (optional)</label>
              <Input name="name" placeholder="Auto-generated from employee or team" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Model (optional override)</label>
              <Input
                name="model"
                defaultValue="anthropic/claude-sonnet-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Starter instructions (optional)</label>
              <Textarea
                name="persona"
                rows={4}
                placeholder="What should this agent prioritize for this person/team?"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Provisioning…
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

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              What happens next
            </p>
            <ol className="space-y-4 text-sm leading-7 text-zinc-400">
              <li>
                1. SaintClaw creates an agents row scoped to the active
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
