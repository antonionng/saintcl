"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPlanDisplayName } from "@/lib/plans";

type SyncResult = {
  status: "ok" | "skipped" | "partial" | "failed";
  totalAgents: number;
  syncedAgents: number;
  failedAgents: number;
  failures: Array<{ agentId: string; name: string; message: string }>;
  reason?: string;
};

function describeSyncResult(sync: SyncResult | undefined): string | null {
  if (!sync) {
    return null;
  }

  if (sync.status === "ok") {
    return sync.totalAgents === 0
      ? "No agents to sync."
      : `Updated ${sync.syncedAgents} agent context file${sync.syncedAgents === 1 ? "" : "s"}.`;
  }

  if (sync.status === "skipped") {
    return sync.reason ?? "Agent sync was skipped.";
  }

  if (sync.status === "partial") {
    return `Synced ${sync.syncedAgents} of ${sync.totalAgents} agents. ${sync.failedAgents} failed.`;
  }

  return sync.reason || "Agent context sync failed.";
}

export function SettingsGeneralForm({
  orgName,
  slug,
  plan,
  website,
  companySummary,
  agentBrief,
  logoUrl,
  canEdit,
}: {
  orgName: string;
  slug: string;
  plan: string;
  website: string;
  companySummary: string;
  agentBrief: string;
  logoUrl: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [nextName, setNextName] = useState(orgName);
  const [nextWebsite, setNextWebsite] = useState(website);
  const [nextCompanySummary, setNextCompanySummary] = useState(companySummary);
  const [nextAgentBrief, setNextAgentBrief] = useState(agentBrief);
  const [nextLogoUrl, setNextLogoUrl] = useState(logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  useEffect(() => {
    setNextName(orgName);
    setNextWebsite(website);
    setNextCompanySummary(companySummary);
    setNextAgentBrief(agentBrief);
    setNextLogoUrl(logoUrl);
    setError(null);
    setSuccess(null);
    setSyncWarning(null);
    setLastSync(null);
  }, [agentBrief, companySummary, logoUrl, orgName, slug, website]);

  const hasChanges = useMemo(
    () =>
      nextName.trim() !== orgName.trim() ||
      nextWebsite.trim() !== website.trim() ||
      nextCompanySummary.trim() !== companySummary.trim() ||
      nextAgentBrief.trim() !== agentBrief.trim(),
    [agentBrief, companySummary, nextAgentBrief, nextCompanySummary, nextName, nextWebsite, orgName, website],
  );

  async function uploadLogo(file: File) {
    if (!canEdit) {
      return;
    }

    setUploadingLogo(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/org/logo", {
        method: "POST",
        body: formData,
      });
      const body = (await res.json()) as {
        data?: { logoUrl?: string | null };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to upload organization logo.");
      }

      setNextLogoUrl(body.data?.logoUrl ?? null);
      setSuccess("Organization logo updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload organization logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  function applySyncResult(sync: SyncResult | undefined, baseSuccess: string) {
    setLastSync(sync ?? null);

    if (!sync) {
      setSuccess(baseSuccess);
      setSyncWarning(null);
      return;
    }

    const description = describeSyncResult(sync);
    if (sync.status === "ok") {
      setSuccess(description ? `${baseSuccess} ${description}` : baseSuccess);
      setSyncWarning(null);
      return;
    }

    if (sync.status === "skipped") {
      setSuccess(baseSuccess);
      setSyncWarning(description);
      return;
    }

    setSuccess(baseSuccess);
    setSyncWarning(description);
  }

  async function saveOrgProfile() {
    if (!canEdit || !hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setSyncWarning(null);

    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName.trim(),
          website: nextWebsite.trim(),
          companySummary: nextCompanySummary.trim(),
          agentBrief: nextAgentBrief.trim(),
        }),
      });
      const body = (await res.json()) as {
        data?: { sync?: SyncResult };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to save organization details.");
      }

      applySyncResult(body.data?.sync, "Organization details saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save organization details.");
    } finally {
      setSaving(false);
    }
  }

  async function syncAgentContext() {
    if (!canEdit) {
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(null);
    setSyncWarning(null);

    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceSync: true }),
      });
      const body = (await res.json()) as {
        data?: { sync?: SyncResult };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to sync agent context.");
      }

      applySyncResult(body.data?.sync, "Agent context refreshed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync agent context.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="settings-panel">
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
          <CardDescription>
            Set the workspace name shown across the dashboard. Slug and plan are still managed centrally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="app-field-label">Organization name</label>
            <Input
              value={nextName}
              onChange={(event) => setNextName(event.target.value)}
              readOnly={!canEdit || saving}
            />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">Website</label>
            <Input
              value={nextWebsite}
              onChange={(event) => setNextWebsite(event.target.value)}
              readOnly={!canEdit || saving}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">What the company does</label>
            <Textarea
              value={nextCompanySummary}
              onChange={(event) => setNextCompanySummary(event.target.value)}
              readOnly={!canEdit || saving}
              rows={4}
              placeholder="Short overview of the company, products, customers, and positioning."
            />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">Brief for agents</label>
            <Textarea
              value={nextAgentBrief}
              onChange={(event) => setNextAgentBrief(event.target.value)}
              readOnly={!canEdit || saving}
              rows={4}
              placeholder="Important background that should help all agents work with better company context."
            />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">Slug</label>
            <Input value={slug} readOnly />
          </div>
          <div className="space-y-2">
            <label className="app-field-label">Plan</label>
            <Input value={getPlanDisplayName(plan)} readOnly />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          {syncWarning ? <p className="text-sm text-amber-300">{syncWarning}</p> : null}
          {lastSync && lastSync.failures.length > 0 ? (
            <ul className="space-y-1 rounded-md border border-amber-400/20 bg-amber-500/[0.04] p-3 text-xs text-amber-200">
              {lastSync.failures.slice(0, 5).map((failure) => (
                <li key={failure.agentId}>
                  <span className="font-medium">{failure.name || failure.agentId}</span>: {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={saveOrgProfile} disabled={!hasChanges || saving || syncing || uploadingLogo}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={syncAgentContext}
                disabled={saving || syncing || uploadingLogo}
                title="Rewrite SOUL.md and bootstrap files for every agent in this workspace using the saved company profile."
              >
                {syncing ? "Syncing..." : "Sync agent context"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Only admins can update workspace profile settings.</p>
          )}
        </CardContent>
      </Card>

      <Card className="settings-panel">
        <CardHeader>
          <CardTitle>Company identity</CardTitle>
          <CardDescription>
            Keep the company profile current so teammates and agents share the same baseline context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-zinc-400">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="app-kicker">Organization logo</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {nextLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={nextLogoUrl} alt={`${orgName} logo`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Logo</span>
                )}
              </div>
              {canEdit ? (
                <div className="space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                    <span>{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingLogo}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadLogo(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs leading-5 text-zinc-500">
                    Logo uploads save immediately. Use Save changes for the profile fields on the left.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="app-kicker">Workspace slug</p>
            <p className="mt-2 text-white">{slug}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Stable slugs keep runtime metadata, checkout events, and audit entries scoped to the right organization.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="app-kicker">Current plan</p>
            <p className="mt-2 text-white">{getPlanDisplayName(plan)}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Upgrade and wallet operations now live in the Billing tab so finance controls stay in one place.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="app-kicker">Agent context source</p>
            <p className="mt-2 text-white">Company profile and knowledge area</p>
            <p className="mt-2 text-sm text-zinc-500">
              Company summary and agent brief are injected as lightweight company context. Uploaded knowledge remains the richer document source for retrieval.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
