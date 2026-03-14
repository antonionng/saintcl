import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/agents/:path*", "/connections/:path*", "/knowledge/:path*", "/admin-tools/:path*", "/billing/:path*", "/settings/:path*"],
};
