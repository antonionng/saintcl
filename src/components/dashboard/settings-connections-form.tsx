"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConnectionAgent = {
  id: string;
  name: string;
};

type ConnectionType = "telegram" | "slack";

export function SettingsConnectionsForm({
  orgId,
  agents,
}: {
  orgId: string;
  agents: ConnectionAgent[];
}) {
  const router = useRouter();
  const [type, setType] = useState<ConnectionType>("telegram");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [botToken, setBotToken] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!agentId) {
      return false;
    }

    return type === "telegram" ? botToken.trim().length >= 10 : teamId.trim().length >= 3;
  }, [agentId, botToken, teamId, type]);

  async function connectChannel() {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "telegram"
            ? {
                type,
                orgId,
                agentId,
                botToken: botToken.trim(),
              }
            : {
                type,
                orgId,
                agentId,
                teamId: teamId.trim(),
              },
        ),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to connect channel.");
      }

      setSuccess(`${type === "telegram" ? "Telegram" : "Slack"} channel connection queued.`);
      if (type === "telegram") {
        setBotToken("");
      } else {
        setTeamId("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect channel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="app-field-label">Provider</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ConnectionType)}
            disabled={loading}
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
          >
            <option value="telegram">Telegram</option>
            <option value="slack">Slack</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="app-field-label">Target agent</label>
          <select
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            disabled={loading || agents.length === 0}
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
          >
            {agents.length === 0 ? <option value="">No agents available</option> : null}
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "telegram" ? (
        <div className="space-y-2">
          <label className="app-field-label">Bot token</label>
          <Input
            value={botToken}
            onChange={(event) => setBotToken(event.target.value)}
            placeholder="123456789:telegram-bot-token"
            readOnly={loading}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="app-field-label">Slack team ID</label>
          <Input
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            placeholder="T01234567"
            readOnly={loading}
          />
        </div>
      )}

      <p className="text-sm leading-6 text-zinc-500">
        New channel connections are tenant-scoped, charged through the existing usage pipeline, and queued as pending until the downstream provider handshake completes.
      </p>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      <Button onClick={connectChannel} disabled={!canSubmit || loading || agents.length === 0}>
        {loading ? "Connecting..." : "Connect channel"}
      </Button>
    </div>
  );
}
