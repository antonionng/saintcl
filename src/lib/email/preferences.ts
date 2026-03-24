import type { EmailPreferenceRecord } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyEmailActionToken } from "@/lib/email/tokens";

type EmailPreferenceRow = {
  id: string;
  org_id: string;
  user_id: string;
  marketing_opt_in: boolean;
  weekly_digest_opt_in: boolean;
  welcome_series_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

const DEFAULT_PREFERENCES = {
  marketingOptIn: true,
  weeklyDigestOptIn: true,
  welcomeSeriesOptIn: true,
};

function mapEmailPreference(row: EmailPreferenceRow): EmailPreferenceRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    marketingOptIn: row.marketing_opt_in,
    weeklyDigestOptIn: row.weekly_digest_opt_in,
    welcomeSeriesOptIn: row.welcome_series_opt_in,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEmailPreferences(orgId: string, userId: string): Promise<EmailPreferenceRecord | null> {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("email_preferences")
    .upsert({ org_id: orgId, user_id: userId }, { onConflict: "org_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapEmailPreference(data as EmailPreferenceRow);
}

export async function updateEmailPreferences(
  orgId: string,
  userId: string,
  input: Partial<Pick<EmailPreferenceRecord, "marketingOptIn" | "weeklyDigestOptIn" | "welcomeSeriesOptIn">>,
) {
  const current = await getEmailPreferences(orgId, userId);
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("email_preferences")
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        marketing_opt_in: input.marketingOptIn ?? current?.marketingOptIn ?? DEFAULT_PREFERENCES.marketingOptIn,
        weekly_digest_opt_in:
          input.weeklyDigestOptIn ?? current?.weeklyDigestOptIn ?? DEFAULT_PREFERENCES.weeklyDigestOptIn,
        welcome_series_opt_in:
          input.welcomeSeriesOptIn ?? current?.welcomeSeriesOptIn ?? DEFAULT_PREFERENCES.welcomeSeriesOptIn,
      },
      { onConflict: "org_id,user_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapEmailPreference(data as EmailPreferenceRow);
}

export async function applyEmailUnsubscribeToken(token: string) {
  const payload = verifyEmailActionToken(token);
  if (!payload) {
    return { success: false as const, message: "This unsubscribe link is invalid or expired." };
  }

  const current = await getEmailPreferences(payload.orgId, payload.userId);
  if (!current) {
    return { success: false as const, message: "Email preferences are unavailable for this workspace." };
  }

  const next = {
    marketingOptIn: payload.preference === "marketing" ? false : current.marketingOptIn,
    weeklyDigestOptIn: payload.preference === "weekly" ? false : current.weeklyDigestOptIn,
    welcomeSeriesOptIn: payload.preference === "welcome" ? false : current.welcomeSeriesOptIn,
  };

  const updated = await updateEmailPreferences(payload.orgId, payload.userId, next);
  if (!updated) {
    return { success: false as const, message: "Unable to update email preferences right now." };
  }

  return {
    success: true as const,
    message: "Your email preferences have been updated.",
    preferences: updated,
  };
}
