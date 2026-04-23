import { NextResponse } from "next/server";

import { getCurrentOrg, getVisibleAgentForSession } from "@/lib/dal";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.capabilities.canManageAgents) {
    return NextResponse.json(
      { error: { message: "Agent management requires admin access." } },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const source = await getVisibleAgentForSession(id, session);
  if (!source) {
    return NextResponse.json({ error: { message: "Agent not found." } }, { status: 404 });
  }

  const config = (source.config ?? {}) as Record<string, unknown>;
  const persona = typeof config.persona === "string" ? config.persona : undefined;
  const personaTemplateId =
    typeof config.personaTemplateId === "string" ? config.personaTemplateId : undefined;
  const scope =
    source.assignment?.assignee_type === "team" || source.assignment?.assignee_type === "org"
      ? source.assignment.assignee_type
      : "employee";
  const assignee =
    scope === "employee" ? session.userId : source.assignment?.assignee_ref ?? undefined;

  const baseName = source.name.trim();
  const proposedName = baseName.toLowerCase().endsWith("(copy)")
    ? `${baseName} 2`
    : `${baseName} (Copy)`;

  const url = new URL(request.url);
  const origin = url.origin;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const res = await fetch(`${origin}/api/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: proposedName,
      model: source.model,
      persona,
      personaTemplateId,
      scope,
      assignee,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(body ?? { error: { message: "Clone failed" } }, { status: res.status });
  }
  return NextResponse.json(body);
}
