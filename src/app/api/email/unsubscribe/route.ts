import { NextResponse } from "next/server";

import { applyEmailUnsubscribeToken } from "@/lib/email/preferences";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${origin}/settings?tab=email&unsubscribe=invalid`);
  }

  const result = await applyEmailUnsubscribeToken(token);
  const status = result.success ? "success" : "error";
  return NextResponse.redirect(
    `${origin}/settings?tab=email&unsubscribe=${status}&message=${encodeURIComponent(result.message)}`,
  );
}
