import Link from "next/link";
import { Cable, MessageCircle, Plus, Radio } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChannelSetupWizard } from "@/components/dashboard/channel-setup-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrg, getChannels, getAgents } from "@/lib/dal";

type ChannelRow = {
  id: string;
  type: string;
  status: string | null;
  agent_id: string | null;
  created_at: string;
  agents?: { name: string } | null;
};

const CHANNEL_LABELS: Record<string, { label: string; description: string }> = {
  telegram: { label: "Telegram", description: "Bot API long-polling or webhook" },
  slack: { label: "Slack", description: "Socket Mode or Events API" },
  whatsapp: { label: "WhatsApp", description: "WhatsApp Web via Baileys" },
  discord: { label: "Discord", description: "Bot gateway with intents" },
};

function resolveStatusVariant(status: string): "success" | "warning" | "default" {
  if (status === "connected" || status === "online") return "success";
  if (status === "pending" || status === "action_required") return "warning";
  if (status === "failed" || status === "error") return "warning";
  return "default";
}

export default async function ChannelsPage() {
  const session = await getCurrentOrg();
  const orgId = session?.org.id;

  const [channels, agents] = orgId
    ? await Promise.all([getChannels(orgId), getAgents(orgId)])
    : [[], []];

  const agentOptions = agents.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-phi-13">
      <PageHeader
        eyebrow="Channels"
        title="Channel hub"
        description="Connect messaging platforms to your agents. Each channel routes inbound messages to the right agent session."
        action={
          <Button asChild>
            <Link href="/channels#connect">
              <Plus className="mr-2 size-4" />
              Connect channel
            </Link>
          </Button>
        }
      />

      <section id="status">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="size-4" />
              Connected channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <EmptyState
                icon={Cable}
                title="No channels connected"
                description="Connect Telegram, Slack, or WhatsApp to start receiving messages through your agents."
                action={
                  <Button asChild size="sm">
                    <Link href="/channels#connect">Connect your first channel</Link>
                  </Button>
                }
                className="py-phi-8"
              />
            ) : (
              <div className="space-y-phi-3">
                {(channels as ChannelRow[]).map((channel) => {
                  const meta = CHANNEL_LABELS[channel.type] ?? { label: channel.type, description: "" };
                  const agentName = channel.agents?.name ?? channel.agent_id?.slice(0, 8) ?? "unassigned";
                  return (
                    <Card key={channel.id} variant="inset" className="p-phi-5">
                      <div className="flex items-center justify-between gap-phi-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="size-4 text-zinc-400" />
                            <p className="text-[length:var(--text-sm)] font-medium text-white">{meta.label}</p>
                          </div>
                          <p className="mt-phi-2 text-[length:var(--text-sm)] text-zinc-400">
                            Agent: {agentName}
                            {meta.description ? ` -- ${meta.description}` : ""}
                          </p>
                        </div>
                        <Badge variant={resolveStatusVariant(channel.status ?? "pending")}>
                          {channel.status ?? "pending"}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="connect">
        <Card>
          <CardHeader>
            <CardTitle>Connect a new channel</CardTitle>
          </CardHeader>
          <CardContent>
            {orgId ? (
              <ChannelSetupWizard orgId={orgId} agents={agentOptions} />
            ) : (
              <p className="text-sm text-zinc-400">Organization session required.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
