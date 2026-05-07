"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { WORKSPACE_EXPECT_PROFILE_STEP2_KEY } from "@/components/workspace/workspace-onboarding-keys";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SyncResult =
  | {
      status: "ok" | "skipped" | "partial" | "failed";
      totalAgents: number;
      syncedAgents: number;
      failedAgents: number;
      failures: Array<{ agentId: string; name: string; message: string }>;
      reason?: string;
    }
  | {
      status: "queued";
      message?: string;
    };

type EnrichmentResponse =
  | {
      ok: true;
      website: string;
      companySummary: string;
      agentBrief: string;
      profileFieldsWritten: { companySummary: boolean; agentBrief: boolean };
    }
  | {
      ok: false;
      reason:
        | "admin_unavailable"
        | "invalid_url"
        | "fetch_failed"
        | "summarization_failed"
        | "already_enriched";
      website: string | null;
    };

type EnrichmentFailureReason = Extract<EnrichmentResponse, { ok: false }>["reason"];

type OrgPatchResponse = {
  data?: {
    org?: {
      website?: string | null;
      company_summary?: string | null;
      agent_brief?: string | null;
    };
    sync?: SyncResult;
    enrichment?: EnrichmentResponse;
  };
  error?: { message?: string };
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

function describeEnrichmentFailure(reason: EnrichmentFailureReason) {
  switch (reason) {
    case "fetch_failed":
      return "We could not read enough content from that website. Add the company details below and you can refine them later.";
    case "summarization_failed":
      return "We saved your website but the auto-summary is unavailable right now. Add the company details below and you can refine them later.";
    case "invalid_url":
      return "That URL did not look right. Try again or enter the company details below.";
    case "already_enriched":
      return "We already had a draft for this website. Review or edit the details below.";
    case "admin_unavailable":
      return "The workspace data store is unavailable right now. Try again in a moment.";
    default:
      return "We could not auto-fill the company details. Add them below and you can refine them later.";
  }
}

type Stage = "intro" | "review";
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
  const [stage, setStage] = useState<Stage>(initialCompanySummary.trim().length > 0 ? "review" : "intro");
  const [mode, setMode] = useState<Mode>("website");
  const [website, setWebsite] = useState(initialWebsite);
  const [companySummary, setCompanySummary] = useState(initialCompanySummary);
  const [agentBrief, setAgentBrief] = useState(initialAgentBrief);
  const [enriching, setEnriching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [draftSourcedFromWebsite, setDraftSourcedFromWebsite] = useState(false);

  const stepKicker =
    companyOnboardingSequence === "company_then_profile" ? "Step 1 of 2 \u00b7 Company" : "Company context";

  async function readCompanyFromWebsite() {
    setError(null);
    setInfo(null);
    setSyncNote(null);

    if (!looksLikeWebsiteUrl(website)) {
      setError("Enter a valid company website URL so we can pull public context.");
      return;
    }
    const websiteOut = normalizeWebsiteUrl(website);

    setEnriching(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: websiteOut,
          enrichFromWebsite: true,
        }),
      });
      const body = (await res.json()) as OrgPatchResponse;
      if (!res.ok) {
        throw new Error(body.error?.message || "Unable to read your company website.");
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

      const orgRow = body.data?.org;
      const nextWebsite = orgRow?.website?.trim() || websiteOut;
      setWebsite(nextWebsite);

      const enrichment = body.data?.enrichment;
      const summaryFromOrg = (orgRow?.company_summary ?? "").trim();
      const briefFromOrg = (orgRow?.agent_brief ?? "").trim();

      if (enrichment?.ok) {
        const summaryNext = summaryFromOrg || enrichment.companySummary || "";
        const briefNext = briefFromOrg || enrichment.agentBrief || "";
        setCompanySummary(summaryNext);
        setAgentBrief(briefNext);
        setDraftSourcedFromWebsite(true);
        setStage("review");
        setMode("manual");
        if (!summaryNext) {
          setInfo(
            "We saved your website but did not have enough content for an auto-draft. Add a short company summary below.",
          );
        }
      } else if (enrichment && !enrichment.ok) {
        setCompanySummary(summaryFromOrg);
        setAgentBrief(briefFromOrg);
        setStage("review");
        setMode("manual");
        setInfo(describeEnrichmentFailure(enrichment.reason));
      } else {
        setCompanySummary(summaryFromOrg);
        setAgentBrief(briefFromOrg);
        setStage("review");
        setMode("manual");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read your company website.");
    } finally {
      setEnriching(false);
    }
  }

  async function saveCompanyContext() {
    setError(null);
    setSyncNote(null);

    const summaryTrim = companySummary.trim();
    const briefTrim = agentBrief.trim();

    if (summaryTrim.length < 24) {
      setError("Add at least a few sentences about what the company does (24 characters or more).");
      return;
    }
    if (briefTrim.length < 12) {
      setError("Add a short brief for agents (12 characters or more). This helps every agent stay on-brand.");
      return;
    }

    const websiteOut = mode === "website" ? normalizeWebsiteUrl(website) : website.trim();

    setSaving(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: websiteOut,
          companySummary: summaryTrim,
          agentBrief: briefTrim,
        }),
      });
      const body = (await res.json()) as OrgPatchResponse;
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

  function startManualEntry() {
    setMode("manual");
    setStage("review");
    setError(null);
    setInfo(null);
  }

  function backToIntro() {
    setStage("intro");
    setError(null);
    setInfo(null);
  }

  if (stage === "review") {
    const continueLabel = companyOnboardingSequence === "company_then_profile"
      ? "Save and continue"
      : "Save and open workspace";
    return (
      <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
        <CardHeader>
          <p className="app-kicker text-white/55">{stepKicker}</p>
          <CardTitle>
            {draftSourcedFromWebsite ? `Review your company profile for ${orgName}` : `Add company context for ${orgName}`}
          </CardTitle>
          <CardDescription>
            {draftSourcedFromWebsite
              ? "We drafted these from your website. Edit anything that is off, then continue. Admins can refine this later in Settings."
              : "Give your workspace a baseline company profile. You can refine everything later in Settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {website ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
              <span className="text-zinc-500">Website:</span> <span className="text-white">{website}</span>
            </div>
          ) : null}

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

          {info ? <p className="text-sm text-amber-200">{info}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {syncNote ? <p className="text-sm text-amber-200">{syncNote}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void saveCompanyContext()} disabled={saving}>
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              <span>{saving ? "Saving..." : continueLabel}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={backToIntro}
              disabled={saving}
              className="text-zinc-400 hover:text-white"
            >
              Use a different website
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

  return (
    <Card className="w-full max-w-2xl border-white/10 bg-[#090b10]/96">
      <CardHeader>
        <p className="app-kicker text-white/55">{stepKicker}</p>
        <CardTitle>Add context for {orgName}</CardTitle>
        <CardDescription>
          Give your workspace a baseline company profile. Use your public website so we can draft a summary you can
          review, or enter details yourself. You can refine everything later in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("website");
              setError(null);
              setInfo(null);
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
            onClick={startManualEntry}
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

        <div className="space-y-2">
          <label className="app-field-label" htmlFor="workspace-onboarding-org-website">
            Company website
          </label>
          <Input
            id="workspace-onboarding-org-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com"
            disabled={enriching}
            autoComplete="url"
          />
          <p className="text-xs leading-5 text-zinc-500">
            We read your homepage and an about page if available, then draft a short company summary and an agent
            brief. You can edit both before continuing.
          </p>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {info ? <p className="text-sm text-amber-200">{info}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void readCompanyFromWebsite()} disabled={enriching}>
            {enriching ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            <span>{enriching ? "Reading your website..." : "Read my website"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={startManualEntry}
            disabled={enriching}
            className="text-zinc-400 hover:text-white"
          >
            Enter details manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
