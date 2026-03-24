import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg, getRepoAllowlists } from "@/lib/dal";
import { insertRepoAllowlist } from "@/lib/openclaw/runtime-store";

const repoAllowlistSchema = z.object({
  pattern: z.string().trim().min(3).max(255),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageAdminTools) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const data = await getRepoAllowlists(session.org.id);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageAdminTools) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const payload = repoAllowlistSchema.parse(await request.json());
  const existing = await getRepoAllowlists(session.org.id);
  if (existing.some((entry) => entry.pattern === payload.pattern)) {
    return NextResponse.json(
      { error: { message: "That repo allowlist pattern already exists." } },
      { status: 409 },
    );
  }

  const data = await insertRepoAllowlist({
    orgId: session.org.id,
    pattern: payload.pattern,
    createdBy: session.userId,
  });

  if (!data) {
    return NextResponse.json({ error: { message: "Unable to save repo allowlist." } }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
