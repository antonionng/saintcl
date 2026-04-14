import { NextResponse } from "next/server";
import { z } from "zod";

import { deletePersona, getCurrentOrg, getPersona, updatePersona } from "@/lib/dal";
import { getBuiltInPersonaById } from "@/lib/personas";

const personaMutationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().default(""),
  instructions: z.string().trim().min(3).max(4000),
  icon: z.string().trim().max(80).optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const { id } = await context.params;
  if (getBuiltInPersonaById(id)) {
    return NextResponse.json({ error: { message: "Built-in personas cannot be edited." } }, { status: 400 });
  }

  const parsed = personaMutationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid persona payload." } },
      { status: 400 },
    );
  }

  const existing = await getPersona(id, session.org.id);
  if (!existing) {
    return NextResponse.json({ error: { message: "Persona not found." } }, { status: 404 });
  }

  const persona = await updatePersona({
    id,
    orgId: session.org.id,
    name: parsed.data.name,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    icon: parsed.data.icon ?? null,
  });

  if (!persona) {
    return NextResponse.json({ error: { message: "Unable to update persona." } }, { status: 500 });
  }

  return NextResponse.json({ data: persona });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManagePolicies) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const { id } = await context.params;
  if (getBuiltInPersonaById(id)) {
    return NextResponse.json({ error: { message: "Built-in personas cannot be deleted." } }, { status: 400 });
  }

  const existing = await getPersona(id, session.org.id);
  if (!existing) {
    return NextResponse.json({ error: { message: "Persona not found." } }, { status: 404 });
  }

  const deleted = await deletePersona(id, session.org.id);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Unable to delete persona." } }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
