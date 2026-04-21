"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { TrainingAssessmentsPanel } from "@/components/training/training-assessments-panel";
import type { TrainingParticipantExperience } from "@/lib/training";

const EXECUTABLE_NOTEBOOK_EXPERIENCES: ReadonlyArray<TrainingParticipantExperience> = [
  "python-workspace",
  "ml-lab",
  "neural-lab",
  "viz-studio",
];

function usesExecutableNotebookPreviews(experience: TrainingParticipantExperience) {
  return EXECUTABLE_NOTEBOOK_EXPERIENCES.includes(experience);
}

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

type LibrarySection =
  | "brief"
  | "map"
  | "workbook"
  | "notebooks"
  | "assessments"
  | "files";

export type LibraryDrawerProps = {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  moduleSlug: string;
  briefContent: ReactNode;
  moduleOutline?: ReactNode;
  workbookHref: string;
  workbookHtml: string | null;
  resources: ResourceLink[];
  pythonNotebookPreviews: PythonNotebookPreview[];
  renderedNotebookPreviews: RenderedNotebookPreview[];
  experience: TrainingParticipantExperience;
  defaultSection?: LibrarySection;
};

const richTextClassName =
  "max-w-none text-sm leading-7 text-zinc-200 [&_a]:text-sky-300 [&_a]:underline [&_blockquote]:border-l [&_blockquote]:border-white/10 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:mt-0 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_hr]:my-6 [&_hr]:border-white/8 [&_li]:text-zinc-300 [&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/8 [&_pre]:bg-[#05080d] [&_pre]:px-4 [&_pre]:py-3 [&_pre]:text-xs [&_pre]:leading-6 [&_strong]:text-white [&_table]:my-4 [&_table]:w-full [&_td]:border-b [&_td]:border-white/8 [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5";

