import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Settings } from "lucide-react";

import { AgentShareButton } from "@/components/dashboard/agent-share-button";
import { AgentAvatar } from "@/components/dashboard/agent-avatar";
import { EmbedSnippet } from "@/components/dashboard/embed-snippet";
import { TestChatEmbed } from "@/components/dashboard/test-chat-embed";
import { Button } from "@/components/ui/button";
import { normalizeAgentAvatarConfig } from "@/lib/agent-identity";
import { getSignedAgentAvatarUrl } from "@/lib/agent-avatar-storage";
import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { getTenantOpenClawClient } from "@/lib/openclaw/runtime-client";
import { buildAgentSessionKey } from "@/lib/openclaw/session-keys";
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
  const config = (agent.config ?? {}) as Record<string, unknown>;
  const avatarConfig = normalizeAgentAvatarConfig(config.agentAvatar);
  const avatarImageUrl = await getSignedAgentAvatarUrl(avatarConfig.imagePath);

  let embeddedConsoleUrl: string | undefined;
  let gatewayUrl: string | undefined;
  const sessionKey = buildAgentSessionKey(agent.openclaw_agent_id, "main");

  if (isOpenClawConfigured()) {
    await ensureCurrentControlUiOrigin(session.org.id).catch(() => null);
    await getTenantOpenClawClient(session.org.id, { orgId: session.org.id })
      .then(({ client }) =>
        client.updateAgentIdentity({
          agentId: agent.openclaw_agent_id,
          name: agent.name,
          avatar: avatarConfig,
        }),
      )
      .catch(() => null);
    const target = await resolveTenantGatewayTarget(session.org.id);
    if (target) {
      embeddedConsoleUrl = buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: sessionKey,
      });
      gatewayUrl = target.wsUrl;
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-12rem)] flex-col">
      <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AgentAvatar
            agentId={agent.openclaw_agent_id}
            name={agent.name}
            initials={avatarConfig.initials}
            theme={avatarConfig.theme}
            imageUrl={avatarImageUrl}
            className="size-11"
          />
          <div className="min-w-0">
            <p className="app-kicker">Chat</p>
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              {agent.name}
            </h1>
          </div>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:items-center md:w-auto md:justify-end">
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
          sessionKey={sessionKey}
          title={`Chat with ${agent.name}`}
          className="h-full"
        />
      </div>
    </div>
  );
}
