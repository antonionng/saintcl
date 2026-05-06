import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/dal";
import { listSupportTickets } from "@/lib/support/tickets";

export async function GET() {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }
  if (!session.isSuperAdmin) {
    return NextResponse.json({ error: { message: "Platform admin access required." } }, { status: 403 });
  }

  const tickets = await listSupportTickets();
  return NextResponse.json({ data: tickets });
}
