"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChannelType = "telegram" | "slack" | "whatsapp" | "discord";

type WizardStep = "select" | "credentials" | "policy" | "verify";

type Agent = { id: string; name: string };

const CHANNEL_OPTIONS: Array<{
  id: ChannelType;
  label: string;
  description: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  available: boolean;
}> = [
  {
    id: "telegram",
    label: "Telegram",
    description: "Fastest to set up. Create a bot with @BotFather and paste the token.",
    credentialLabel: "Bot token",
    credentialPlaceholder: "123456789:ABCdefGHI...",
    available: true,
  },
  {
    id: "slack",
    label: "Slack",
    description: "Connect via Socket Mode for team-integrated workflows.",
    credentialLabel: "Slack team ID",
    credentialPlaceholder: "T01234567",
    available: true,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Connect via WhatsApp Web. Requires QR code scan from the gateway.",
    credentialLabel: "Phone number (E.164)",
    credentialPlaceholder: "+15551234567",
    available: false,
  },
  {
    id: "discord",
    label: "Discord",
    description: "Connect a Discord bot with gateway intents for server messaging.",
    credentialLabel: "Bot token",
    credentialPlaceholder: "Discord bot token",
    available: false,
  },
];

const POLICY_PRESETS = [
  { id: "personal", label: "Personal assistant", description: "DM only, strict allowlist. Best for single-user setups." },
  { id: "team", label: "Team support bot", description: "DM and specific groups with mention gating. Good for team channels." },
  { id: "open", label: "Public (lite)", description: "Broad access with mention required. For community-facing bots." },
] as const;

export function ChannelSetupWizard({ orgId, agents }: { orgId: string; agents: Agent[] }) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("select");
  const [channelType, setChannelType] = useState<ChannelType | null>(null);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [credential, setCredential] = useState("");
  const [policyPreset, setPolicyPreset] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const channelMeta = useMemo(
    () => CHANNEL_OPTIONS.find((c) => c.id === channelType) ?? null,
    [channelType],
  );

  const canSubmitCredentials = useMemo(() => {
    if (!agentId || !channelType) return false;
    return credential.trim().length >= 5;
  }, [agentId, channelType, credential]);

  async function handleConnect() {
    if (!channelType || !canSubmitCredentials) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        type: channelType,
        orgId,
        agentId,
      };

      if (channelType === "telegram") {
        body.botToken = credential.trim();
      } else if (channelType === "slack") {
        body.teamId = credential.trim();
      }

      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(data.error?.message || "Connection failed.");

      setSuccess(true);
      setStep("verify");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "select") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">Choose a channel to connect to your agent.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHANNEL_OPTIONS.map((option) => (
            <button
              key={option.id}
              disabled={!option.available}
              onClick={() => {
                setChannelType(option.id);
                setStep("credentials");
              }}
              className={`rounded-lg border p-4 text-left transition-colors ${
                option.available
                  ? "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                  : "cursor-not-allowed border-white/5 bg-white/[0.015] opacity-50"
              }`}
            >
              <p className="text-sm font-medium text-white">{option.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{option.description}</p>
              {!option.available && (
                <p className="mt-2 text-xs text-zinc-500">Coming soon</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "credentials") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("select")} className="text-sm text-zinc-400 hover:text-white">
            &larr; Back
          </button>
          <span className="text-sm text-zinc-500">|</span>
          <span className="text-sm font-medium text-white">{channelMeta?.label} setup</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="app-field-label">Target agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={loading || agents.length === 0}
              className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white"
            >
              {agents.length === 0 && <option value="">No agents available</option>}
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="app-field-label">{channelMeta?.credentialLabel ?? "Credential"}</label>
            <Input
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={channelMeta?.credentialPlaceholder}
              readOnly={loading}
            />
          </div>
        </div>

        {error && <p className="flex items-center gap-2 text-sm text-red-400"><AlertCircle className="size-4" />{error}</p>}

        <div className="flex gap-3">
          <Button onClick={() => setStep("policy")} disabled={!canSubmitCredentials}>
            Next: Policy preset
          </Button>
        </div>
      </div>
    );
  }

  if (step === "policy") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("credentials")} className="text-sm text-zinc-400 hover:text-white">
            &larr; Back
          </button>
          <span className="text-sm text-zinc-500">|</span>
          <span className="text-sm font-medium text-white">Access policy</span>
        </div>

        <p className="text-sm text-zinc-400">Choose a default access policy. You can customize this later in the agent&apos;s channel config.</p>

        <div className="space-y-2">
          {POLICY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPolicyPreset(preset.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                policyPreset === preset.id
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.035] hover:border-white/20"
              }`}
            >
              <p className="text-sm font-medium text-white">{preset.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{preset.description}</p>
            </button>
          ))}
        </div>

        {error && <p className="flex items-center gap-2 text-sm text-red-400"><AlertCircle className="size-4" />{error}</p>}

        <Button onClick={handleConnect} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Connecting...</> : "Connect channel"}
        </Button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        {success ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">{channelMeta?.label} connection queued</p>
              <p className="mt-1 text-sm text-zinc-400">
                The channel handshake is in progress. Check the status card above for live updates.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Verifying connection status...</p>
        )}
        <Button variant="secondary" onClick={() => { setStep("select"); setChannelType(null); setCredential(""); setSuccess(false); }}>
          Connect another channel
        </Button>
      </div>
    );
  }

  return null;
}
