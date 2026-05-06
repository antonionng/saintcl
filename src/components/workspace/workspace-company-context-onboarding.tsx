"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { WORKSPACE_EXPECT_PROFILE_STEP2_KEY } from "@/components/workspace/workspace-onboarding-keys";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SyncResult = {
  status: "ok" | "skipped" | "partial" | "failed";
  totalAgents: number;
  syncedAgents: number;
  failedAgents: number;
  failures: Array<{ agentId: string; name: string; message: string }>;
  reason?: string;
};

function normalizeWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function looksLikeWebsiteUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length < 4) return false;
  try {
    const u = new URL(normalizeWebsiteUrl(t));
    return Boolean(
      u.hostname && (u.hostname.includes(".") || u.hostname === "localhost" || u.hostname === "127.0.0.1"),
    );
  } catch {
    return false;
  }
}

type Mode = "website" | "manual";

type CompanyOnboardingSequence = "company_only" | "company_then_profile";

export function WorkspaceCompanyContextOnboarding({
  orgName,
  initialWebsite,
  initialCompanySummary,
  initialAgentBrief,
  companyOnboardingSequence,
}: {
  orgName: string;
  initialWebsite: string;
  initialCompanySummary: string;
  initialAgentBrief: string;
  companyOnboardingSequence: CompanyOnboardingSequence;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("website");
  const [website, setWebsite] = useState(initialWebsite);
  const [companySummary, setCompanySummary] = useState(initialCompanySummary);
  const [agentBrief, setAgentBrief] = useState(initialAgentBrief);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  async function saveCompanyContext() {
    setError(null);
    setSyncNote(null);

    let websiteOut = "";
    let summaryOut = "";
    let briefOut = "";

    if (mode === "website") {
      if (!looksLikeWebsiteUrl(website)) {
        setError("Enter a valid company website URL so we can pull public context.");
        return;
      }
      websiteOut = normalizeWebsiteUrl(website);
      summaryOut = "";
      briefOut = "";
    } else {
      if (companySummary.trim().length < 24) {
        setError("Add at least a few sentences about what the company does (24 characters or more).");
        return;
      }
      if (agentBrief.trim().length < 12) {
        setError(
          "Add a short brief for agents (12 characters or more). This helps every agent use the same company context.",
        );
        return;
      }
      websiteOut = "";
      summaryOut = companySummary.trim();
      briefOut = agentBrief.trim();
    }

    setSaving(true);

    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: websiteOut,
          companySummary: summaryOut,
          agentBrief: briefOut,
          enrichFromWebsite: mode === "website",
        }),
      });
      const body = (await res.json()) as {
        data?: { org?: unknown; sync?: SyncResult };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to save company context.");
      }

      const sync = body.data?.sync;
      if (sync?.status === "partial" || sync?.status === "failed") {
        setSyncNote(
          sync.reason ??
            (sync.failedAgents > 0
              ? "Company context saved; some agents may need a sync from Settings later."
              : null),
        );
      }

      try {
        if (companyOnboardingSequence === "company_then_profile") {
          sessionStorage.setItem(WORKSPACE_EXPECT_PROFILE_STEP2_KEY, "1");
        }
      } catch {
        // ignore
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save company context.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
      <CardHeader>
        <p className="app-kicker text-white/55">
          {companyOnboardingSequence === "company_then_profile" ? "Step 1 of 2 · Company" : "Company context"}
        </p>
        <CardTitle>Add context for {orgName}</CardTitle>
        <CardDescription>
          Give your workspace a baseline company profile. Use your public website so we can draft a summary in the
          background, or enter details yourself. You can refine everything later in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("website");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
              mode === "website"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            Use company website
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
              mode === "manual"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            Enter manually
          </button>
        </div>

        {mode === "website" ? (
          <div className="space-y-2">
            <label className="app-field-label" htmlFor="workspace-onboarding-org-website">
              Company website
            </label>
            <Input
              id="workspace-onboarding-org-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              disabled={saving}
              autoComplete="url"
            />
            <p className="text-xs leading-5 text-zinc-500">
              We save the URL, sync agent context files, and start a background pass to enrich your knowledge area from
              public pages. Results may take a minute to appear under Knowledge.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="app-field-label" htmlFor="workspace-onboarding-company-summary">
                What the company does
              </label>
              <Textarea
                id="workspace-onboarding-company-summary"
                value={companySummary}
                onChange={(e) => setCompanySummary(e.target.value)}
                placeholder="Products, customers, market, and anything agents should treat as ground truth."
                disabled={saving}
                className="min-h-32"
                maxLength={2000}
              />
              <p className="text-xs text-zinc-500">{companySummary.trim().length}/2000 characters (min 24)</p>
            </div>
            <div className="space-y-2">
              <label className="app-field-label" htmlFor="workspace-onboarding-org-agent-brief">
                Brief for agents
              </label>
              <Textarea
                id="workspace-onboarding-org-agent-brief"
                value={agentBrief}
                onChange={(e) => setAgentBrief(e.target.value)}
                placeholder="Tone, priorities, and guardrails that apply to company agents."
                disabled={saving}
                className="min-h-28"
                maxLength={2000}
              />
              <p className="text-xs text-zinc-500">{agentBrief.trim().length}/2000 characters (min 12)</p>
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {syncNote ? <p className="text-sm text-amber-200">{syncNote}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void saveCompanyContext()} disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            <span>
              {saving
                ? "Saving..."
                : companyOnboardingSequence === "company_then_profile"
                  ? "Save and continue"
                  : "Save and open workspace"}
            </span>
          </Button>
          <p className="text-sm leading-6 text-zinc-500">
            {companyOnboardingSequence === "company_then_profile"
              ? "Next you will add a short personal profile so your agent can address you well."
              : "Organization details stay editable under Settings for admins."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
