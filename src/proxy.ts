import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agents/:path*",
    "/connections/:path*",
    "/knowledge/:path*",
    "/admin-tools/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/training/:path*",
    "/facilitator/:path*",
    "/academy/:path*",
    "/python-training/:path*",
    "/machine-learning-training/:path*",
    "/neural-networks/:path*",
    "/business-applications-in-ai/:path*",
    "/automation-in-ai/:path*",
    "/advanced-data-visualization/:path*",
    "/ai-in-banking-and-finance/:path*",
  ],
};
