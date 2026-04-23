"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="settings-panel mt-6 p-5 space-y-6">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-[length:var(--text-sm)] font-medium text-white">
          <Shield className="h-3.5 w-3.5 text-white/55" />
          Skill installation policy
        </p>
        <p className="text-[length:var(--text-xs)] text-white/55">
          Control which skill sources and trust tiers agents in this organization can install from.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-white/55">
          Allowed sources
        </h4>
        <div className="border border-border rounded-md overflow-hidden">
          {SOURCE_OPTIONS.map((opt, idx) => (
            <label
              key={opt.id}
              className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] ${
                idx < SOURCE_OPTIONS.length - 1 ? "border-b border-border-subtle" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={sources.has(opt.id)}
                onChange={() => toggleSource(opt.id)}
                disabled={readOnly}
                className="mt-0.5"
              />
              <div>
                <p className="text-[length:var(--text-sm)] font-medium text-white">{opt.label}</p>
                <p className="text-[length:var(--text-xs)] text-white/55">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-white/55">
          Allowed trust tiers
        </h4>
        <div className="border border-border rounded-md overflow-hidden">
          {TRUST_OPTIONS.map((opt, idx) => (
            <label
              key={opt.id}
              className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] ${
                idx < TRUST_OPTIONS.length - 1 ? "border-b border-border-subtle" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={tiers.has(opt.id)}
                onChange={() => toggleTier(opt.id)}
                disabled={readOnly}
                className="mt-0.5"
              />
              <div>
                <p className="text-[length:var(--text-sm)] font-medium text-white">{opt.label}</p>
                <p className="text-[length:var(--text-xs)] text-white/55">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 border border-border rounded-md px-4 py-2.5 cursor-pointer hover:bg-white/[0.02]">
        <input
          type="checkbox"
          checked={communityApproval}
          onChange={(e) => setCommunityApproval(e.target.checked)}
          disabled={readOnly}
          className="mt-0.5"
        />
        <div>
          <p className="text-[length:var(--text-sm)] font-medium text-white">
            Require admin approval for community skills
          </p>
          <p className="text-[length:var(--text-xs)] text-white/55">
            When enabled, installing community-tier skills will require admin approval before activation.
          </p>
        </div>
      </label>

      {result && (
        <p
          className={`flex items-center gap-2 text-[length:var(--text-xs)] ${
            result.ok ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {result.message}
        </p>
      )}

      {!readOnly && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Save skill policy
        </Button>
      )}
    </div>
  );
}
