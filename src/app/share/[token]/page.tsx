import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TestChatEmbed } from "@/components/dashboard/test-chat-embed";
import { Button } from "@/components/ui/button";
import { isOpenClawConfigured } from "@/lib/env";
import { ensureCurrentControlUiOrigin } from "@/lib/openclaw/control-ui-origins";
import { buildGatewayWorkspaceProxyPath, resolveTenantGatewayTarget } from "@/lib/openclaw/tenant-gateway";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared Agent Preview",
  robots: {
    index: false,
    follow: false,
  },
};

async function loadShareSession(token: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("shared_agent_sessions")
    .select("token, org_id, agent_id, expires_at, revoked, agents(name, openclaw_agent_id)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (data.revoked) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return data;
}

export default async function SharedAgentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await loadShareSession(token);
  if (!share) notFound();

  const agent = (share as { agents?: { name?: string; openclaw_agent_id?: string } | null }).agents;
  let embeddedConsoleUrl: string | undefined;
  let gatewayUrl: string | undefined;

  if (isOpenClawConfigured() && agent?.openclaw_agent_id) {
    await ensureCurrentControlUiOrigin(share.org_id).catch(() => null);
    const target = await resolveTenantGatewayTarget(share.org_id);
    if (target) {
      embeddedConsoleUrl = buildGatewayWorkspaceProxyPath(target, {
        path: "chat",
        session: `agent:${agent.openclaw_agent_id}:share-${token.slice(0, 8)}`,
      });
      gatewayUrl = target.wsUrl;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-border-subtle">
        <div className="site-shell flex items-center justify-between py-4">
          <Link href="/" className="text-sm font-semibold tracking-[-0.02em] text-white">
            Saint AGI
          </Link>
          <Button asChild size="sm" variant="secondary">
            <Link href="/#contact">Request access</Link>
          </Button>
        </div>
      </header>

      <section className="site-shell py-12">
        <div className="mx-auto max-w-3xl">
          <p className="app-kicker mb-3">Shared agent</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Chat with {agent?.name ?? "this agent"}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            This is a sandboxed preview shared by the agent owner. Your messages are temporary.
          </p>

          <div className="mt-8">
            <TestChatEmbed
              embeddedConsoleUrl={embeddedConsoleUrl}
              gatewayUrl={gatewayUrl}
              title={`Chat with ${agent?.name ?? "agent"}`}
              className="h-[600px]"
            />
          </div>

          <div className="mt-6 rounded-lg border border-border-subtle bg-surface-1 p-4 text-sm text-zinc-400">
            Want to build your own? <Link href="/#contact" className="text-white underline">Request access</Link> and pick from
            our templates.
          </div>
        </div>
      </section>
    </main>
  );
}
