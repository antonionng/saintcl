"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PythonLearningWorkspace } from "@/components/training/python-studio-workspace";
import {
  ParticipantWorkbench,
  type WorkbenchActiveTask,
} from "@/components/training/participant-workbench";
import type { ParticipantDeckState } from "@/components/training/python-participant-deck-panel";
import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";
import type {
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type NotebookPreview = {
  slug: string;
  title: string;
  href: string;
  outputFolder: string;
  focus: string[];
  codeBlocks: Array<{ label: string; code: string }>;
  expectedSignals: string[];
};

type ResourceLink = { label: string; href: string; kind: string };

type VizStudioWorkbenchProps = {
  inviteCode: string;
  moduleSlug: string;
  moduleTitle: string;
  deckHref: string;
  workbookHref: string;
  notebookPreviews: NotebookPreview[];
  resources: ResourceLink[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  deckState?: ParticipantDeckState | null;
  facilitatorPrompt?: string | null;
  variant?: "module" | "lab";
  initialCheckpointSlug?: string | null;
};

const STARTER_VEGA_LITE_SPEC = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Branch performance bar chart starter",
  data: {
    values: [
      { branch: "Mansion House", revenue: 4200 },
      { branch: "Westport", revenue: 3100 },
      { branch: "Knightsbridge", revenue: 4900 },
      { branch: "Marylebone", revenue: 2800 },
    ],
  },
  mark: "bar",
  encoding: {
    x: { field: "branch", type: "nominal", title: "Branch" },
    y: { field: "revenue", type: "quantitative", title: "Revenue (000s GBP)" },
  },
};

const RUBRIC_ITEMS = [
  "Audience and decision the chart supports stated",
  "Chart type defended against alternatives",
  "Hierarchy: primary message readable in under three seconds",
  "Accessibility - colour contrast and labels",
  "Annotations carry the takeaway",
];

export function VizStudioWorkbench(props: VizStudioWorkbenchProps) {
  const isLab = props.variant === "lab";

  if (isLab) {
    const activeCheckpoint =
      props.labCheckpoints.find(
        (checkpoint) => checkpoint.slug === props.initialCheckpointSlug,
      ) ?? props.labCheckpoints[0] ?? null;
    return (
      <div className="space-y-4">
        <PythonLearningWorkspace
          inviteCode={props.inviteCode}
          moduleSlug={props.moduleSlug}
          deckHref={props.deckHref}
          workbookHref={props.workbookHref}
          notebookPreviews={props.notebookPreviews}
          resources={props.resources}
          labCheckpoints={props.labCheckpoints}
          initialLabProgress={props.initialLabProgress}
          initialSubmissions={props.initialSubmissions}
          initialWorkspaces={props.initialWorkspaces}
          currentSlideIndex={props.deckState?.slideIndex ?? null}
          currentSlideTitle={props.deckState?.title ?? null}
          facilitatorPrompt={props.facilitatorPrompt}
          variant="lab"
          initialCheckpointSlug={props.initialCheckpointSlug ?? null}
        />
        {activeCheckpoint ? (
          <details className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-200">
            <summary className="cursor-pointer text-sm font-medium text-white">
              Chart spec evidence
            </summary>
            <div className="pt-3">
              <VizStudioWorkArea
                inviteCode={props.inviteCode}
                moduleSlug={props.moduleSlug}
                checkpoint={activeCheckpoint}
                task={null}
              />
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PythonLearningWorkspace
        inviteCode={props.inviteCode}
        moduleSlug={props.moduleSlug}
        deckHref={props.deckHref}
        workbookHref={props.workbookHref}
        notebookPreviews={props.notebookPreviews}
        resources={props.resources}
        labCheckpoints={props.labCheckpoints}
        initialLabProgress={props.initialLabProgress}
        initialSubmissions={props.initialSubmissions}
        initialWorkspaces={props.initialWorkspaces}
        currentSlideIndex={props.deckState?.slideIndex ?? null}
        currentSlideTitle={props.deckState?.title ?? null}
        facilitatorPrompt={props.facilitatorPrompt}
      />

      <ParticipantWorkbench
        inviteCode={props.inviteCode}
        moduleSlug={props.moduleSlug}
        moduleTitle={props.moduleTitle}
        workbenchEyebrow="Viz studio"
        workbenchTitle="Compose, defend, and ship the chart"
        workbenchSubtitle="Edit a Vega-Lite spec on the left and watch the chart render on the right. Run the rubric before submitting."
        labCheckpoints={props.labCheckpoints}
        initialLabProgress={props.initialLabProgress}
        initialSubmissions={props.initialSubmissions}
        deckState={props.deckState}
        facilitatorPrompt={props.facilitatorPrompt}
        renderTaskWorkArea={({ checkpoint, task }) => (
          <VizStudioWorkArea
            inviteCode={props.inviteCode}
            moduleSlug={props.moduleSlug}
            checkpoint={checkpoint}
            task={task}
          />
        )}
      />
    </div>
  );
}

type VegaEmbed = (
  el: HTMLElement,
  spec: object,
  opt?: { actions?: boolean; renderer?: string },
) => Promise<unknown>;

declare global {
  interface Window {
    vegaEmbed?: VegaEmbed;
  }
}

function useVegaEmbed() {
  const [vegaEmbed, setVegaEmbed] = useState<VegaEmbed | null>(() =>
    typeof window !== "undefined" ? window.vegaEmbed ?? null : null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.vegaEmbed) {
      setVegaEmbed(() => window.vegaEmbed!);
      return;
    }
    const scripts = [
      { src: "https://cdn.jsdelivr.net/npm/vega@5", id: "viz-studio-vega" },
      { src: "https://cdn.jsdelivr.net/npm/vega-lite@5", id: "viz-studio-vega-lite" },
      { src: "https://cdn.jsdelivr.net/npm/vega-embed@6", id: "viz-studio-vega-embed" },
    ];
    let cancelled = false;
    const loadSequential = async () => {
      try {
        for (const entry of scripts) {
          if (document.getElementById(entry.id)) continue;
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.id = entry.id;
            script.src = entry.src;
            script.async = false;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Unable to load ${entry.src}`));
            document.head.appendChild(script);
          });
        }
        if (!cancelled && window.vegaEmbed) {
          setVegaEmbed(() => window.vegaEmbed!);
        }
      } catch (caught) {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Unable to load Vega-Lite preview.");
        }
      }
    };
    void loadSequential();
    return () => {
      cancelled = true;
    };
  }, []);

  return { vegaEmbed, loadError };
}

function VizStudioWorkArea({
  inviteCode,
  moduleSlug,
  checkpoint,
  task,
}: {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint;
  task: WorkbenchActiveTask | null;
}) {
  const storageKey = useMemo(
    () => `viz-studio:${moduleSlug}:${checkpoint.slug}:${task?.id ?? "default"}`,
    [moduleSlug, checkpoint.slug, task?.id],
  );

  const [specText, setSpecText] = useState<string>(() => JSON.stringify(STARTER_VEGA_LITE_SPEC, null, 2));
  const [audience, setAudience] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [defence, setDefence] = useState("");
  const [rubricChecks, setRubricChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(RUBRIC_ITEMS.map((item) => [item, false])),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { vegaEmbed, loadError } = useVegaEmbed();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        specText?: string;
        audience?: string;
        takeaway?: string;
        defence?: string;
        rubricChecks?: Record<string, boolean>;
      };
      if (parsed.specText) setSpecText(parsed.specText);
      if (parsed.audience) setAudience(parsed.audience);
      if (parsed.takeaway) setTakeaway(parsed.takeaway);
      if (parsed.defence) setDefence(parsed.defence);
      if (parsed.rubricChecks) {
        setRubricChecks((current) => ({ ...current, ...parsed.rubricChecks }));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ specText, audience, takeaway, defence, rubricChecks }),
      );
    } catch {
      // ignore
    }
  }, [storageKey, specText, audience, takeaway, defence, rubricChecks]);

  useEffect(() => {
    if (!vegaEmbed || !previewRef.current) return;
    let parsedSpec: unknown;
    try {
      parsedSpec = JSON.parse(specText);
      setParseError(null);
    } catch (caught) {
      setParseError(caught instanceof Error ? caught.message : "Invalid JSON.");
      return;
    }
    if (!parsedSpec || typeof parsedSpec !== "object") return;
    let cancelled = false;
    const target = previewRef.current;
    target.innerHTML = "";
    void vegaEmbed(target, parsedSpec as object, { actions: false, renderer: "canvas" }).catch((caught: unknown) => {
      if (cancelled) return;
      setParseError(caught instanceof Error ? caught.message : "Vega render failed.");
    });
    return () => {
      cancelled = true;
    };
  }, [specText, vegaEmbed]);

  const rubricCompleted = Object.values(rubricChecks).filter(Boolean).length;

  const submit = async () => {
    setSubmitStatus("saving");
    setSubmitError(null);
    let parsedSpec: unknown = null;
    try {
      parsedSpec = JSON.parse(specText);
    } catch (caught) {
      setSubmitStatus("error");
      setSubmitError(caught instanceof Error ? caught.message : "Spec is not valid JSON.");
      return;
    }
    try {
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary: `Chart: ${takeaway.slice(0, 80) || "(no takeaway yet)"}`,
          scope: task ? "task" : "checkpoint",
          scopeId: task ? task.id : checkpoint.slug,
          kind: "chart_spec",
          metadata: {
            checkpointSlug: checkpoint.slug,
            checkpointTitle: checkpoint.title,
            taskId: task?.id ?? null,
            workbench: "viz-studio",
            audience,
            takeaway,
            defence,
            rubric: rubricChecks,
            rubricScore: `${rubricCompleted}/${RUBRIC_ITEMS.length}`,
            spec: parsedSpec,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message ?? "Unable to save chart spec.");
      }
      setSubmitStatus("saved");
    } catch (caught) {
      setSubmitStatus("error");
      setSubmitError(caught instanceof Error ? caught.message : "Unable to save chart spec.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <FormCard title="Vega-Lite spec" hint="Edit the JSON. Use Vega-Lite v5 syntax.">
          <textarea
            value={specText}
            onChange={(event) => setSpecText(event.target.value)}
            spellCheck={false}
            rows={16}
            className="h-full w-full resize-y rounded-xl border border-white/10 bg-[#05080d] px-3 py-2 font-mono text-xs leading-6 text-emerald-100 focus:border-sky-400/40 focus:outline-none"
          />
          {parseError ? (
            <p className="text-[11px] text-rose-300">{parseError}</p>
          ) : (
            <p className="text-[11px] text-zinc-500">JSON parses cleanly.</p>
          )}
        </FormCard>
        <FormCard title="Live preview" hint={loadError ? loadError : vegaEmbed ? "Rendered with Vega-Lite v5" : "Loading Vega-Lite from CDN..."}>
          <div
            ref={previewRef}
            className="min-h-[260px] rounded-xl border border-white/8 bg-white p-3 text-slate-900"
          />
        </FormCard>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FormCard title="Audience and decision" hint="Who will read this chart, and what should they decide?">
          <textarea
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </FormCard>
        <FormCard title="Primary takeaway in one sentence" hint="The thing the audience reads in under three seconds.">
          <textarea
            value={takeaway}
            onChange={(event) => setTakeaway(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </FormCard>
        <FormCard title="Why this chart type beats the alternatives" hint="Defend over a table, line, or stacked bar.">
          <textarea
            value={defence}
            onChange={(event) => setDefence(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-sky-400/40 focus:outline-none"
          />
        </FormCard>
        <FormCard title="Rubric checklist" hint={`${rubricCompleted}/${RUBRIC_ITEMS.length} confirmed`}>
          <ul className="space-y-1">
            {RUBRIC_ITEMS.map((item) => (
              <li key={item}>
                <label className="flex items-start gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(rubricChecks[item])}
                    onChange={(event) =>
                      setRubricChecks((current) => ({ ...current, [item]: event.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400 focus:ring-sky-400"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </FormCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
        <div className="text-[11px] text-zinc-500">
          {submitStatus === "saving"
            ? "Saving chart spec..."
            : submitStatus === "saved"
              ? "Chart spec submitted as evidence."
              : submitStatus === "error"
                ? submitError ?? "Save failed"
                : "Saves locally as you type. Submit to send the spec to your facilitator."}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitStatus === "saving"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Submit chart spec
        </button>
      </div>
    </div>
  );
}

function FormCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/8 bg-black/20 p-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
      </header>
      {children}
    </div>
  );
}

export default VizStudioWorkbench;
