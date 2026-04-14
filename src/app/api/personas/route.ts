import { NextResponse } from "next/server";
import { z } from "zod";

import { createPersona, getCurrentOrg, getPersonas } from "@/lib/dal";
import { mergePersonaCatalog } from "@/lib/personas";

const personaMutationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().default(""),
  instructions: z.string().trim().min(3).max(4000),
  icon: z.string().trim().max(80).optional().nullable(),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const personas = await getPersonas(session.org.id);
  return NextResponse.json({ data: mergePersonaCatalog(personas) });
}

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const parsed = personaMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid persona payload." } },
      { status: 400 },
    );
  }

  const persona = await createPersona({
    orgId: session.org.id,
    name: parsed.data.name,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    icon: parsed.data.icon ?? null,
    createdBy: session.userId,
  });

  if (!persona) {
    return NextResponse.json({ error: { message: "Unable to create persona." } }, { status: 500 });
  }

  return NextResponse.json({ data: persona });
}
