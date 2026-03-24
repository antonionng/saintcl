import type { OrgInviteRecord, OrgRole } from "@/types";
import { recordInviteCharge, reverseInviteCharge } from "@/lib/billing/invites";
import { sendTemplatedEmail } from "@/lib/email/client";
import { createOpaqueEmailToken, hashEmailToken } from "@/lib/email/tokens";
import { getOrgMembers, getTeam } from "@/lib/dal";
import { getBaseUrl, titleCase } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

type OrgInviteRow = {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  team_id: string | null;
  invited_by: string | null;
  status: OrgInviteRecord["status"];
  billing_status: OrgInviteRecord["billingStatus"];
  billed_amount_cents: number;
  resend_message_id: string | null;
  last_error: string | null;
  expires_at: string;
  sent_at: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  billing_ledger_entry_id?: string | null;
  billed_usage_event_id?: string | null;
};

function mapInvite(row: OrgInviteRow): OrgInviteRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role,
    teamId: row.team_id,
    invitedBy: row.invited_by,
    status: row.status,
    billingStatus: row.billing_status,
    billedAmountCents: row.billed_amount_cents,
    resendMessageId: row.resend_message_id,
    lastError: row.last_error,
    expiresAt: row.expires_at,
    sentAt: row.sent_at,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getInviteRowById(inviteId: string, orgId?: string) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  let query = admin.from("org_invites").select("*").eq("id", inviteId);
  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data } = await query.maybeSingle();
  return (data as OrgInviteRow | null) ?? null;
}

async function getInviteRowByToken(token: string) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data } = await admin
    .from("org_invites")
    .select("*")
    .eq("invite_token_hash", hashEmailToken(token))
    .maybeSingle();

  return (data as OrgInviteRow | null) ?? null;
}

async function markInviteExpiredIfNeeded(row: OrgInviteRow) {
  if (!["pending", "sent"].includes(row.status)) {
    return row;
  }

  if (new Date(row.expires_at).getTime() > Date.now()) {
    return row;
  }

  const admin = createAdminClient();
  if (!admin) {
    return row;
  }

  const { data } = await admin
    .from("org_invites")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select("*")
    .single();

  return (data as OrgInviteRow | null) ?? row;
}

export async function listOrgInvites(orgId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data } = await admin
    .from("org_invites")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as OrgInviteRow[]).map((row) => mapInvite(row));
  return rows;
}

