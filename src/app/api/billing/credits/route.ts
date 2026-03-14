import { NextResponse } from "next/server";
import { z } from "zod";

import { creditWallet } from "@/lib/billing/wallet";
import { getCurrentOrg } from "@/lib/dal";

const manualCreditSchema = z.object({
  amountCents: z.number().int().min(100),
  description: z.string().min(3).max(200),
});

export async function POST(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  if (!session.capabilities.canManageBilling) {
    return NextResponse.json({ error: { message: "Admin access required." } }, { status: 403 });
  }

  const payload = manualCreditSchema.parse(await request.json());

  const entry = await creditWallet({
    orgId: session.org.id,
    userId: session.userId,
    amountCents: payload.amountCents,
    sourceType: "manual_credit",
    description: payload.description,
    metadata: { creditedBy: session.userId },
  });

  return NextResponse.json({ data: entry });
}

