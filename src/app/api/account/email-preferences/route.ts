import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { getEmailPreferences, updateEmailPreferences } from "@/lib/email/preferences";

const updateEmailPreferencesSchema = z.object({
  marketingOptIn: z.boolean(),
  weeklyDigestOptIn: z.boolean(),
  welcomeSeriesOptIn: z.boolean(),
});

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const preferences = await getEmailPreferences(session.org.id, session.userId);
  if (!preferences) {
    return NextResponse.json({ error: { message: "Email preferences are unavailable." } }, { status: 503 });
  }

  return NextResponse.json({ data: preferences });
}

export async function PATCH(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const parsed = updateEmailPreferencesSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? "Invalid email preferences payload." } },
      { status: 400 },
    );
  }

  const preferences = await updateEmailPreferences(session.org.id, session.userId, parsed.data);
  if (!preferences) {
    return NextResponse.json({ error: { message: "Unable to update email preferences." } }, { status: 500 });
  }

  return NextResponse.json({ data: preferences });
}