export function LibraryDrawer({
  open,
  onClose,
  inviteCode,
  moduleSlug,
  briefContent,
  moduleOutline,
  workbookHref,
  workbookHtml,
  resources,
  pythonNotebookPreviews,
  renderedNotebookPreviews,
  experience,
  defaultSection = "brief",
}: LibraryDrawerProps) {
  const [activeSection, setActiveSection] = useState<LibrarySection>(defaultSection);
  const [activeNotebookHref, setActiveNotebookHref] = useState<string>(
    pythonNotebookPreviews[0]?.href ?? renderedNotebookPreviews[0]?.href ?? "",
  );

  const downloadableResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.kind !== "guide" &&
          resource.kind !== "workbook" &&
          resource.kind !== "notebook" &&
          resource.kind !== "deck",
      ),
    [resources],
  );

  const notebookCount = usesExecutableNotebookPreviews(experience)
    ? pythonNotebookPreviews.length
    : renderedNotebookPreviews.length;

  const sections: Array<{ id: LibrarySection; label: string; visible: boolean }> = [
    { id: "brief", label: "Brief", visible: true },
    { id: "map", label: "Module map", visible: Boolean(moduleOutline) },
    { id: "workbook", label: "Workbook", visible: Boolean(workbookHtml) },
    {
      id: "notebooks",
      label: notebookCount > 0 ? `Notebooks (${notebookCount})` : "Notebooks",
      visible: notebookCount > 0,
    },
    { id: "assessments", label: "Assessments", visible: true },
    {
      id: "files",
      label:
        downloadableResources.length > 0
          ? `Files (${downloadableResources.length})`
          : "Files",
      visible: downloadableResources.length > 0,
    },
  ];

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const activePythonNotebook =
    pythonNotebookPreviews.find((notebook) => notebook.href === activeNotebookHref) ??
    pythonNotebookPreviews[0] ??
    null;
  const activeRenderedNotebook =
    renderedNotebookPreviews.find((notebook) => notebook.href === activeNotebookHref) ??
    renderedNotebookPreviews[0] ??
    null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#0c0d10] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Module library
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Resources for this module
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.05]"
          >
            Close
          </button>
        </header>

        <nav className="flex flex-wrap gap-2 border-b border-white/8 px-5 py-3">
          {sections
            .filter((section) => section.visible)
            .map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  activeSection === section.id
                    ? "border-sky-400/40 bg-sky-400/[0.1] text-sky-100"
                    : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]"
                }`}
              >
                {section.label}
              </button>
            ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeSection === "brief" ? <div className="space-y-4">{briefContent}</div> : null}

          {activeSection === "map" && moduleOutline ? (
            <div className="space-y-4">{moduleOutline}</div>
          ) : null}

          {activeSection === "workbook" ? (
            workbookHtml ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    Workbook
                  </p>
                  <a
                    href={workbookHref}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.05]"
                  >
                    Open raw file
                  </a>
                </div>
                <article
                  className={richTextClassName}
                  dangerouslySetInnerHTML={{ __html: workbookHtml }}
                />
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Workbook content is not available for this module yet.
              </p>
            )
          ) : null}

          {activeSection === "notebooks" ? (
            usesExecutableNotebookPreviews(experience) ? (
              pythonNotebookPreviews.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {pythonNotebookPreviews.map((notebook) => (
                      <button
                        key={notebook.href}
                        type="button"
                        onClick={() => setActiveNotebookHref(notebook.href)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          activePythonNotebook?.href === notebook.href
                            ? "border-sky-400/40 bg-sky-400/[0.1] text-sky-100"
                            : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        {notebook.title}
                      </button>
                    ))}
                  </div>
                  {activePythonNotebook ? (
                    <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {activePythonNotebook.title}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-500">
                            Open the lab to run these blocks interactively.
                          </p>
                        </div>
                        <a
                          href={activePythonNotebook.href}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.05]"
                        >
                          Open raw
                        </a>
                      </div>
                      <div className="space-y-3">
                        {activePythonNotebook.codeBlocks.map((block) => (
                          <div
                            key={block.label}
                            className="rounded-2xl border border-white/8 bg-[#05080d]"
                          >
                            <div className="border-b border-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              {block.label}
                            </div>
                            <pre className="overflow-x-auto px-3 py-3 text-xs leading-6 text-zinc-200">
                              <code>{block.code}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No notebook previews available yet.
                </p>
              )
            ) : renderedNotebookPreviews.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {renderedNotebookPreviews.map((notebook) => (
                    <button
                      key={notebook.href}
                      type="button"
                      onClick={() => setActiveNotebookHref(notebook.href)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        activeRenderedNotebook?.href === notebook.href
                          ? "border-sky-400/40 bg-sky-400/[0.1] text-sky-100"
                          : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {notebook.title}
                    </button>
                  ))}
                </div>
                {activeRenderedNotebook ? (
                  <div className="space-y-3">
                    {activeRenderedNotebook.cells.map((cell) =>
                      cell.type === "markdown" ? (
                        <article
                          key={cell.id}
                          className={`${richTextClassName} rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4`}
                          dangerouslySetInnerHTML={{ __html: cell.html ?? "" }}
                        />
                      ) : (
                        <div
                          key={cell.id}
                          className="rounded-2xl border border-white/8 bg-[#05080d]"
                        >
                          <div className="border-b border-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Code cell
                          </div>
                          <pre className="overflow-x-auto px-3 py-3 text-xs leading-6 text-zinc-200">
                            <code>{cell.source}</code>
                          </pre>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No notebook content available yet.</p>
            )
          ) : null}

          {activeSection === "assessments" ? (
            <TrainingAssessmentsPanel inviteCode={inviteCode} moduleSlug={moduleSlug} />
          ) : null}

          {activeSection === "files" ? (
            downloadableResources.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {downloadableResources.map((resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-white/16 hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        {resource.kind}
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {resource.label}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                      Open
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No extra downloadable files yet.</p>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
