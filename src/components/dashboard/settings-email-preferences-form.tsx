"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailPreferenceRecord } from "@/types";

export function SettingsEmailPreferencesForm({
  initialPreferences,
  unsubscribeStatus,
  unsubscribeMessage,
}: {
  initialPreferences: EmailPreferenceRecord;
  unsubscribeStatus?: "success" | "error" | null;
  unsubscribeMessage?: string | null;
}) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function savePreferences() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/account/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketingOptIn: preferences.marketingOptIn,
          weeklyDigestOptIn: preferences.weeklyDigestOptIn,
          welcomeSeriesOptIn: preferences.welcomeSeriesOptIn,
        }),
      });
      const body = (await response.json()) as {
        data?: EmailPreferenceRecord;
        error?: { message?: string };
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || "Unable to update email preferences.");
      }

      setPreferences(body.data);
      setSuccess("Email preferences saved.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update email preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="settings-panel">
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
          <CardDescription>
            Control which non-essential Saint AGI messages reach you for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            title="Weekly digest"
            description="A short weekly email with product news, rollout guidance, and relevant updates."
            checked={preferences.weeklyDigestOptIn}
            onChange={(checked) => setPreferences((current) => ({ ...current, weeklyDigestOptIn: checked }))}
          />
          <PreferenceRow
            title="Marketing and use-case campaigns"
            description="Periodic role-based emails with workspace owner and admin rollout ideas."
            checked={preferences.marketingOptIn}
            onChange={(checked) => setPreferences((current) => ({ ...current, marketingOptIn: checked }))}
          />
          <PreferenceRow
            title="Welcome series"
            description="The onboarding sequence that helps new users get more value from Saint AGI quickly."
            checked={preferences.welcomeSeriesOptIn}
            onChange={(checked) => setPreferences((current) => ({ ...current, welcomeSeriesOptIn: checked }))}
          />
          {unsubscribeStatus && unsubscribeMessage ? (
            <p className={unsubscribeStatus === "success" ? "text-sm text-emerald-300" : "text-sm text-red-400"}>
              {unsubscribeMessage}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          <Button type="button" onClick={savePreferences} disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            <span>{saving ? "Saving..." : "Save preferences"}</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="settings-panel">
        <CardHeader>
          <CardTitle>How Saint AGI uses email</CardTitle>
          <CardDescription>Transactional mail stays on so your workspace can keep working.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3 text-white">
              <Mail className="size-4 text-emerald-300" />
              Transactional emails stay enabled
            </div>
            <p className="mt-3">
              Workspace invites, billing notices, security notices, and other essential operational messages are not
              controlled by these toggles.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3 text-white">
              <Sparkles className="size-4 text-white" />
              Preferences are workspace-specific
            </div>
            <p className="mt-3">
              If you belong to more than one workspace, you can keep weekly or marketing email on for one workspace and
              off for another.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="min-w-0">
        <p className="font-medium text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 rounded border-white/20 bg-white/[0.06]"
      />
    </label>
  );
}
