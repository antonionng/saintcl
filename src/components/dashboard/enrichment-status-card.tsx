"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Globe, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnrichmentStatusCard({
  orgId,
  website,
  enrichedUrl,
  enrichedAt,
}: {
  orgId: string;
  website: string | null;
  enrichedUrl: string | null;
  enrichedAt: string | null;
}) {
  const [recrawling, setRecrawling] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const hasBeenEnriched = Boolean(enrichedUrl && enrichedAt);
  const urlMismatch = website && enrichedUrl && website !== enrichedUrl;

  async function handleRecrawl() {
    if (!website) return;
    setRecrawling(true);
    setResult(null);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, forceEnrich: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResult({ ok: false, message: data.error?.message ?? "Enrichment failed." });
      } else {
        setResult({ ok: true, message: "Company profile re-enrichment triggered. It may take a moment to complete." });
      }
    } catch {
      setResult({ ok: false, message: "Network error." });
    } finally {
      setRecrawling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4" />
          Company context enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            {website ? (
              <>
                <p className="text-sm text-white">
                  Website: <span className="text-zinc-400">{website}</span>
                </p>
                {hasBeenEnriched ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Enriched
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {enrichedAt ? new Date(enrichedAt).toLocaleDateString() : ""}
                    </span>
                    {urlMismatch && (
                      <Badge variant="warning" className="gap-1">
                        <AlertCircle className="size-3" />
                        URL changed
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary">Not yet enriched</Badge>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                No website configured. Add a company website in{" "}
                <a href="/settings?tab=general" className="text-white underline">organization settings</a>{" "}
                to auto-enrich company context for your agents.
              </p>
            )}
          </div>
          {website && (
            <Button
              variant="secondary"
              size="sm"
              disabled={recrawling}
              onClick={handleRecrawl}
            >
              {recrawling ? (
                <Loader2 className="mr-2 size-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-3" />
              )}
              {hasBeenEnriched ? "Re-enrich" : "Enrich now"}
            </Button>
          )}
        </div>
        {result && (
          <p className={`flex items-center gap-2 text-sm ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
            {result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {result.message}
          </p>
        )}
        <p className="text-xs text-zinc-500">
          Enrichment automatically fetches your company homepage, summarizes it, and saves the profile
          to your organization knowledge base. All agents with access to org-scoped knowledge will receive the context.
        </p>
      </CardContent>
    </Card>
  );
}
