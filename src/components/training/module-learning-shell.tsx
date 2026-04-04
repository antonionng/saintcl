"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { PythonParticipantDeckPanel, type ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import { PythonParticipantModuleExperience } from "@/components/training/python-participant-module-experience";
import { TrainingParticipantCheckpointExperience } from "@/components/training/training-participant-checkpoint-experience";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type ContentTab = "overview" | "workspace" | "workbook" | "notebooks" | "files";

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
  codeBlocks: Array<{
    label: string;
    code: string;
  }>;
  expectedSignals: string[];
};

type RenderedNotebookCell = {
  id: string;
  type: "markdown" | "code";
  html?: string;
  source: string;
};

type RenderedNotebookPreview = {
  title: string;
  href: string;
  cells: RenderedNotebookCell[];
};

type ModuleLearningShellProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  moduleSequence: number;
  totalModules: number;
  deckHref: string;
  deckTitle: string;
  overviewContent: ReactNode;
  progressLabel: string;
  defaultTab?: ContentTab;
  workbookHref: string;
  workbookHtml: string | null;
  resources: ResourceLink[];
  participantExperience: "python-workspace" | "checkpoint";
  pythonNotebookPreviews: PythonNotebookPreview[];
  renderedNotebookPreviews: RenderedNotebookPreview[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  enableProgressTracking?: boolean;
};

const richTextClassName =
  "max-w-none text-sm leading-7 text-zinc-200 [&_a]:text-sky-300 [&_a]:underline [&_blockquote]:border-l [&_blockquote]:border-white/10 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:mt-0 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_hr]:my-6 [&_hr]:border-white/8 [&_li]:text-zinc-300 [&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/8 [&_pre]:bg-[#05080d] [&_pre]:px-4 [&_pre]:py-3 [&_pre]:text-xs [&_pre]:leading-6 [&_strong]:text-white [&_table]:my-4 [&_table]:w-full [&_td]:border-b [&_td]:border-white/8 [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5";

function getTabButtonClass(isActive: boolean) {
  return isActive
    ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-100"
    : "border-white/10 bg-black/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.05] hover:text-white";
}

