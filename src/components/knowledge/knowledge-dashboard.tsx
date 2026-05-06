"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  FolderPlus,
  Plus,
  Search,
  Upload,
  User2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wizard } from "@/components/ui/wizard";
import type { KnowledgeDocument, TeamRecord } from "@/types";

type ScopeType = "org" | "team" | "user";
type LibraryFilter = "all" | ScopeType;

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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-r border-border-subtle px-5 py-4 last:border-r-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-xl)] font-medium tracking-[-0.01em] text-white">
        {value}
      </span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[length:var(--text-xs)] font-medium transition-colors",
        active
          ? "border-white text-white"
          : "border-border text-white/55 hover:text-white hover:border-border-strong",
      ].join(" ")}
    >
      {children}
      {typeof count === "number" ? (
        <span className={active ? "text-white/70" : "text-white/35"}>{count}</span>
      ) : null}
    </button>
  );
}

function PickerCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Upload;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-sm border border-border bg-transparent p-4 text-left transition-colors hover:border-border-strong hover:bg-white/[0.03]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border-subtle">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="mt-1 text-[length:var(--text-sm)] font-medium text-white">{title}</p>
      <p className="text-[length:var(--text-xs)] text-white/55">{description}</p>
    </button>
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
  const [teamRecords, setTeamRecords] = useState(teams);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  useEffect(() => {
    setTeamRecords(teams);
  }, [teams]);

  const companyDocs = useMemo(() => docs.filter((d) => d.scopeType === "org"), [docs]);
  const personalDocs = useMemo(
    () => docs.filter((d) => d.scopeType === "user" && d.userId === currentUserId),
    [docs, currentUserId],
  );
  const teamDocs = useMemo(() => docs.filter((d) => d.scopeType === "team"), [docs]);
  const indexedCount = useMemo(() => docs.filter((d) => d.status === "indexed").length, [docs]);

  const teamLookup = useMemo(
    () => new Map(teamRecords.map((team) => [team.id, team])),
    [teamRecords],
  );
  const sortedDocs = useMemo(
    () => [...docs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [docs],
  );
  const visibleDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedDocs.filter((doc) => {
      if (libraryFilter !== "all" && doc.scopeType !== libraryFilter) return false;
      if (!q) return true;
      const teamName = doc.teamId ? teamLookup.get(doc.teamId)?.name ?? "" : "";
      return [doc.filename, scopeLabel(doc.scopeType), teamName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [libraryFilter, searchQuery, sortedDocs, teamLookup]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em] text-white">
            Library
          </h2>
          <p className="mt-1 text-[length:var(--text-sm)] text-muted-foreground">
            Documents and collections available to your agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-9 w-56 pl-8"
            />
          </div>
          <Button onClick={() => setPickerOpen(true)} size="default">
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      <div className="flex divide-x divide-border-subtle border border-border rounded-md overflow-hidden">
        <StatTile label="Documents" value={String(docs.length)} />
        <StatTile label="Indexed" value={String(indexedCount)} />
        <StatTile label="Company" value={String(companyDocs.length)} />
        <StatTile label="Team" value={String(teamDocs.length)} />
        <StatTile label="Personal" value={String(personalDocs.length)} />
        <StatTile label="Collections" value={String(teamRecords.length + 2)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={libraryFilter === "all"}
          onClick={() => setLibraryFilter("all")}
          count={docs.length}
        >
          All
        </FilterChip>
        <FilterChip
          active={libraryFilter === "org"}
          onClick={() => setLibraryFilter("org")}
          count={companyDocs.length}
        >
          Company
        </FilterChip>
        <FilterChip
          active={libraryFilter === "team"}
          onClick={() => setLibraryFilter("team")}
          count={teamDocs.length}
        >
          Team
        </FilterChip>
        <FilterChip
          active={libraryFilter === "user"}
          onClick={() => setLibraryFilter("user")}
          count={personalDocs.length}
        >
          Personal
        </FilterChip>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {visibleDocs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle">
              <FileText className="h-4 w-4 text-white/60" />
            </div>
            <p className="text-[length:var(--text-sm)] font-medium text-white">No documents</p>
            <p className="max-w-sm text-[length:var(--text-xs)] text-white/50">
              {searchQuery
                ? "Nothing matches your search. Try a different term or clear the filter."
                : "Click Add to upload a document or create a new collection."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </div>
        ) : (
          <ul>
            {visibleDocs.map((doc) => {
              const ext = getFileExtension(doc.filename);
              const teamName = doc.teamId ? teamLookup.get(doc.teamId)?.name : null;
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border-subtle text-[10px] font-semibold tracking-[0.06em] text-white/70">
                    {ext}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[length:var(--text-sm)] text-white">
                      {doc.filename}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[length:var(--text-xs)] text-white/45">
                      <span>{scopeLabel(doc.scopeType)}</span>
                      {teamName ? (
                        <>
                          <span>&middot;</span>
                          <span>{teamName}</span>
                        </>
                      ) : null}
                      <span>&middot;</span>
                      <span>{doc.chunkCount} chunks</span>
                      <span>&middot;</span>
                      <span>{formatDate(doc.updatedAt)}</span>
                    </div>
                  </div>
                  <Badge variant={doc.status === "indexed" ? "success" : "warning"}>
                    {doc.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Add to library</DialogTitle>
            <DialogDescription>Choose what to add.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PickerCard
                icon={Upload}
                title="Upload document"
                description="Add a TXT, MD, CSV, JSON, or PDF file to a scope."
                onClick={() => {
                  setPickerOpen(false);
                  setUploadOpen(true);
                }}
              />
              <PickerCard
                icon={FolderPlus}
                title="New collection"
                description="Create a team collection for shared documents."
                onClick={() => {
                  setPickerOpen(false);
                  setCollectionOpen(true);
                }}
              />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <UploadWizard
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        canManageShared={canManageShared}
        teams={teamRecords}
        onUploaded={() => {
          setUploadOpen(false);
          router.refresh();
        }}
      />

      <CollectionWizard
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        canManageShared={canManageShared}
        onCreated={(team) => {
          setTeamRecords((cur) =>
            [...cur, team].sort((a, b) => a.name.localeCompare(b.name)),
          );
          setCollectionOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function UploadWizard({
  open,
  onOpenChange,
  canManageShared,
  teams,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageShared: boolean;
  teams: TeamRecord[];
  onUploaded: () => void;
}) {
  const [step, setStep] = useState(0);
  const [scopeType, setScopeType] = useState<ScopeType>(canManageShared ? "org" : "user");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedFile(null);
      setError(null);
      setSubmitting(false);
      setScopeType(canManageShared ? "org" : "user");
      setTeamId(teams[0]?.id ?? "");
    }
  }, [open, canManageShared, teams]);

  async function submit() {
    if (!selectedFile) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("scopeType", scopeType);
      if (scopeType === "team") formData.append("teamId", teamId);
      const res = await fetch("/api/knowledge/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(data.error?.message || "Unable to upload knowledge.");
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload knowledge.");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed =
    step === 0
      ? scopeType !== "team" || Boolean(teamId)
      : step === 1
        ? Boolean(selectedFile)
        : true;

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      title="Upload document"
      description="Pick a scope, choose a file, and confirm."
      steps={["Scope", "File", "Review"]}
      step={step}
      onStepChange={setStep}
      finalLabel="Upload"
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={!selectedFile}
      nextDisabled={!canProceed}
    >
      <Wizard.Step>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[length:var(--text-sm)] font-medium text-white">
            Where should this go?
          </legend>
          <p className="text-[length:var(--text-xs)] text-white/55">
            Scope controls which agents can use this document for retrieval.
          </p>
        </fieldset>
        <div className="grid grid-cols-1 gap-2">
          <ScopeRadio
            icon={Building2}
            label="Company"
            description="Available to every company-assigned agent."
            checked={scopeType === "org"}
            onChange={() => setScopeType("org")}
            disabled={!canManageShared}
          />
          <ScopeRadio
            icon={Users}
            label="Team"
            description="Visible only to agents assigned to a team."
            checked={scopeType === "team"}
            onChange={() => setScopeType("team")}
            disabled={!canManageShared || teams.length === 0}
          />
          <ScopeRadio
            icon={User2}
            label="Personal"
            description="Private working material for your own agents."
            checked={scopeType === "user"}
            onChange={() => setScopeType("user")}
          />
        </div>
        {scopeType === "team" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--text-xs)] font-medium text-white/70">
              Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="flex h-9 w-full rounded-sm border border-border bg-transparent px-3 py-2 text-[length:var(--text-sm)] text-white"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            {teams.length === 0 ? (
              <p className="text-[length:var(--text-xs)] text-amber-300">
                Create a collection first to upload team documents.
              </p>
            ) : null}
          </div>
        ) : null}
      </Wizard.Step>

      <Wizard.Step>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-transparent px-5 py-10 text-center transition-colors hover:border-border-strong"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle">
            <Upload className="h-4 w-4 text-white" />
          </div>
          <p className="text-[length:var(--text-sm)] font-medium text-white">
            {selectedFile ? selectedFile.name : "Choose a file"}
          </p>
          <p className="text-[length:var(--text-xs)] text-white/45">
            TXT, MD, CSV, JSON, or PDF
          </p>
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.markdown,.csv,.json,.pdf,text/plain,text/markdown,text/csv,application/json,application/pdf"
          onChange={(e) => {
            setSelectedFile(e.target.files?.[0] ?? null);
            e.currentTarget.value = "";
          }}
        />
        {selectedFile ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            className="self-start"
          >
            Remove
          </Button>
        ) : null}
      </Wizard.Step>

      <Wizard.Step>
        <ReviewRow label="Scope" value={scopeLabel(scopeType)} />
        {scopeType === "team" ? (
          <ReviewRow
            label="Team"
            value={teams.find((t) => t.id === teamId)?.name ?? "-"}
          />
        ) : null}
        <ReviewRow
          label="File"
          value={selectedFile ? selectedFile.name : "-"}
        />
        {selectedFile ? (
          <ReviewRow
            label="Size"
            value={`${(selectedFile.size / 1024).toFixed(1)} KB`}
          />
        ) : null}
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function CollectionWizard({
  open,
  onOpenChange,
  canManageShared,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageShared: boolean;
  onCreated: (team: TeamRecord) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setName("");
      setDescription("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = (await res.json()) as {
        data?: TeamRecord;
        error?: { message?: string };
      };
      if (!res.ok || !data.data) {
        throw new Error(data.error?.message || "Unable to create collection.");
      }
      onCreated(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create collection.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canManageShared) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Permission needed</DialogTitle>
            <DialogDescription>
              You don&apos;t have permission to create collections in this workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      title="New collection"
      description="Group team documents under a shared label."
      steps={["Details", "Review"]}
      step={step}
      onStepChange={setStep}
      finalLabel="Create"
      onFinalClick={submit}
      finalLoading={submitting}
      finalDisabled={!name.trim()}
      nextDisabled={!name.trim()}
    >
      <Wizard.Step>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Engineering"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[length:var(--text-xs)] font-medium text-white/70">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this collection covers"
          />
        </div>
      </Wizard.Step>
      <Wizard.Step>
        <ReviewRow label="Name" value={name || "-"} />
        <ReviewRow
          label="Description"
          value={description || "(none)"}
        />
        {error ? (
          <p className="rounded-sm border border-rose-500/30 px-3 py-2 text-[length:var(--text-xs)] text-rose-300">
            {error}
          </p>
        ) : null}
      </Wizard.Step>
    </Wizard>
  );
}

function ScopeRadio({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: typeof Upload;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={[
        "flex items-start gap-3 rounded-sm border p-3 text-left transition-colors",
        checked
          ? "border-white"
          : "border-border hover:border-border-strong",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-white bg-white" : "border-border-strong",
        ].join(" ")}
      >
        {checked ? <span className="block h-1.5 w-1.5 rounded-full bg-zinc-950" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-white/60" />
          <span className="text-[length:var(--text-sm)] font-medium text-white">
            {label}
          </span>
        </div>
        <p className="mt-1 text-[length:var(--text-xs)] text-white/50">{description}</p>
      </div>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-[length:var(--text-xs)] uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
      <span className="text-[length:var(--text-sm)] text-white text-right">{value}</span>
    </div>
  );
}
