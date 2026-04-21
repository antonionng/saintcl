"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { TrainingModuleResource } from "@/lib/training";

import type { AttachedDataset } from "./lab-chat-types";

export type LabChatQuickAction = {
  id: string;
  label: string;
  prompt?: string;
  onSelect?: () => void;
};

export type LabChatComposerProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleDatasets: TrainingModuleResource[];
  attachedDataset: AttachedDataset | null;
  onSendText: (text: string) => Promise<void> | void;
  onAttachModuleDataset: (resource: TrainingModuleResource) => void;
  onClearDataset: () => void;
  onUploadFiles: (files: File[]) => Promise<void> | void;
  quickActions?: LabChatQuickAction[];
  isSending: boolean;
  isUploading: boolean;
  runtimeReady: boolean;
  placeholder?: string;
  onAttachReady?: (open: () => void) => void;
};

export function LabChatComposer({
  moduleDatasets,
  attachedDataset,
  onSendText,
  onAttachModuleDataset,
  onClearDataset,
  onUploadFiles,
  quickActions = [],
  isSending,
  isUploading,
  runtimeReady,
  placeholder = "Ask the coach for help, paste code, or describe what you want to do.",
  onAttachReady,
}: LabChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const next = Math.min(textarea.scrollHeight, 240);
    textarea.style.height = `${next}px`;
  }, [draft]);

  useEffect(() => {
    if (!onAttachReady) return;
    onAttachReady(() => setAttachOpen(true));
  }, [onAttachReady]);

  useEffect(() => {
    if (!attachOpen) return;
    function onClick(event: MouseEvent) {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target as Node)) return;
      setAttachOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [attachOpen]);

  const datasetEntries = useMemo(() => moduleDatasets ?? [], [moduleDatasets]);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");
    await onSendText(trimmed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    await onUploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAttachOpen(false);
  }

  return (
    <div className="border-t border-white/[0.06] bg-black/40 backdrop-blur">
      <div className="mx-auto w-full max-w-[760px] px-4 py-3 sm:px-6">
        {attachedDataset ? (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-0.5 text-emerald-100">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />
              {attachedDataset.label}
              <button
                type="button"
                onClick={onClearDataset}
                className="ml-1 text-emerald-200 transition hover:text-white"
                aria-label="Remove attached dataset"
              >
                &times;
              </button>
            </span>
            {attachedDataset.workspacePath ? (
              <code className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {attachedDataset.workspacePath}
              </code>
            ) : null}
          </div>
        ) : null}

        {quickActions.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={isSending}
                onClick={() => {
                  if (action.onSelect) {
                    action.onSelect();
                    return;
                  }
                  if (action.prompt) {
                    void onSendText(action.prompt);
                  }
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative flex items-end gap-2 rounded-3xl border border-white/[0.08] bg-white/[0.025] px-2 py-2 focus-within:border-white/20">
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setAttachOpen((current) => !current)}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06]"
              aria-label="Tell the coach which dataset you are using"
              title="Tell the coach which dataset you are using"
            >
              +
            </button>
            {attachOpen ? (
              <div className="absolute bottom-12 left-0 z-20 w-[300px] rounded-2xl border border-white/10 bg-[#0b0d12] p-2 shadow-xl">
                <p className="px-2 pb-0.5 pt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Tell the coach which dataset
                </p>
                <p className="px-2 pb-1.5 text-[10px] leading-snug text-zinc-500">
                  All bundled CSVs are already loaded at <code className="text-zinc-400">/workspace/data/</code>. Picking one here just focuses the coach&apos;s hints. Fix dirty data in your code, not by re-uploading.
                </p>
                <div className="max-h-48 overflow-y-auto">
                  {datasetEntries.length === 0 ? (
                    <p className="px-2 py-2 text-[11px] text-zinc-500">
                      No bundled datasets for this module.
                    </p>
                  ) : (
                    datasetEntries.map((resource) => (
                      <button
                        key={resource.href}
                        type="button"
                        onClick={() => {
                          onAttachModuleDataset(resource);
                          setAttachOpen(false);
                        }}
                        className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left text-[12px] text-zinc-200 transition hover:bg-white/[0.05]"
                      >
                        <span aria-hidden className="mt-0.5 text-zinc-500">
                          &middot;
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{resource.label}</span>
                          <span className="block truncate text-[10px] text-zinc-500">
                            {resource.href}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-1 border-t border-white/[0.06] pt-1">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-[12px] text-zinc-100 transition hover:bg-white/[0.05] disabled:opacity-60"
                  >
                    <span>Upload your own (CSV, JSON, Parquet)</span>
                    <span className="text-[10px] text-zinc-500">
                      {isUploading ? "Uploading..." : "Choose"}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={runtimeReady ? placeholder : "Loading Python runtime..."}
            className="min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13px] leading-6 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || draft.trim().length === 0}
            className="flex h-9 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/[0.16] px-3.5 text-[12px] font-medium text-sky-50 transition hover:bg-sky-400/[0.24] disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>

        <p className="mt-1 px-1 text-[10px] text-zinc-500">
          Enter to send &middot; Shift + Enter for newline &middot; Coach replies with prose and runnable code.
        </p>
      </div>
    </div>
  );
}
