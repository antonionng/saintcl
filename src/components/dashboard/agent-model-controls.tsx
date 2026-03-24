"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildAgentSessionKey } from "@/lib/openclaw/session-keys";

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

type SessionOverrideEntry = {
  id: string;
  session_key: string;
  model: string;
  provider?: string | null;
  created_at: string;
};

function summarizeModelDescription(model: CatalogModel | null) {
  if (!model) {
    return "This becomes the default model for new sessions on this agent.";
  }
  if (model.id === "openrouter/auto") {
    return "Routes requests across approved OpenRouter models for best-fit output.";
  }

  const description = model.description?.trim();
  if (!description) {
    return "This becomes the default model for new sessions on this agent.";
  }
  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trimEnd()}...`;
}

function describeModelFunding(model: CatalogModel | null, isSuperAdmin: boolean) {
  if (!model) {
    return null;
  }
  if (model.isFree) {
    return "Free model. No wallet balance required.";
  }
  if (isSuperAdmin) {
    return "Super admin override active. Wallet balance will not block this change.";
  }
  return "Wallet-funded model. Requires wallet balance.";
}

export function AgentModelControls(props: {
  agentId: string;
  openclawAgentId: string;
  currentModel: string;
  approvedModels: CatalogModel[];
  canManageAgents: boolean;
  isSuperAdmin: boolean;
  allowAgentOverride: boolean;
  allowSessionOverride: boolean;
  sessionOverrides: SessionOverrideEntry[];
}) {
  const router = useRouter();
  const [agentModel, setAgentModel] = useState(props.currentModel);
  const [sessionModel, setSessionModel] = useState(props.currentModel);
  const [sessionKey, setSessionKey] = useState(buildAgentSessionKey(props.openclawAgentId));
  const [loading, setLoading] = useState<"agent" | "session" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agentModelEntry = useMemo(
    () => props.approvedModels.find((entry) => entry.id === agentModel) ?? null,
    [props.approvedModels, agentModel],
  );
  const sessionModelEntry = useMemo(
    () => props.approvedModels.find((entry) => entry.id === sessionModel) ?? null,
    [props.approvedModels, sessionModel],
  );

  async function saveAgentModel() {
    setLoading("agent");
    setError(null);
    try {
      const res = await fetch(`/api/agents/${props.agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: agentModel }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to update agent model.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update agent model.");
    } finally {
      setLoading(null);
    }
  }

  async function saveSessionModel() {
    setLoading("session");
    setError(null);
    try {
      const res = await fetch(`/api/agents/${props.agentId}/session-model`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: sessionModel,
          sessionKey,
        }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to update session model.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update session model.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Agent default model</label>
        <select
          value={agentModel}
          onChange={(event) => setAgentModel(event.target.value)}
          disabled={!props.canManageAgents || !props.allowAgentOverride || loading !== null}
          className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
        >
          {props.approvedModels.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
        <p className="text-xs leading-6 text-zinc-500">
          {summarizeModelDescription(agentModelEntry)}
        </p>
        {describeModelFunding(agentModelEntry, props.isSuperAdmin) ? (
          <p className="text-xs leading-6 text-zinc-500">
            {describeModelFunding(agentModelEntry, props.isSuperAdmin)}
          </p>
        ) : null}
        {props.canManageAgents ? (
          <Button onClick={saveAgentModel} disabled={!props.allowAgentOverride || loading !== null}>
            {loading === "agent" ? "Saving..." : "Save agent default"}
          </Button>
        ) : (
          <p className="text-xs text-zinc-500">Only admins can change the agent default model.</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <div>
          <p className="text-sm font-medium text-white">Session override</p>
          <p className="text-xs text-zinc-500">
            Use this to move a live working session to another approved model without changing the agent default.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Session key</label>
          <Input
            value={sessionKey}
            onChange={(event) => setSessionKey(event.target.value)}
            readOnly={!props.allowSessionOverride || loading !== null}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Session model</label>
          <select
            value={sessionModel}
            onChange={(event) => setSessionModel(event.target.value)}
            disabled={!props.allowSessionOverride || loading !== null}
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
          >
            {props.approvedModels.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
          {describeModelFunding(sessionModelEntry, props.isSuperAdmin) ? (
            <p className="text-xs leading-6 text-zinc-500">
              {describeModelFunding(sessionModelEntry, props.isSuperAdmin)}
            </p>
          ) : null}
        </div>
        <Button onClick={saveSessionModel} disabled={!props.allowSessionOverride || loading !== null}>
          {loading === "session" ? "Applying..." : "Apply session override"}
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-white">Recent session model changes</p>
        {props.sessionOverrides.length === 0 ? (
          <p className="text-sm text-zinc-500">No session overrides have been applied yet.</p>
        ) : (
          props.sessionOverrides.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white">{entry.model}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {entry.session_key} · {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
