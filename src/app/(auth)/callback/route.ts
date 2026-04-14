import { NextResponse } from "next/server";

import { getAuthenticatedHomePath } from "@/lib/access";
import { getCurrentOrg } from "@/lib/dal";
import { sendWelcomeEmailForSession } from "@/lib/email/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const isAcademyNext = Boolean(next && next.startsWith("/academy/"));

  if (code) {
    const supabase = await createClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  if (isAcademyNext) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const session = await getCurrentOrg();
  if (session) {
    await sendWelcomeEmailForSession(session);
  }

  const nextPath =
    next && next.startsWith("/") ? next : getAuthenticatedHomePath(session?.role, { isSuperAdmin: session?.isSuperAdmin });

  return NextResponse.redirect(
    `${origin}${nextPath}`,
  );
}
