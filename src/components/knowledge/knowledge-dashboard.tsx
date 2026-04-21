"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FileText,
  FolderOpen,
  type LucideIcon,
  Loader2,
  Search,
  Upload,
  User2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { KnowledgeDocument, TeamRecord } from "@/types";

type ScopeType = "org" | "team" | "user";
type LibraryFilter = "all" | ScopeType;
type DashboardTab = "documents" | "upload" | "collections";
const SCOPE_ICONS = {
  org: Building2,
  team: Users,
  user: User2,
} satisfies Record<ScopeType, LucideIcon>;

function scopeLabel(scope: ScopeType) {
  return scope === "org" ? "Company" : scope === "team" ? "Team" : "Personal";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1)?.toUpperCase() ?? "FILE" : "FILE";
}

function scopeDescription(scope: ScopeType) {
  if (scope === "org") {
    return "Shared reference for every company-assigned agent.";
  }
  if (scope === "team") {
    return "Shared operating context for a specific team.";
  }
  return "Private working material for your assigned agents.";
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 px-phi-5 py-phi-5">
      <p className="text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-phi-3 text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-phi-2 text-[length:var(--text-sm)] text-zinc-400">{hint}</p>
    </div>
  );
}

function ScopeSelectorCard({
  scope,
  active,
  disabled,
  count,
  onSelect,
}: {
  scope: ScopeType;
  active: boolean;
  disabled?: boolean;
  count: number;
  onSelect: (scope: ScopeType) => void;
}) {
  const Icon = SCOPE_ICONS[scope];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(scope)}
      className={[
        "rounded-lg border p-phi-5 text-left transition-colors",
        active ? "border-border-strong bg-surface-3" : "border-border-subtle bg-surface-2",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-border",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-phi-3">
        <div className="rounded-md border border-border bg-surface-2 p-phi-2">
          <Icon className="size-4 text-white" />
        </div>
        <Badge variant="default">{count}</Badge>
      </div>
      <p className="mt-phi-5 text-[length:var(--text-sm)] font-medium text-white">{scopeLabel(scope)}</p>
      <p className="mt-phi-1 text-[length:var(--text-xs)] leading-relaxed text-zinc-500">{scopeDescription(scope)}</p>
    </button>
  );
}

function DashboardTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-sm border px-phi-3 py-phi-2 text-[length:var(--text-sm)] transition-colors",
        active
          ? "border-border-strong bg-surface-3 text-white"
          : "border-border-subtle bg-surface-1 text-zinc-400 hover:border-border hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EmptyLibraryState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-phi-8 py-phi-13 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-md border border-border-subtle bg-surface-2">
        <FileText className="size-5 text-zinc-300" />
      </div>
      <p className="mt-phi-5 text-[length:var(--text-base)] font-medium text-white">{title}</p>
      <p className="mx-auto mt-phi-2 max-w-md text-[length:var(--text-sm)] leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function DocumentRow({
  doc,
  teamName,
}: {
  doc: KnowledgeDocument;
  teamName?: string;
}) {
  const scope = scopeLabel(doc.scopeType);
  const extension = getFileExtension(doc.filename);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-phi-5 transition-colors hover:border-border hover:bg-surface-2">
      <div className="flex flex-col gap-phi-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-phi-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-2 text-[length:var(--text-xs)] font-semibold tracking-[0.08em] text-zinc-300">
              {extension}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[length:var(--text-sm)] font-medium text-white sm:text-[length:var(--text-base)]">{doc.filename}</p>
              <div className="mt-phi-2 flex flex-wrap items-center gap-phi-2">
                <Badge variant="default">{scope}</Badge>
                {teamName ? <Badge variant="default">{teamName}</Badge> : null}
                <span className="text-[length:var(--text-xs)] text-zinc-500">{doc.chunkCount} chunks</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-phi-3 lg:justify-end">
          <p className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-zinc-500">{formatDate(doc.updatedAt)}</p>
          <Badge variant={doc.status === "indexed" ? "success" : "warning"}>{doc.status}</Badge>
        </div>
      </div>
    </div>
  );
}

