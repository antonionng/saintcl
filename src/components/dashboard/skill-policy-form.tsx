"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SOURCE_OPTIONS = [
  { id: "clawhub", label: "ClawHub", description: "Official ClawHub skill registry" },
  { id: "github", label: "GitHub", description: "Curated GitHub repositories" },
  { id: "custom", label: "Custom", description: "Custom or self-hosted skill sources" },
] as const;

const TRUST_OPTIONS = [
  { id: "official", label: "Official", description: "Published and maintained by the OpenClaw team" },
  { id: "curated", label: "Curated", description: "Reviewed and approved by trusted community maintainers" },
  { id: "community", label: "Community", description: "Community-contributed, not formally reviewed" },
] as const;

export function SkillPolicyForm({
  orgId,
  allowedSources,
  allowedTrustTiers,
  requireApprovalForCommunity,
  readOnly,
}: {
  orgId: string;
  allowedSources: string[];
  allowedTrustTiers: string[];
  requireApprovalForCommunity: boolean;
  readOnly: boolean;
}) {
  const [sources, setSources] = useState(new Set(allowedSources));
  const [tiers, setTiers] = useState(new Set(allowedTrustTiers));
  const [communityApproval, setCommunityApproval] = useState(requireApprovalForCommunity);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function toggleSource(id: string) {
    const next = new Set(sources);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSources(next);
  }

  function toggleTier(id: string) {
    const next = new Set(tiers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setTiers(next);
  }

  async function handleSave() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/org-policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillPolicy: {
            allowedSources: [...sources],
            allowedTrustTiers: [...tiers],
            requireApprovalForCommunity: communityApproval,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResult({ ok: false, message: data.error?.message ?? "Failed to save." });
      } else {
        setResult({ ok: true, message: "Skill policy updated." });
      }
    } catch {
      setResult({ ok: false, message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-4" />
          Skill installation policy
        </CardTitle>
        <CardDescription>
          Control which skill sources and trust tiers agents in this organization can install from.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-2 text-sm font-medium text-white">Allowed sources</h4>
          <div className="space-y-2">
            {SOURCE_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-start gap-3 rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20">
                <input
                  type="checkbox"
                  checked={sources.has(opt.id)}
                  onChange={() => toggleSource(opt.id)}
                  disabled={readOnly}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="text-xs text-zinc-400">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-white">Allowed trust tiers</h4>
          <div className="space-y-2">
            {TRUST_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-start gap-3 rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20">
                <input
                  type="checkbox"
                  checked={tiers.has(opt.id)}
                  onChange={() => toggleTier(opt.id)}
                  disabled={readOnly}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="text-xs text-zinc-400">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20">
          <input
            type="checkbox"
            checked={communityApproval}
            onChange={(e) => setCommunityApproval(e.target.checked)}
            disabled={readOnly}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-white">Require admin approval for community skills</p>
            <p className="text-xs text-zinc-400">When enabled, installing community-tier skills will require admin approval before activation.</p>
          </div>
        </label>

        {result && (
          <p className={`flex items-center gap-2 text-sm ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
            {result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {result.message}
          </p>
        )}

        {!readOnly && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save skill policy
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
