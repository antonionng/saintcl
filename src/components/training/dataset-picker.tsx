"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { TrainingModuleResource } from "@/lib/training";

export type DatasetPickerEntry = {
  id: string;
  label: string;
  href?: string | null;
  description?: string | null;
  source: "module" | "uploaded";
  sizeBytes?: number | null;
};

export type DatasetPickerProps = {
  inviteCode: string;
  moduleSlug: string;
  /** Built-in module datasets (typically `getTrainingModuleResources(moduleSlug).filter(kind === "dataset")`). */
  moduleDatasets: TrainingModuleResource[];
  /** Files the participant has previously uploaded into their managed workspace. */
  uploadedDatasets?: Array<{ fileName: string; sizeBytes?: number | null }>;
  /** Currently selected dataset id (file name for uploads, href for module datasets). */
  selectedId?: string | null;
  onSelect?: (dataset: DatasetPickerEntry | null) => void;
  /** Called after a successful upload; parent should typically refresh listings. */
  onUploaded?: (uploadedFiles: Array<{ fileName: string; size: number }>) => void;
  /** Surface label, e.g. "Lab data" or "Assessment data". */
  title?: string;
  description?: string;
  /** When false, hides the upload dropzone (useful for read-only assessment review). */
  allowUpload?: boolean;
};

function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DatasetPicker({
  inviteCode,
  moduleSlug,
  moduleDatasets,
  uploadedDatasets = [],
  selectedId = null,
  onSelect,
  onUploaded,
  title = "Lab data",
  description = "Pick from the bundled datasets for this module or upload your own to use across the lab.",
  allowUpload = true,
}: DatasetPickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const entries = useMemo<DatasetPickerEntry[]>(() => {
    const moduleEntries: DatasetPickerEntry[] = moduleDatasets.map((resource) => ({
      id: resource.href,
      label: resource.label,
      href: resource.href,
      source: "module",
    }));
    const uploadedEntries: DatasetPickerEntry[] = uploadedDatasets.map((entry) => ({
      id: `uploads/${entry.fileName}`,
      label: entry.fileName,
      source: "uploaded",
      sizeBytes: entry.sizeBytes ?? null,
    }));
    return [...moduleEntries, ...uploadedEntries];
  }, [moduleDatasets, uploadedDatasets]);

  const handleSelect = useCallback(
    (entry: DatasetPickerEntry | null) => {
      if (onSelect) onSelect(entry);
    },
    [onSelect],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploadError(null);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("inviteCode", inviteCode);
        formData.append("moduleSlug", moduleSlug);
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
        const response = await fetch("/api/training/participant/workspace/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          throw new Error(payload?.error?.message ?? "Upload failed.");
        }
        const payload = (await response.json()) as {
          data?: { files?: Array<{ fileName: string; size: number }> };
        };
        const uploaded = payload.data?.files ?? [];
        if (onUploaded) onUploaded(uploaded);
        if (uploaded.length > 0 && onSelect) {
          const lastUpload = uploaded[uploaded.length - 1];
          handleSelect({
            id: `uploads/${lastUpload.fileName}`,
            label: lastUpload.fileName,
            source: "uploaded",
            sizeBytes: lastUpload.size,
          });
        }
      } catch (uploadFailure) {
        setUploadError(
          uploadFailure instanceof Error
            ? uploadFailure.message
            : "Upload failed.",
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [handleSelect, inviteCode, moduleSlug, onSelect, onUploaded],
  );

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        {allowUpload ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-60"
          >
            {isUploading ? "Uploading..." : "Upload data"}
          </button>
        ) : null}
      </div>

      {allowUpload ? (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      ) : null}

      {uploadError ? (
        <p className="mt-1 text-[11px] text-rose-300">{uploadError}</p>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-zinc-500">
            No datasets yet. {allowUpload ? "Upload one to get started." : ""}
          </p>
        ) : null}
        {entries.map((entry) => {
          const isActive = selectedId === entry.id;
          const sizeLabel = formatBytes(entry.sizeBytes);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleSelect(entry)}
              className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                isActive
                  ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-100"
                  : "border-white/8 bg-white/[0.02] text-zinc-200 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{entry.label}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {entry.source === "module" ? "Module dataset" : "Your upload"}
                  {sizeLabel ? ` · ${sizeLabel}` : ""}
                </p>
                {entry.description ? (
                  <p className="mt-1 text-[11px] text-zinc-500">{entry.description}</p>
                ) : null}
              </div>
              {entry.href ? (
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="shrink-0 text-[11px] text-zinc-400 underline-offset-2 hover:text-zinc-100 hover:underline"
                >
                  Open
                </a>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