export async function createAndSendOrgInvite(input: {
  orgId: string;
  orgName: string;
  orgLogoUrl?: string | null;
  orgWebsite?: string | null;
  inviterName?: string | null;
  invitedByUserId: string;
  email: string;
  role: OrgRole;
  teamId?: string | null;
  seatPriceCents: number;
}) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const email = normalizeInviteEmail(input.email);
  const [members, team] = await Promise.all([
    getOrgMembers(input.orgId),
    input.teamId ? getTeam(input.teamId, input.orgId) : Promise.resolve(null),
  ]);

  if (members.some((member) => (member.email ?? "").toLowerCase() === email)) {
    throw new Error("That email already belongs to a workspace member.");
  }

  if (input.teamId && !team) {
    throw new Error("The selected team no longer exists.");
  }

  const token = createOpaqueEmailToken();
  const inviteTokenHash = hashEmailToken(token);
  const { data: created, error: createError } = await admin
    .from("org_invites")
    .insert({
      org_id: input.orgId,
      email,
      role: input.role,
      team_id: input.teamId ?? null,
      invited_by: input.invitedByUserId,
      invite_token_hash: inviteTokenHash,
      status: "pending",
      billing_status: input.seatPriceCents > 0 ? "pending" : "not_required",
      billed_amount_cents: input.seatPriceCents,
      metadata: {
        teamName: team?.name ?? null,
      },
    })
    .select("*")
    .single();

  if (createError || !created) {
    if (createError?.code === "23505") {
      throw new Error("An active invite already exists for that email.");
    }
    throw createError ?? new Error("Unable to create the invite.");
  }

  const invite = created as OrgInviteRow;
  let chargedUsageEventId: string | null = null;
  let chargedLedgerEntryId: string | null = null;

  try {
    if (input.seatPriceCents > 0) {
      const charge = await recordInviteCharge({
        orgId: input.orgId,
        inviteId: invite.id,
        userId: input.invitedByUserId,
        email,
        amountCents: input.seatPriceCents,
      });
      chargedUsageEventId = charge.usageEvent.id;
      chargedLedgerEntryId = charge.ledgerEntry.id;
    }

    const inviteUrl = `${getBaseUrl()}/invite/${token}`;
    const emailResult = await sendTemplatedEmail({
      orgId: input.orgId,
      inviteId: invite.id,
      email,
      templateKey: "team-invite",
      campaignKey: "workspace-invites",
      dedupeKey: `invite:${invite.id}:send`,
      orgName: input.orgName,
      orgWebsite: input.orgWebsite,
      orgLogoUrl: input.orgLogoUrl,
      inviterName: input.inviterName,
      inviteRoleLabel: titleCase(input.role),
      inviteUrl,
      billedAmountCents: input.seatPriceCents,
      metadata: {
        inviteId: invite.id,
      },
    });

    const { data: updated } = await admin
      .from("org_invites")
      .update({
        status: "sent",
        billing_status: input.seatPriceCents > 0 ? "charged" : "not_required",
        billed_usage_event_id: chargedUsageEventId,
        billing_ledger_entry_id: chargedLedgerEntryId,
        resend_message_id: emailResult.resendMessageId ?? null,
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", invite.id)
      .select("*")
      .single();

    return mapInvite((updated as OrgInviteRow | null) ?? invite);
  } catch (error) {
    if (input.seatPriceCents > 0 && chargedLedgerEntryId) {
      await reverseInviteCharge({
        orgId: input.orgId,
        inviteId: invite.id,
        userId: input.invitedByUserId,
        email,
        amountCents: input.seatPriceCents,
        reason: "invite_send_failed",
      }).catch(() => null);
    }

    await admin
      .from("org_invites")
      .update({
        status: "delivery_failed",
        billing_status: input.seatPriceCents > 0 ? "reversed" : "not_required",
        billed_usage_event_id: chargedUsageEventId,
        billing_ledger_entry_id: chargedLedgerEntryId,
        last_error: error instanceof Error ? error.message : "Unable to send invite email.",
      })
      .eq("id", invite.id);

    throw error;
  }
}

export async function revokeOrgInvite(input: { orgId: string; inviteId: string; userId: string }) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const existing = await getInviteRowById(input.inviteId, input.orgId);
  if (!existing) {
    throw new Error("Invite not found.");
  }

  const invite = await markInviteExpiredIfNeeded(existing);
  if (invite.status === "accepted") {
    throw new Error("Accepted invites cannot be revoked.");
  }

  if (invite.status === "revoked" || invite.status === "expired") {
    return mapInvite(invite);
  }

  if (invite.billing_status === "charged" && invite.billed_amount_cents > 0) {
    await reverseInviteCharge({
      orgId: input.orgId,
      inviteId: invite.id,
      userId: input.userId,
      email: invite.email,
      amountCents: invite.billed_amount_cents,
      reason: "invite_revoked",
    });
  }

  const { data } = await admin
    .from("org_invites")
    .update({
      status: "revoked",
      billing_status: invite.billing_status === "charged" ? "reversed" : invite.billing_status,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .select("*")
    .single();

  return mapInvite((data as OrgInviteRow | null) ?? invite);
}

export async function getInvitePreview(token: string) {
  const row = await getInviteRowByToken(token);
  if (!row) {
    return null;
  }

  const invite = await markInviteExpiredIfNeeded(row);
  const admin = createAdminClient();
  if (!admin) {
    return {
      invite: mapInvite(invite),
      orgName: null,
      teamName: typeof invite.metadata?.teamName === "string" ? invite.metadata.teamName : null,
    };
  }

  const { data: org } = await admin.from("orgs").select("name").eq("id", invite.org_id).maybeSingle();
  return {
    invite: mapInvite(invite),
    orgName: (org as { name?: string } | null)?.name ?? null,
    teamName: typeof invite.metadata?.teamName === "string" ? invite.metadata.teamName : null,
  };
}

export async function acceptOrgInvite(input: { token: string; userId: string; email: string | null }) {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const row = await getInviteRowByToken(input.token);
  if (!row) {
    throw new Error("Invite not found.");
  }

  const invite = await markInviteExpiredIfNeeded(row);
  if (invite.status === "expired") {
    throw new Error("This invite has expired.");
  }
  if (invite.status === "revoked") {
    throw new Error("This invite has been revoked.");
  }
  if (invite.status === "accepted") {
    return mapInvite(invite);
  }

  const email = normalizeInviteEmail(input.email ?? "");
  if (!email || email !== normalizeInviteEmail(invite.email)) {
    throw new Error("Sign in with the same email address that received the invite.");
  }

  await admin
    .from("org_members")
    .upsert(
      {
        org_id: invite.org_id,
        user_id: input.userId,
        role: invite.role,
      },
      { onConflict: "org_id,user_id" },
    );

  if (invite.team_id) {
    await admin
      .from("team_members")
      .upsert(
        {
          org_id: invite.org_id,
          team_id: invite.team_id,
          user_id: input.userId,
        },
        { onConflict: "team_id,user_id" },
      );
  }

  await admin
    .from("email_preferences")
    .upsert({ org_id: invite.org_id, user_id: input.userId }, { onConflict: "org_id,user_id" });

  const { data } = await admin
    .from("org_invites")
    .update({
      status: "accepted",
      accepted_by: input.userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .select("*")
    .single();

  return mapInvite((data as OrgInviteRow | null) ?? invite);
}