export function KnowledgeDashboard({
  docs,
  teams,
  canManageShared,
  currentUserId,
}: {
  docs: KnowledgeDocument[];
  teams: TeamRecord[];
  canManageShared: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scopeType, setScopeType] = useState<ScopeType>(canManageShared ? "org" : "user");
  const [activeTab, setActiveTab] = useState<DashboardTab>("documents");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [teamRecords, setTeamRecords] = useState(teams);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setTeamRecords(teams);
  }, [teams]);

  useEffect(() => {
    if (teamRecords.length === 0) {
      if (teamId) {
        setTeamId("");
      }
      return;
    }

    if (!teamId || !teamRecords.some((team) => team.id === teamId)) {
      setTeamId(teamRecords[0]?.id ?? "");
    }
  }, [teamId, teamRecords]);

  const companyDocs = useMemo(() => docs.filter((doc) => doc.scopeType === "org"), [docs]);
  const personalDocs = useMemo(() => docs.filter((doc) => doc.scopeType === "user" && doc.userId === currentUserId), [docs, currentUserId]);
  const indexedCount = useMemo(() => docs.filter((doc) => doc.status === "indexed").length, [docs]);
  const processingCount = docs.length - indexedCount;
  const teamLookup = useMemo(() => new Map(teamRecords.map((team) => [team.id, team])), [teamRecords]);
  const teamDocsByTeam = useMemo(
    () =>
      teamRecords.map((team) => ({
        team,
        docs: docs.filter((doc) => doc.scopeType === "team" && doc.teamId === team.id),
      })),
    [docs, teamRecords],
  );
  const sortedDocs = useMemo(
    () => [...docs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [docs],
  );
  const visibleDocs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedDocs.filter((doc) => {
      const matchesFilter = libraryFilter === "all" ? true : doc.scopeType === libraryFilter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const teamName = doc.teamId ? teamLookup.get(doc.teamId)?.name ?? "" : "";
      return [doc.filename, scopeLabel(doc.scopeType), teamName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [libraryFilter, searchQuery, sortedDocs, teamLookup]);

  async function uploadDocument() {
    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("scopeType", scopeType);
      if (scopeType === "team") {
        formData.append("teamId", teamId);
      }

      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message || "Unable to upload knowledge.");
      }

      setSelectedFile(null);
      setSuccess(`${scopeLabel(scopeType)} knowledge uploaded.`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload knowledge.");
    } finally {
      setUploading(false);
    }
  }

  async function createNewTeam() {
    if (!teamName.trim()) {
      return;
    }

    setCreatingTeam(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim(),
        }),
      });
      const payload = (await response.json()) as { data?: TeamRecord; error?: { message?: string } };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Unable to create team.");
      }

      const createdTeam = payload.data;
      setTeamRecords((current) =>
        [...current, createdTeam].sort((left, right) => left.name.localeCompare(right.name)),
      );
      setTeamId(createdTeam.id);
      setTeamName("");
      setTeamDescription("");
      setSuccess("Team created. It is ready in Upload.");
      router.refresh();
    } catch (teamError) {
      setError(teamError instanceof Error ? teamError.message : "Unable to create team.");
    } finally {
      setCreatingTeam(false);
    }
  }

  return (
    <div className="space-y-phi-8">
      <section className="grid gap-phi-5 xl:grid-cols-[1.618fr_repeat(3,minmax(0,1fr))]">
        <Card className="overflow-hidden">
          <CardContent className="p-phi-8">
            <div className="flex flex-col gap-phi-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[length:var(--text-xs)] font-medium uppercase tracking-[0.08em] text-zinc-500">Knowledge library</p>
                <h2 className="mt-phi-3 text-[length:var(--text-xl)] font-semibold tracking-[-0.03em] text-white sm:text-[length:var(--text-2xl)]">
                  Organize reference material like a shared document system
                </h2>
                <p className="mt-phi-3 max-w-xl text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
                  Upload documents by scope, keep team collections separated, and browse the full library with searchable
                  metadata your agents can use at retrieval time.
                </p>
              </div>
              <div className="flex flex-wrap gap-phi-2">
                <Badge variant="default">{companyDocs.length} company</Badge>
                <Badge variant="default">{teamDocsByTeam.reduce((total, entry) => total + entry.docs.length, 0)} team</Badge>
                <Badge variant="default">{personalDocs.length} personal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <MetricCard label="Documents" value={String(docs.length)} hint="Files indexed across all scopes" />
        <MetricCard label="Ready" value={String(indexedCount)} hint="Available for retrieval" />
        <MetricCard label="Collections" value={String(teamRecords.length + 2)} hint="Company, teams, and personal" />
      </section>

      <Card>
        <CardHeader className="gap-phi-5">
          <div className="flex flex-col gap-phi-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Knowledge workspace</CardTitle>
              <CardDescription>Use tabs to upload documents, browse your library, and review collection coverage.</CardDescription>
            </div>
            {activeTab === "documents" ? (
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search documents"
                  className="pl-10"
                />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-phi-2">
            <DashboardTabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>
              Documents
            </DashboardTabButton>
            <DashboardTabButton active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>
              Upload
            </DashboardTabButton>
            <DashboardTabButton active={activeTab === "collections"} onClick={() => setActiveTab("collections")}>
              Collections
            </DashboardTabButton>
          </div>
        </CardHeader>

        {activeTab === "documents" ? (
          <CardContent className="space-y-phi-5">
            <div className="flex flex-wrap gap-phi-2">
              {(["all", "org", "team", "user"] as LibraryFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLibraryFilter(filter)}
                  className={[
                    "rounded-sm border px-phi-3 py-phi-2 text-[length:var(--text-sm)] transition-colors",
                    libraryFilter === filter
                      ? "border-border-strong bg-surface-3 text-white"
                      : "border-border-subtle bg-surface-1 text-zinc-400 hover:border-border hover:text-white",
                  ].join(" ")}
                >
                  {filter === "all" ? "All files" : scopeLabel(filter)}
                </button>
              ))}
            </div>
            {visibleDocs.length === 0 ? (
              <EmptyLibraryState
                title="No matching documents"
                description="Try a different search term or switch libraries to find the documents you need."
              />
            ) : (
              visibleDocs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} teamName={doc.teamId ? teamLookup.get(doc.teamId)?.name : undefined} />
              ))
            )}
          </CardContent>
        ) : null}

        {activeTab === "upload" ? (
          <CardContent className="space-y-phi-5">
            <div className="grid gap-phi-5 lg:grid-cols-3">
              {(["org", "team", "user"] as ScopeType[]).map((option) => (
                <ScopeSelectorCard
                  key={option}
                  scope={option}
                  active={scopeType === option}
                  disabled={!canManageShared && option !== "user"}
                  count={
                    option === "org"
                      ? companyDocs.length
                      : option === "team"
                        ? teamDocsByTeam.reduce((total, entry) => total + entry.docs.length, 0)
                        : personalDocs.length
                  }
                  onSelect={setScopeType}
                />
              ))}
            </div>

            {scopeType === "team" ? (
              <div className="space-y-phi-2">
                <label className="app-field-label">Target team</label>
                <select
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                  className="flex h-11 w-full max-w-md rounded-md border border-border bg-surface-2 px-phi-5 py-phi-2 text-[length:var(--text-sm)] text-white"
                >
                  {teamRecords.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {teamRecords.length === 0 ? (
                  <div className="flex flex-wrap items-center gap-phi-3 text-[length:var(--text-sm)] text-amber-300">
                    <span>Create a team in Collections before uploading team documents.</span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setActiveTab("collections")}>
                      Go to collections
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-lg border border-dashed border-border p-phi-5">
              <div className="flex items-start gap-phi-3">
                <div className="rounded-md border border-border bg-surface-2 p-phi-3">
                  <Upload className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-[length:var(--text-sm)] font-medium text-white">Supported files</p>
                  <p className="mt-phi-1 text-[length:var(--text-sm)] leading-relaxed text-zinc-500">TXT, MD, CSV, and JSON files are parsed into searchable chunks.</p>
                </div>
              </div>
              <div className="mt-phi-5 flex flex-wrap items-center gap-phi-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Choose file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                  disabled={uploading}
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
                <span className="text-[length:var(--text-sm)] text-zinc-500">TXT, MD, CSV, and JSON</span>
              </div>
              <div className="mt-phi-3 flex items-center justify-between gap-phi-3 text-[length:var(--text-sm)]">
                <span className="truncate text-zinc-400">{selectedFile ? selectedFile.name : "No file selected yet"}</span>
                <span className="shrink-0 text-zinc-500">{scopeLabel(scopeType)} library</span>
              </div>
            </div>

            {error ? <p className="text-[length:var(--text-sm)] text-red-400">{error}</p> : null}
            {success ? <p className="text-[length:var(--text-sm)] text-emerald-300">{success}</p> : null}

            <Button onClick={uploadDocument} disabled={!selectedFile || uploading || (scopeType === "team" && !teamId)}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                "Add to library"
              )}
            </Button>
          </CardContent>
        ) : null}

        {activeTab === "collections" ? (
          <CardContent className="space-y-phi-8">
            {canManageShared ? (
              <Card variant="inset">
                <CardHeader>
                  <CardTitle>Create team</CardTitle>
                  <CardDescription>
                    Team collections live here. New teams become available in the Upload tab right away.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-phi-5">
                  <div className="grid gap-phi-5 lg:grid-cols-2">
                    <div className="space-y-phi-2">
                      <label className="app-field-label">Team name</label>
                      <Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Engineering" />
                    </div>
                    <div className="space-y-phi-2">
                      <label className="app-field-label">Description</label>
                      <Input
                        value={teamDescription}
                        onChange={(event) => setTeamDescription(event.target.value)}
                        placeholder="Design systems, platform, lifecycle ops"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={createNewTeam} disabled={!teamName.trim() || creatingTeam}>
                    {creatingTeam ? "Creating..." : "Create team"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-phi-5 lg:grid-cols-2">
              <Card variant="inset">
                <CardHeader>
                  <CardTitle>Collections</CardTitle>
                  <CardDescription>High-level library breakdown by scope.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-phi-3">
                  <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                    <div className="flex items-center justify-between gap-phi-3">
                      <div className="flex items-center gap-phi-3">
                        <div className="rounded-md border border-border-subtle bg-surface-2 p-phi-2">
                          <Building2 className="size-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[length:var(--text-sm)] font-medium text-white">Company library</p>
                          <p className="text-[length:var(--text-sm)] text-zinc-400">Shared operational references</p>
                        </div>
                      </div>
                      <Badge variant="default">{companyDocs.length}</Badge>
                    </div>
                  </div>
                  <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                    <div className="flex items-center justify-between gap-phi-3">
                      <div className="flex items-center gap-phi-3">
                        <div className="rounded-md border border-border-subtle bg-surface-2 p-phi-2">
                          <Users className="size-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[length:var(--text-sm)] font-medium text-white">Team libraries</p>
                          <p className="text-[length:var(--text-sm)] text-zinc-400">Department or function-specific collections</p>
                        </div>
                      </div>
                      <Badge variant="default">{teamDocsByTeam.reduce((total, entry) => total + entry.docs.length, 0)}</Badge>
                    </div>
                  </div>
                  <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                    <div className="flex items-center justify-between gap-phi-3">
                      <div className="flex items-center gap-phi-3">
                        <div className="rounded-md border border-border-subtle bg-surface-2 p-phi-2">
                          <FolderOpen className="size-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[length:var(--text-sm)] font-medium text-white">Personal library</p>
                          <p className="text-[length:var(--text-sm)] text-zinc-400">Private notes and working context</p>
                        </div>
                      </div>
                      <Badge variant="default">{personalDocs.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="inset">
                <CardHeader>
                  <CardTitle>Team coverage</CardTitle>
                  <CardDescription>Each team collection and its current document count.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-phi-3">
                  {teamDocsByTeam.length === 0 ? (
                    <EmptyLibraryState
                      title="No team coverage yet"
                      description="Once teams exist, their document libraries will show up here for quick auditing."
                    />
                  ) : (
                    teamDocsByTeam.map(({ team, docs: scopedDocs }) => (
                      <div key={team.id} className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                        <div className="flex items-start justify-between gap-phi-3">
                          <div className="min-w-0">
                            <p className="truncate text-[length:var(--text-sm)] font-medium text-white">{team.name}</p>
                            <p className="mt-phi-1 text-[length:var(--text-sm)] text-zinc-400">{team.description || "No description yet."}</p>
                          </div>
                          <Badge variant="default">{scopedDocs.length}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card variant="inset">
              <CardHeader>
                <CardTitle>Retrieval map</CardTitle>
                <CardDescription>What each agent can see based on assignment scope.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-phi-3 md:grid-cols-3">
                <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                  <div className="flex items-center gap-phi-3">
                    <Building2 className="size-4 text-white" />
                    <p className="text-[length:var(--text-sm)] font-medium text-white">Company agents</p>
                  </div>
                  <p className="mt-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">Company library only</p>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                  <div className="flex items-center gap-phi-3">
                    <Users className="size-4 text-white" />
                    <p className="text-[length:var(--text-sm)] font-medium text-white">Team agents</p>
                  </div>
                  <p className="mt-phi-2 flex items-center gap-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
                    Company
                    <ArrowRight className="size-3.5" />
                    Team library
                  </p>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-1 p-phi-5">
                  <div className="flex items-center gap-phi-3">
                    <User2 className="size-4 text-white" />
                    <p className="text-[length:var(--text-sm)] font-medium text-white">Employee agents</p>
                  </div>
                  <p className="mt-phi-2 flex items-center gap-phi-2 text-[length:var(--text-sm)] leading-relaxed text-zinc-400">
                    Company
                    <ArrowRight className="size-3.5" />
                    Personal library
                  </p>
                </div>
              </CardContent>
            </Card>

            {processingCount > 0 ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-phi-5 text-[length:var(--text-sm)] text-amber-100">
                {processingCount} document{processingCount === 1 ? "" : "s"} still processing. They will appear in retrieval once indexing finishes.
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
