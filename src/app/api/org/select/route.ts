import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedHomePath } from "@/lib/access";
import { getIsSuperAdmin } from "@/lib/super-admin";
import { getCurrentUserWorkspaces } from "@/lib/dal";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/org-selection";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const selectOrgSchema = z.object({
  orgId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const workspaces = await getCurrentUserWorkspaces();
  if (workspaces.length === 0) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const admin = createAdminClient();
  const { data: authUserResult } =
    user && admin ? await admin.auth.admin.getUserById(user.id) : { data: { user: user ?? null } };
  const isSuperAdmin = getIsSuperAdmin(authUserResult?.user ?? user ?? null);

  const payload = selectOrgSchema.parse(await request.json());
  const selected = workspaces.find((workspace) => workspace.org.id === payload.orgId);
  if (!selected) {
    return NextResponse.json({ error: { message: "Workspace not found for this account." } }, { status: 404 });
  }

  const response = NextResponse.json({
    data: {
      orgId: selected.org.id,
      redirectTo: getAuthenticatedHomePath(selected.role, { isSuperAdmin }),
    },
  });

  response.cookies.set(ACTIVE_ORG_COOKIE_NAME, selected.org.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
