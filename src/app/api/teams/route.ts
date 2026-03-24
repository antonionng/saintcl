import { NextResponse } from "next/server";
import { z } from "zod";

import { createTeam, getCurrentOrg, getTeams } from "@/lib/dal";

const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(280).optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const teams = await getTeams(session.org.id);
  return NextResponse.json({ data: teams });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageAgents) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const parsed = createTeamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid team payload." } },
      { status: 400 },
    );
  }

  const team = await createTeam({
    orgId: session.org.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description ?? "",
    createdBy: session.userId,
  });

  if (!team) {
    return NextResponse.json({ error: { message: "Unable to create team." } }, { status: 500 });
  }

  return NextResponse.json({ data: team });
}
