import { NextResponse } from "next/server";

import { getAuthenticatedHomePath } from "@/lib/access";
import { getCurrentOrg } from "@/lib/dal";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const session = await getCurrentOrg();
  const nextPath = getAuthenticatedHomePath(session?.role, { isSuperAdmin: session?.isSuperAdmin });

  return NextResponse.redirect(`${origin}${nextPath}`);
}
