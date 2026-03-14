import { Cable, QrCode, Slack } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChannels, getCurrentOrg } from "@/lib/dal";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  telegram: QrCode,
  slack: Slack,
};

export default async function ConnectionsPage() {
  const session = await getCurrentOrg();
  const channels = session?.org.id ? await getChannels(session.org.id) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Connections"
        title="Channel bindings"
        description="Manage Telegram bot tokens, Slack OAuth workspaces, and routing bindings inside each tenant-scoped OpenClaw runtime."
        action={<Button variant="secondary">Connect channel</Button>}
      />

      {channels.length === 0 ? (
        <EmptyState
          icon={Cable}
          title="No channels connected"
          description="Connect a Telegram bot or Slack workspace to route messages to your agents."
          action={<Button variant="secondary">Connect your first channel</Button>}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {channels.map((channel) => {
            const Icon = icons[channel.type] ?? Cable;
            const agentName =
              (channel.agents as { name: string } | null)?.name ?? channel.agent_id;

            return (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-white/10 bg-white/5 p-3">
                        <Icon className="size-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="capitalize">{channel.type}</CardTitle>
                        <p className="mt-2 text-sm text-zinc-400">
                          Agent: {agentName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={channel.status === "connected" ? "success" : "warning"}
                    >
                      {channel.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-zinc-400">
                  <p>
                    Connected:{" "}
                    {channel.connected_at
                      ? new Date(channel.connected_at).toLocaleDateString()
                      : "Pending"}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary">Reconnect</Button>
                    <Button variant="ghost">Disconnect</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connection flow</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Cable className="size-5 text-white" />
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              1. Collect bot token or OAuth approval and validate the provider
              credentials.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Cable className="size-5 text-white" />
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              2. Save encrypted credentials in Supabase and append the channel block
              in gateway config.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Cable className="size-5 text-white" />
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              3. Create or update bindings so inbound events land in the correct agent
              session.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
