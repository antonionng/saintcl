import { NextResponse } from "next/server";

import { getAuthenticatedHomePath, isAdminRole } from "@/lib/access";
import { getAgents, getCurrentOrg } from "@/lib/dal";
import { sendWelcomeEmailForSession } from "@/lib/email/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  const session = await getCurrentOrg();
  if (session) {
    await sendWelcomeEmailForSession(session);
  }

  let nextPath: string;
  if (next && next.startsWith("/")) {
    nextPath = next;
  } else if (session && isAdminRole(session.role, { isSuperAdmin: session.isSuperAdmin })) {
    const agents = await getAgents(session.org.id).catch(() => []);
    nextPath = agents.length === 0 ? "/welcome" : "/dashboard";
  } else {
    nextPath = getAuthenticatedHomePath(session?.role, { isSuperAdmin: session?.isSuperAdmin });
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
