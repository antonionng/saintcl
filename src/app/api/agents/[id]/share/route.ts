import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_EXPIRY_DAYS = 7;
const DEFAULT_MAX_MESSAGES = 50;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getCurrentOrg();
  if (!session?.org.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: "Agent management access required." }, { status: 403 });
  }

  const agent = await getVisibleAgentForSession(id, session);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Storage unavailable." }, { status: 503 });
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("shared_agent_sessions")
    .insert({
      token,
      org_id: session.org.id,
      agent_id: agent.id,
      created_by: session.userId,
      expires_at: expiresAt.toISOString(),
      max_messages: DEFAULT_MAX_MESSAGES,
    })
    .select("token, expires_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create share link." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      token: data.token,
      expiresAt: data.expires_at,
    },
  });
}
