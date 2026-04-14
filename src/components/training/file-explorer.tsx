"use client";

import { useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type WorkspaceFileRecord = {
  path: string;
  name: string;
  size: number;
  scope: "dataset" | "upload" | "output";
};

type FileExplorerProps = {
  files: WorkspaceFileRecord[];
  onUpload: (files: FileList) => void;
  onDownload: (file: WorkspaceFileRecord) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getScopeLabel(scope: WorkspaceFileRecord["scope"]) {
  if (scope === "dataset") return "Mounted data";
  if (scope === "upload") return "Uploaded";
  return "Generated";
}

export function FileExplorer({ files, onUpload, onDownload }: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const groupedFiles = useMemo(() => {
    return {
      dataset: files.filter((file) => file.scope === "dataset"),
      upload: files.filter((file) => file.scope === "upload"),
      output: files.filter((file) => file.scope === "output"),
    };
  }, [files]);

  return (
    <Card className="border-white/8 bg-black/15">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Workspace files</CardTitle>
            <CardDescription>Mounted datasets, your uploaded files, and generated outputs live in one browser workspace.</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            if (!event.target.files?.length) return;
            onUpload(event.target.files);
            event.target.value = "";
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {(["dataset", "upload", "output"] as const).map((scope) => {
          const scopedFiles = groupedFiles[scope];
          return (
            <div key={scope} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{getScopeLabel(scope)}</p>
                <span className="text-xs text-zinc-500">{scopedFiles.length}</span>
              </div>
              {scopedFiles.length > 0 ? (
                <div className="space-y-2">
                  {scopedFiles.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-zinc-200"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-zinc-100">{file.name}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(file)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-3 text-xs text-zinc-500">
                  No files in this section yet.
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
