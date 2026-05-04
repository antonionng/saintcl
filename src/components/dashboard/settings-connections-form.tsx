"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wizard } from "@/components/ui/wizard";

type ConnectionAgent = {
  id: string;
  name: string;
};

type ConnectionType = "telegram" | "slack";

const READY_PROVIDERS: Record<ConnectionType, { label: string; description: string; credentialHelp: string }> = {
  telegram: {
    label: "Telegram",
    description: "Fast bot-token setup for early customer support, ops, and internal workflows.",
    credentialHelp: "Create a bot with BotFather, then paste the bot token here.",
  },
  slack: {
    label: "Slack",
    description: "Team workspace setup for company channels and internal agent workflows.",
    credentialHelp: "Use the Slack team ID for the workspace this agent should serve.",
  },
};

export function SettingsConnectionsForm({
  orgId,
  agents,
}: {
  orgId: string;
  agents: ConnectionAgent[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button size="sm" onClick={() => setOpen(true)} disabled={agents.length === 0}>
          <Plus className="h-3.5 w-3.5" />
          <span>Connect channel</span>
        </Button>
        {agents.length === 0 ? (
          <p className="text-xs text-amber-300">
            Create a business agent before connecting a channel.
          </p>
        ) : null}
      </div>
      <ConnectChannelWizard
        open={open}
        onOpenChange={setOpen}
        orgId={orgId}
        agents={agents}
      />
    </>
  );
}

function ConnectChannelWizard({
  open,
  onOpenChange,
  orgId,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  agents: ConnectionAgent[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<ConnectionType>("telegram");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [botToken, setBotToken] = useState("");
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setType("telegram");
      setAgentId(agents[0]?.id ?? "");
      setBotToken("");
      setTeamId("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, agents]);

  const credentialsValid = useMemo(() => {
    return type === "telegram" ? botToken.trim().length >= 10 : teamId.trim().length >= 3;
  }, [type, botToken, teamId]);

  const canFinal = Boolean(agentId) && credentialsValid;
  const providerMeta = READY_PROVIDERS[type];

  async function submit() {
    if (!canFinal) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "telegram"
            ? { type, orgId, agentId, botToken: botToken.trim() }
            : { type, orgId, agentId, teamId: teamId.trim() },
        ),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to connect channel.");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect channel.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      title="Connect ready channel"
      description="Bind Slack or Telegram to a specific agent. Enterprise channels stay in the Connector Center until setup is productized."
      steps={["Provider", "Credentials", "Review"]}
      step={step}
      onStepChange={setStep}
      finalLabel="Connect"
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={!canFinal}
      nextDisabled={
        step === 0 ? !agentId : step === 1 ? !credentialsValid : false
      }
    >
      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            <ProviderRadio
              label={READY_PROVIDERS.telegram.label}
              description={READY_PROVIDERS.telegram.description}
              checked={type === "telegram"}
              onChange={() => setType("telegram")}
            />
            <ProviderRadio
              label={READY_PROVIDERS.slack.label}
              description={READY_PROVIDERS.slack.description}
              checked={type === "slack"}
              onChange={() => setType("slack")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Target agent
          </label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={agents.length === 0}
            className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 text-[length:var(--text-sm)] text-white"
          >
            {agents.length === 0 ? <option value="">No agents available</option> : null}
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </Wizard.Step>

      <Wizard.Step>
        {type === "telegram" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Bot token
            </label>
            <Input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:telegram-bot-token"
            />
            <p className="text-[length:var(--text-xs)] text-white/45">{providerMeta.credentialHelp}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Slack team ID
            </label>
            <Input
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="T01234567"
            />
            <p className="text-[length:var(--text-xs)] text-white/45">{providerMeta.credentialHelp}</p>
          </div>
        )}
        <p className="text-[length:var(--text-xs)] text-white/45">
          Connections are tenant-scoped, tied to an agent, and tracked through admin operations.
        </p>
      </Wizard.Step>

      <Wizard.Step>
        <ReviewRow label="Provider" value={type === "telegram" ? "Telegram" : "Slack"} />
        <ReviewRow
          label="Agent"
          value={agents.find((a) => a.id === agentId)?.name ?? "-"}
        />
        <ReviewRow
          label={type === "telegram" ? "Bot token" : "Slack team ID"}
          value={
            type === "telegram"
              ? botToken
                ? botToken.replace(/.(?=.{4})/g, "*")
                : "-"
              : teamId || "-"
          }
        />
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function ProviderRadio({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        "rounded-sm border px-3 py-2 text-[length:var(--text-sm)] font-medium transition-colors text-left",
        checked
          ? "border-white text-white"
          : "border-border text-white/55 hover:border-border-strong hover:text-white",
      ].join(" ")}
    >
      <span className="block">{label}</span>
      <span className="mt-1 block text-[length:var(--text-xs)] font-normal leading-5 text-white/45">
        {description}
      </span>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-sm)] text-white text-right break-all">
        {value}
      </span>
    </div>
  );
}
