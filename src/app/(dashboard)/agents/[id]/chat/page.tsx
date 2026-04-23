import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Settings } from "lucide-react";

import { AgentShareButton } from "@/components/dashboard/agent-share-button";
import { EmbedSnippet } from "@/components/dashboard/embed-snippet";
import { TestChatEmbed } from "@/components/dashboard/test-chat-embed";
import { Button } from "@/components/ui/button";
import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentOrg();
  if (!session?.org.id) notFound();

  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) notFound();

  let embeddedConsoleUrl: string | undefined;
  let gatewayUrl: string | undefined;

  if (isOpenClawConfigured()) {
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
    const target = await resolveTenantGatewayTarget(session.org.id);
    if (target) {
      embeddedConsoleUrl = buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: `agent:${agent.openclaw_agent_id}:admin-test`,
      });
      gatewayUrl = target.wsUrl;
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-12rem)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <div>
          <p className="app-kicker">Chat</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            {agent.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/agents/${agent.id}`}>
              <Settings className="size-4" />
              <span>Configure</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/workspace">
              <ExternalLink className="size-4" />
              <span>Open in workspace</span>
            </Link>
          </Button>
          <AgentShareButton agentId={agent.id} />
          <EmbedSnippet agentId={agent.id} />
        </div>
      </header>

      <div className="flex-1">
        <TestChatEmbed
          embeddedConsoleUrl={embeddedConsoleUrl}
          gatewayUrl={gatewayUrl}
          title={`Chat with ${agent.name}`}
          className="h-full"
        />
      </div>
    </div>
  );
}
