import { assertCanSpend } from "@/lib/billing/usage";
import { creditWallet, debitWallet } from "@/lib/billing/wallet";
import { createAdminClient } from "@/lib/supabase/admin";

type InviteBillingInput = {
  orgId: string;
  inviteId: string;
  userId: string;
  email: string;
  amountCents: number;
};

export async function recordInviteCharge(input: InviteBillingInput) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  await assertCanSpend(input.orgId, input.amountCents);

  const { data: usageEvent, error: usageError } = await admin
    .from("usage_events")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      event_type: "usage_workspace_invite",
      quantity: 1,
      unit: "invite",
      amount_cents: input.amountCents,
      metadata: {
        inviteId: input.inviteId,
        email: input.email,
      },
    })
    .select()
    .single();

  if (usageError || !usageEvent) {
    throw usageError ?? new Error("Unable to record invite usage.");
  }

  try {
    const ledgerEntry = await debitWallet({
      orgId: input.orgId,
      userId: input.userId,
      amountCents: input.amountCents,
      sourceType: "usage_team_invite",
      description: `Seat invite for ${input.email}`,
      metadata: {
        inviteId: input.inviteId,
        email: input.email,
      },
    });

    return { usageEvent, ledgerEntry };
  } catch (error) {
    await admin.from("usage_events").delete().eq("id", usageEvent.id);
    throw error;
  }
}

export async function reverseInviteCharge(input: InviteBillingInput & { reason: string }) {
  return creditWallet({
    orgId: input.orgId,
    userId: input.userId,
    amountCents: input.amountCents,
    sourceType: "invite_reversal",
    description: `Invite refund for ${input.email}`,
    metadata: {
      inviteId: input.inviteId,
      email: input.email,
      reason: input.reason,
    },
  });
}
