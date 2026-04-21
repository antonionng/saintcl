"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { DeckMode } from "@/components/training/deck-mode";
import { LibraryDrawer } from "@/components/training/library-drawer";
import { ParticipantWorkspaceRouter } from "@/components/training/participant-workspace-router";
import type { DeckState } from "@/components/training/use-live-deck-session";
import type { TrainingParticipantExperience } from "@/lib/training";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type { ParticipantAction } from "@/lib/training-scripts/types";
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

export type ModuleJourneyShellProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  moduleSequence: number;
  totalModules: number;
  deckHref: string;
  deckTitle: string;
  briefContent: ReactNode;
  moduleOutline?: ReactNode;
  progressLabel: string;
  workbookHref: string;
  workbookHtml: string | null;
  resources: ResourceLink[];
  participantExperience: TrainingParticipantExperience;
  pythonNotebookPreviews: PythonNotebookPreview[];
  renderedNotebookPreviews: RenderedNotebookPreview[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  participantActionsBySlide?: Record<number, ParticipantAction>;
  /**
   * When true, the "Start lab" action navigates to the dedicated full-viewport
   * lab route at `/academy/[inviteCode]/[moduleSlug]/lab/[checkpointSlug]`
   * instead of opening the inline workspace panel.
   */
  enableLabRoute?: boolean;
};

export function ModuleJourneyShell(props: ModuleJourneyShellProps) {
  const {
    inviteCode,
    moduleSlug,
    moduleTitle,
    moduleSequence,
    totalModules,
    deckHref,
    deckTitle,
    briefContent,
    moduleOutline,
    progressLabel,
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
    participantActionsBySlide,
    enableLabRoute,
  } = props;

  const buildLabHref = useMemo(() => {
    if (!enableLabRoute) return undefined;
    return (checkpointSlug: string) =>
      `/academy/${inviteCode}/${moduleSlug}/lab/${checkpointSlug}`;
  }, [enableLabRoute, inviteCode, moduleSlug]);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [deckState, setDeckState] = useState<DeckState | null>(null);

  const handleDeckStateChange = useCallback((next: DeckState | null) => {
    setDeckState(next);
  }, []);

  const handleStartLab = useCallback(() => {
    setWorkspaceOpen(true);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const node = document.getElementById("module-journey-workspace");
        node?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <div className="space-y-5">
      <header className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-5 py-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Module {moduleSequence} of {totalModules}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{moduleTitle}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Follow the deck. Labs open when the activity begins. Library holds
              everything else.
            </p>
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
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/[0.06]"
            >
              Open library
            </button>
          </div>
        </div>
      </header>

      <DeckMode
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        deckHref={deckHref}
        deckTitle={deckTitle}
        labCheckpoints={labCheckpoints}
        initialLabProgress={initialLabProgress}
        participantActionsBySlide={participantActionsBySlide}
        onOpenLibrary={() => setLibraryOpen(true)}
        onStartLab={handleStartLab}
        onDeckStateChange={handleDeckStateChange}
        buildLabHref={buildLabHref}
      />

      {workspaceOpen ? (
        <section
          id="module-journey-workspace"
          className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[0_20px_64px_rgba(0,0,0,0.2)]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Lab
              </p>
              <p className="mt-1 text-base font-medium text-white">
                Inline workspace
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Full screen lab mode arrives in the next iteration. For now the
                editor, checkpoints, and submissions live here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWorkspaceOpen(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
            >
              Hide lab
            </button>
          </div>
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
            deckState={deckState}
            facilitatorPrompt={null}
          />
        </section>
      ) : null}

      <LibraryDrawer
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        inviteCode={inviteCode}
        moduleSlug={moduleSlug}
        briefContent={briefContent}
        moduleOutline={moduleOutline}
        workbookHref={workbookHref}
        workbookHtml={workbookHtml}
        resources={resources}
        pythonNotebookPreviews={pythonNotebookPreviews}
        renderedNotebookPreviews={renderedNotebookPreviews}
        experience={participantExperience}
      />
    </div>
  );
}
