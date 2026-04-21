"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AiCoachPanel } from "@/components/training/ai-coach-panel";
import {
  publishLabCoachContext,
  readLabCoachContext,
  subscribeToLabCoachContext,
} from "@/components/training/lab-coach-context";
import {
  DatasetPicker,
  type DatasetPickerEntry,
} from "@/components/training/dataset-picker";
import { LabChatShell } from "@/components/training/lab-chat/lab-chat-shell";
import { ParticipantWorkspaceRouter } from "@/components/training/participant-workspace-router";
import type { TrainingModuleResource } from "@/lib/training";
import type { TrainingParticipantExperience } from "@/lib/training";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type ResourceLink = {
  label: string;
  href: string;
  kind: string;
};

type PythonNotebookPreview = {
  slug: string;
  title: string;
  href: string;
  outputFolder: string;
  focus: string[];
  codeBlocks: Array<{ label: string; code: string }>;
  expectedSignals: string[];
};

export type LabModeProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  deckBackHref: string;
  workbookHref: string;
  participantExperience: TrainingParticipantExperience;
  resources: ResourceLink[];
  pythonNotebookPreviews: PythonNotebookPreview[];
  labCheckpoints: TrainingLabCheckpoint[];
  activeCheckpointSlug: string;
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
};

export function LabMode(props: LabModeProps) {
  const {
    inviteCode,
    moduleSlug,
    moduleTitle,
    deckHref,
    deckBackHref,
    workbookHref,
    participantExperience,
    resources,
    pythonNotebookPreviews,
    labCheckpoints,
    activeCheckpointSlug,
    initialLabProgress,
    initialSubmissions,
    initialWorkspaces,
  } = props;

  const activeCheckpoint =
    labCheckpoints.find((checkpoint) => checkpoint.slug === activeCheckpointSlug) ??
    labCheckpoints[0] ??
    null;

  const isChatLab = participantExperience === "python-workspace";

  const [coachOpen, setCoachOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);
  const [uploadedDatasets, setUploadedDatasets] = useState<
    Array<{ fileName: string; sizeBytes?: number | null }>
  >([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const moduleDatasets: TrainingModuleResource[] = resources
    .filter((resource) => resource.kind === "dataset")
    .map((resource) => ({
      label: resource.label,
      href: resource.href,
      kind: "dataset" as const,
    }));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    // The workspace publishes code/stdout/stderr/task context on change. We
    // listen only to keep the latest snapshot hot in the store; the coach
    // reads it on demand via readLabCoachContext.
    const unsubscribe = subscribeToLabCoachContext(() => undefined);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a] text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-black/40 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href={deckBackHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exit to deck
          </Link>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Lab {moduleTitle}
            </p>
            <p className="text-sm font-semibold text-white">
              {activeCheckpoint?.title ?? "Lab activity"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={deckHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.06]"
          >
            Open deck in tab
          </a>
          {isChatLab ? null : (
            <>
              <button
                type="button"
                onClick={() => setDataOpen((value) => !value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  dataOpen
                    ? "border-emerald-400/40 bg-emerald-400/[0.1] text-emerald-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                }`}
              >
                Data
              </button>
              <button
                type="button"
                onClick={() => setCoachOpen((value) => !value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  coachOpen
                    ? "border-sky-400/40 bg-sky-400/[0.1] text-sky-100"
                    : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                }`}
              >
                AI coach
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {isChatLab ? (
          <LabChatShell
            inviteCode={inviteCode}
            moduleSlug={moduleSlug}
            activeCheckpoint={activeCheckpoint}
            notebookPreviews={pythonNotebookPreviews}
            moduleDatasets={moduleDatasets}
          />
        ) : null}
        {!isChatLab && dataOpen ? (
          <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-r border-white/[0.08] bg-black/30 px-4 py-4 lg:block">
            <DatasetPicker
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              moduleDatasets={moduleDatasets}
              uploadedDatasets={uploadedDatasets}
              selectedId={selectedDatasetId}
              onSelect={(entry: DatasetPickerEntry | null) => {
                setSelectedDatasetId(entry?.id ?? null);
                publishLabCoachContext({ datasetName: entry?.label ?? null });
              }}
              onUploaded={(uploaded) => {
                setUploadedDatasets((current) => {
                  const merged = new Map<string, { fileName: string; sizeBytes?: number | null }>();
                  for (const item of current) merged.set(item.fileName, item);
                  for (const item of uploaded) {
                    merged.set(item.fileName, {
                      fileName: item.fileName,
                      sizeBytes: item.size,
                    });
                  }
                  return Array.from(merged.values());
                });
              }}
            />
          </aside>
        ) : null}

        {isChatLab ? null : (
        <main className="flex min-w-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
            {activeCheckpoint ? (
              <section
                aria-label="What to do here"
                className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.025] px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Activity
                    </p>
                    <h1 className="mt-1 text-lg font-semibold text-white">
                      {activeCheckpoint.title}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                      {activeCheckpoint.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                    <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />
                    Facilitator sees your progress
                  </span>
                </div>
                <ol className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    {
                      n: "1",
                      title: "Pick your data",
                      body: "Use the Lab data panel on the left, or upload your own CSV.",
                      dir: "\u2190 left",
                    },
                    {
                      n: "2",
                      title: "Load the lab",
                      body: 'Click "Load lab" below to start Python in your browser.',
                      dir: "\u2193 below",
                    },
                    {
                      n: "3",
                      title: "Run + check",
                      body: "Run the setup block, then mark the checkpoint complete on the right.",
                      dir: "\u2192 right",
                    },
                  ].map((step) => (
                    <li
                      key={step.n}
                      className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[10px] font-semibold text-zinc-200"
                        >
                          {step.n}
                        </span>
                        <p className="text-[13px] font-medium text-white">{step.title}</p>
                        <span className="ml-auto whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                          {step.dir}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-zinc-400">{step.body}</p>
                    </li>
                  ))}
                </ol>
                {activeCheckpoint.facilitatorPrompt ? (
                  <p className="mt-3 text-[11px] text-zinc-500">
                    Facilitator note &middot; {activeCheckpoint.facilitatorPrompt}
                  </p>
                ) : null}
              </section>
            ) : null}
            <ParticipantWorkspaceRouter
              participantExperience={participantExperience}
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              moduleTitle={moduleTitle}
              deckHref={deckHref}
              workbookHref={workbookHref}
              notebookPreviews={pythonNotebookPreviews}
              resources={resources}
              labCheckpoints={labCheckpoints}
              initialLabProgress={initialLabProgress}
              initialSubmissions={initialSubmissions}
              initialWorkspaces={initialWorkspaces}
              deckState={null}
              facilitatorPrompt={null}
              variant="lab"
              initialCheckpointSlug={activeCheckpointSlug}
            />
          </div>
        </main>
        )}

        {!isChatLab && coachOpen ? (
          <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-white/[0.08] bg-black/40 px-4 py-4 lg:block">
            <AiCoachPanel
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              checkpoint={activeCheckpoint}
              getContext={() => readLabCoachContext()}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
