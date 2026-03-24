import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { runLifecycleEmailSweep } from "@/lib/email/service";

function isAuthorized(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!env.emailCronSecret) {
    return false;
  }

  return authorization === `Bearer ${env.emailCronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const result = await runLifecycleEmailSweep();
  return NextResponse.json({ data: result });
}
