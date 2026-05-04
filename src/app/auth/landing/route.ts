import { NextResponse } from "next/server";

import { getAuthenticatedHomePath, isAdminRole } from "@/lib/access";
import { getAgents, getCurrentOrg } from "@/lib/dal";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const session = await getCurrentOrg();

  let nextPath: string;
  if (session && isAdminRole(session.role, { isSuperAdmin: session.isSuperAdmin })) {
    const agents = await getAgents(session.org.id).catch(() => []);
    nextPath = agents.length === 0 ? "/welcome" : "/workspace";
  } else {
    nextPath = getAuthenticatedHomePath(session?.role, { isSuperAdmin: session?.isSuperAdmin });
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
