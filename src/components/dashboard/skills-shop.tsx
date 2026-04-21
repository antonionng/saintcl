"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SKILL_CATEGORIES, type SkillIndexEntry, type TrustTier } from "@/lib/skills-index";

type Agent = { id: string; name: string };

type InstalledSkill = {
  name: string;
  description: string;
  source: string;
  bundled: boolean;
  skillKey: string;
  emoji?: string;
  homepage?: string;
  always: boolean;
  disabled: boolean;
  eligible: boolean;
};

type InstalledData = {
  workspaceDir?: string;
  skills?: InstalledSkill[];
} | null;

const TRUST_BADGES: Record<TrustTier, { label: string; variant: "success" | "secondary" | "warning"; icon: typeof Shield }> = {
  official: { label: "Official", variant: "success", icon: ShieldCheck },
  curated: { label: "Curated", variant: "secondary", icon: Shield },
  community: { label: "Community", variant: "warning", icon: Shield },
};

function LibrarySkillCard({
  skill,
  agents,
  installedSkill,
  onInstall,
  installing,
  onUninstall,
  uninstalling,
}: {
  skill: SkillIndexEntry;
  agents: Agent[];
  installedSkill?: InstalledSkill;
  onInstall: (slug: string, agentId: string, source: string) => void;
  installing: string | null;
  onUninstall: (skillKey: string) => void;
  uninstalling: string | null;
}) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id ?? "");
  const badge = TRUST_BADGES[skill.trustTier];
  const BadgeIcon = badge.icon;
  const isInstalling = installing === `${skill.slug}:${selectedAgent}`;
  const isInstalled = Boolean(installedSkill);
  const isUninstalling = uninstalling === skill.slug;
  const canUninstall = Boolean(installedSkill && !installedSkill.bundled && !installedSkill.always);

  return (
    <Card variant="inset" className="flex flex-col justify-between p-phi-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{skill.name}</p>
            {skill.author && (
              <p className="mt-0.5 text-[11px] text-zinc-500">by {skill.author}</p>
            )}
          </div>
          <Badge variant={badge.variant} className="shrink-0 gap-1">
            <BadgeIcon className="size-3" />
            {badge.label}
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{skill.description}</p>
        {skill.category && (
          <p className="mt-2 text-[11px] text-zinc-500">{skill.category}</p>
        )}
        {isInstalled ? (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="success" className="gap-1 text-[10px]">
              <CheckCircle2 className="size-2.5" />
              Installed
            </Badge>
            {installedSkill?.bundled ? (
              <Badge variant="secondary" className="text-[10px]">bundled</Badge>
            ) : null}
            {installedSkill?.disabled ? (
              <Badge variant="warning" className="text-[10px]">disabled</Badge>
            ) : null}
            {installedSkill && !installedSkill.eligible && !installedSkill.disabled ? (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <XCircle className="size-2.5" />
                missing deps
              </Badge>
            ) : null}
          </div>
        ) : null}
        {skill.tags && skill.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {skill.tags.map((tag) => (
              <span key={tag} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
                {tag}
              </span>
            ))}
          </div>
        )}
        {skill.requires && (
          <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
            {skill.requires.envKeys?.length ? (
              <p>Env: {skill.requires.envKeys.join(", ")}</p>
            ) : null}
            {skill.requires.bins?.length ? (
              <p>Binaries: {skill.requires.bins.join(", ")}</p>
            ) : null}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          {skill.repoUrl && (
            <a href={skill.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white">
              GitHub <ExternalLink className="size-3" />
            </a>
          )}
          {skill.clawHubUrl && (
            <a href={skill.clawHubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white">
              ClawHub <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {isInstalled ? (
          canUninstall ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={isUninstalling}
              onClick={() => onUninstall(skill.slug)}
            >
              {isUninstalling ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : null}
              Uninstall
            </Button>
          ) : (
            <div className="flex flex-1 items-center text-xs text-zinc-500">Managed by runtime</div>
          )
        ) : (
          <>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              disabled={isInstalling || agents.length === 0}
              className="h-9 flex-1 truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 text-xs text-white"
            >
              {agents.length === 0 && <option value="">No agents</option>}
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={isInstalling || !selectedAgent}
              onClick={() => onInstall(skill.slug, selectedAgent, skill.source)}
            >
              {isInstalling ? <Loader2 className="mr-1.5 size-3 animate-spin" /> : <Download className="mr-1.5 size-3" />}
              Install
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function SkillsShop({ orgId, agents }: { orgId: string; agents: Agent[] }) {
  void orgId;
  const [index, setIndex] = useState<SkillIndexEntry[]>([]);
  const [installedData, setInstalledData] = useState<InstalledData>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "clawhub" | "github">("all");
  const [filterTrust, setFilterTrust] = useState<"all" | TrustTier>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((res) => res.json())
      .then((json: { data?: { index?: SkillIndexEntry[]; installed?: InstalledData } }) => {
        setIndex(json.data?.index ?? []);
        setInstalledData(json.data?.installed ?? null);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const installedSkills = useMemo(() => {
    if (!installedData?.skills) return [];
    return installedData.skills;
  }, [installedData]);

  const installedBySlug = useMemo(() => {
    const map = new Map<string, InstalledSkill>();
    for (const skill of installedSkills) {
      map.set(skill.skillKey, skill);
    }
    return map;
  }, [installedSkills]);

  const unifiedSkills = useMemo(() => {
    const bySlug = new Map<string, SkillIndexEntry>();

    for (const entry of index) {
      bySlug.set(entry.slug, entry);
    }

    for (const installed of installedSkills) {
      if (bySlug.has(installed.skillKey)) {
        continue;
      }

      bySlug.set(installed.skillKey, {
        slug: installed.skillKey,
        name: installed.name,
        description: installed.description,
        source: installed.source.includes("github") ? "github" : "clawhub",
        trustTier: installed.bundled ? "official" : "community",
        category: installed.bundled ? "Bundled Runtime Skills" : "Installed",
        clawHubUrl: installed.homepage,
        tags: [],
        author: installed.bundled ? "openclaw-runtime" : "community",
      });
    }

    return [...bySlug.values()];
  }, [index, installedSkills]);

  const filteredSkills = useMemo(() => {
    let results = unifiedSkills;
    if (filterSource !== "all") results = results.filter((s) => s.source === filterSource);
    if (filterTrust !== "all") results = results.filter((s) => s.trustTier === filterTrust);
    if (filterCategory !== "all") results = results.filter((s) => s.category === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.includes(q)) ||
          s.category?.toLowerCase().includes(q),
      );
    }
    return results;
  }, [unifiedSkills, filterSource, filterTrust, filterCategory, search]);

  async function handleInstall(slug: string, agentId: string, source: string) {
    setInstalling(`${slug}:${agentId}`);
    setActionResult(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, agentId, source }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionResult({ ok: false, message: json.error?.message ?? "Install failed." });
      } else {
        setActionResult({ ok: true, message: `${slug} installed successfully.` });
      }
    } catch {
      setActionResult({ ok: false, message: "Network error during install." });
    } finally {
      setInstalling(null);
    }
  }

  async function handleUninstall(skillKey: string) {
    setUninstalling(skillKey);
    setActionResult(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: skillKey,
          agentId: agents[0]?.id ?? "",
          source: "clawhub",
          action: "disable",
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setActionResult({ ok: false, message: json.error?.message ?? "Uninstall failed." });
      } else {
        setActionResult({ ok: true, message: `${skillKey} disabled.` });
        setInstalledData((prev) => {
          if (!prev?.skills) return prev;
          return {
            ...prev,
            skills: prev.skills.map((s) =>
              s.skillKey === skillKey ? { ...s, disabled: true } : s,
            ),
          };
        });
      }
    } catch {
      setActionResult({ ok: false, message: "Network error." });
    } finally {
      setUninstalling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {actionResult && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          actionResult.ok
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
            : "border-red-500/20 bg-red-500/5 text-red-300"
        }`}>
          {actionResult.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {actionResult.message}
          <button onClick={() => setActionResult(null)} className="ml-auto text-zinc-500 hover:text-white">
            <XCircle className="size-4" />
          </button>
        </div>
      )}

      {/* Browse library */}
      <section id="browse">
        <h3 className="mb-4 text-lg font-medium text-white">Skills library</h3>
        <p className="mb-4 text-sm text-zinc-400">
          Browse curated skills from ClawHub and GitHub. Installed skills are shown in-place, with no duplicates.
        </p>
        <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
          <Badge variant="secondary">{installedSkills.length} installed</Badge>
          <span>{unifiedSkills.length} total visible skills</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="pl-9"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm text-white"
          >
            <option value="all">All categories</option>
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Bundled Runtime Skills">Bundled Runtime Skills</option>
            <option value="Installed">Installed-only</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as "all" | "clawhub" | "github")}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm text-white"
          >
            <option value="all">All sources</option>
            <option value="clawhub">ClawHub</option>
            <option value="github">GitHub</option>
          </select>
          <select
            value={filterTrust}
            onChange={(e) => setFilterTrust(e.target.value as "all" | TrustTier)}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm text-white"
          >
            <option value="all">All trust levels</option>
            <option value="official">Official</option>
            <option value="curated">Curated</option>
            <option value="community">Community</option>
          </select>
        </div>

        <div className="mt-4">
          {filteredSkills.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No skills match your filters.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.map((skill) => (
                <LibrarySkillCard
                  key={skill.slug}
                  skill={skill}
                  agents={agents}
                  installedSkill={installedBySlug.get(skill.slug)}
                  onInstall={handleInstall}
                  installing={installing}
                  onUninstall={handleUninstall}
                  uninstalling={uninstalling}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Updates */}
      <section id="updates">
        <Card>
          <CardHeader>
            <CardTitle>Available updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">
              Skill update checks will appear here when the gateway runtime reports newer versions available for installed skills.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