export function ModuleLearningShell({
  inviteCode,
  moduleSlug,
  moduleTitle,
  moduleSequence,
  totalModules,
  deckHref,
  deckTitle,
  overviewContent,
  progressLabel,
  defaultTab = "overview",
  workbookHref,
  workbookHtml,
  resources,
  participantExperience,
  pythonNotebookPreviews,
  renderedNotebookPreviews,
  labCheckpoints,
  initialLabProgress,
  initialSubmissions,
  initialWorkspaces,
  enableProgressTracking = true,
}: ModuleLearningShellProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>(defaultTab);
  const [deckState, setDeckState] = useState<ParticipantDeckState | null>(null);
  const [facilitatorPrompt, setFacilitatorPrompt] = useState<string | null>(null);
  const [activePythonNotebookSlug, setActivePythonNotebookSlug] = useState(pythonNotebookPreviews[0]?.slug ?? "");
  const [activeRenderedNotebookHref, setActiveRenderedNotebookHref] = useState(renderedNotebookPreviews[0]?.href ?? "");

  const handleDeckStateChange = useCallback((nextDeckState: ParticipantDeckState | null) => {
    setDeckState(nextDeckState);
  }, []);

  const handleFacilitatorPromptChange = useCallback((nextPrompt: string | null) => {
    setFacilitatorPrompt(nextPrompt);
  }, []);

  const participantResources = useMemo(
    () => resources.filter((resource) => resource.kind !== "guide"),
    [resources],
  );
  const downloadableResources = useMemo(
    () =>
      participantResources.filter(
        (resource) => resource.kind !== "workbook" && resource.kind !== "notebook" && resource.kind !== "deck",
      ),
    [participantResources],
  );
  const notebookCount =
    participantExperience === "python-workspace" ? pythonNotebookPreviews.length : renderedNotebookPreviews.length;
  const activePythonNotebook = useMemo(
    () => pythonNotebookPreviews.find((notebook) => notebook.slug === activePythonNotebookSlug) ?? pythonNotebookPreviews[0] ?? null,
    [activePythonNotebookSlug, pythonNotebookPreviews],
  );
  const activeRenderedNotebook = useMemo(
    () =>
      renderedNotebookPreviews.find((notebook) => notebook.href === activeRenderedNotebookHref) ??
      renderedNotebookPreviews[0] ??
      null,
    [activeRenderedNotebookHref, renderedNotebookPreviews],
  );
  const tabItems = useMemo(
    () => [
      { id: "overview" as const, label: "Overview" },
      { id: "workspace" as const, label: "Workspace" },
      { id: "workbook" as const, label: "Workbook" },
      { id: "notebooks" as const, label: `Notebooks${notebookCount > 0 ? ` (${notebookCount})` : ""}` },
      { id: "files" as const, label: `Files${downloadableResources.length > 0 ? ` (${downloadableResources.length})` : ""}` },
    ],
    [downloadableResources.length, notebookCount],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Module {moduleSequence} of {totalModules}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{moduleTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200">
              {progressLabel}
            </span>
            {deckState ? (
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200">
                Slide {deckState.slideIndex + 1}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <PythonParticipantDeckPanel
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        deckHref={deckHref}
        deckTitle={deckTitle}
        onDeckStateChange={handleDeckStateChange}
        onFacilitatorPromptChange={handleFacilitatorPromptChange}
        enableProgressTracking={enableProgressTracking}
      />

      <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-4">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${getTabButtonClass(activeTab === tab.id)}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeTab === "overview" ? <div className="space-y-4">{overviewContent}</div> : null}

          {activeTab === "workspace" ? (
            participantExperience === "python-workspace" ? (
              <PythonParticipantModuleExperience
                inviteCode={inviteCode}
                moduleSlug={moduleSlug}
                deckHref={deckHref}
                workbookHref={workbookHref}
                notebookPreviews={pythonNotebookPreviews}
                resources={resources}
                labCheckpoints={labCheckpoints}
                initialLabProgress={initialLabProgress}
                initialSubmissions={initialSubmissions}
                initialWorkspaces={initialWorkspaces}
                deckState={deckState}
                facilitatorPrompt={facilitatorPrompt}
                enableProgressTracking={enableProgressTracking}
              />
            ) : (
              <TrainingParticipantCheckpointExperience
                inviteCode={inviteCode}
                moduleSlug={moduleSlug}
                moduleTitle={moduleTitle}
                labCheckpoints={labCheckpoints}
                initialLabProgress={initialLabProgress}
                deckState={deckState}
                facilitatorPrompt={facilitatorPrompt}
                enableProgressTracking={enableProgressTracking}
              />
            )
          ) : null}

          {activeTab === "workbook" ? (
            workbookHtml ? (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Workbook</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Use this tab when you want the written teaching notes, exercises, and prompts in one readable place.
                    </p>
                  </div>
                  <a
                    href={workbookHref}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    Open raw file
                  </a>
                </div>
                <article className={richTextClassName} dangerouslySetInnerHTML={{ __html: workbookHtml }} />
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
                Workbook content is not available for this module yet.
              </div>
            )
          ) : null}

          {activeTab === "notebooks" ? (
            participantExperience === "python-workspace" ? (
              pythonNotebookPreviews.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {pythonNotebookPreviews.map((notebook) => (
                      <button
                        key={notebook.slug}
                        type="button"
                        onClick={() => setActivePythonNotebookSlug(notebook.slug)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${getTabButtonClass(activePythonNotebook?.slug === notebook.slug)}`}
                      >
                        {notebook.title}
                      </button>
                    ))}
                  </div>

                  {activePythonNotebook ? (
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Notebook</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{activePythonNotebook.title}</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            Review the notebook focus areas and starter blocks here, then move back to the workspace tab to run and validate them.
                          </p>
                        </div>
                        <a
                          href={activePythonNotebook.href}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          Open raw file
                        </a>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Focus areas</p>
                            <div className="mt-3 space-y-2 text-sm text-zinc-300">
                              {activePythonNotebook.focus.length > 0 ? (
                                activePythonNotebook.focus.map((item) => (
                                  <div key={item} className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                                    {item}
                                  </div>
                                ))
                              ) : (
                                <p className="text-zinc-500">No focus areas were extracted for this notebook.</p>
                              )}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Expected signals</p>
                            <div className="mt-3 space-y-2 text-sm text-zinc-300">
                              {activePythonNotebook.expectedSignals.map((signal) => (
                                <div key={signal} className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                                  {signal}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {activePythonNotebook.codeBlocks.map((block) => (
                            <div key={block.label} className="rounded-2xl border border-white/8 bg-[#05080d]">
                              <div className="border-b border-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                                {block.label}
                              </div>
                              <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-zinc-200">
                                <code>{block.code}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
                  Notebook content is not available for this module yet.
                </div>
              )
            ) : renderedNotebookPreviews.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {renderedNotebookPreviews.map((notebook) => (
                    <button
                      key={notebook.href}
                      type="button"
                      onClick={() => setActiveRenderedNotebookHref(notebook.href)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${getTabButtonClass(activeRenderedNotebook?.href === notebook.href)}`}
                    >
                      {notebook.title}
                    </button>
                  ))}
                </div>

                {activeRenderedNotebook ? (
                  <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Notebook</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{activeRenderedNotebook.title}</h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          Use this tab for worked notebook content. It is read-only here so learners can follow without downloading raw files.
                        </p>
                      </div>
                      <a
                        href={activeRenderedNotebook.href}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        Open raw file
                      </a>
                    </div>
                    <div className="space-y-4">
                      {activeRenderedNotebook.cells.map((cell) =>
                        cell.type === "markdown" ? (
                          <article
                            key={cell.id}
                            className={`${richTextClassName} rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4`}
                            dangerouslySetInnerHTML={{ __html: cell.html ?? "" }}
                          />
                        ) : (
                          <div key={cell.id} className="rounded-2xl border border-white/8 bg-[#05080d]">
                            <div className="border-b border-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                              Code cell
                            </div>
                            <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-zinc-200">
                              <code>{cell.source}</code>
                            </pre>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
                Notebook content is not available for this module yet.
              </div>
            )
          ) : null}

          {activeTab === "files" ? (
            downloadableResources.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {downloadableResources.map((resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-white/16 hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{resource.kind}</p>
                      <p className="mt-2 text-sm font-medium text-white">{resource.label}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">Open</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-6 text-sm text-zinc-300">
                No extra downloadable files are available for this module yet.
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
