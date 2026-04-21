"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CodeEditor } from "@/components/training/code-editor";
import { FileExplorer, type WorkspaceFileRecord } from "@/components/training/file-explorer";
import { publishLabCoachContext } from "@/components/training/lab-coach-context";
import { OutputPanel, type ChartPreview, type DataFramePreview } from "@/components/training/output-panel";
import { ParticipantNotes } from "@/components/training/participant-notes";
import { SubmissionPanel } from "@/components/training/submission-panel";
import type { PythonTaskCheck } from "@/lib/python-task-checks";
import {
  isWorkbenchTask,
  resolveCheckpointInterventionPrompt,
  type TrainingLabCheckpoint,
  type TrainingLabCheckpointTask,
} from "@/lib/training-lab-checkpoints";

function pythonTasksOf(
  tasks: TrainingLabCheckpointTask[] | undefined | null,
): PythonTaskCheck[] {
  return (tasks ?? []).filter((task): task is PythonTaskCheck => !isWorkbenchTask(task));
}
import type {
  TrainingAiAssessmentRecord,
  TrainingLabWorkspaceRecord,
  TrainingParticipantLabCheckpointRecord,
  TrainingSubmissionRecord,
} from "@/types";

type NotebookWorkspacePreview = {
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

type ResourceLink = {
  label: string;
  href: string;
  kind: string;
};

export type PythonLearningWorkspaceVariant = "module" | "lab";

export type PythonLearningWorkspaceProps = {
  inviteCode: string;
  moduleSlug: string;
  deckHref: string;
  workbookHref: string;
  notebookPreviews: NotebookWorkspacePreview[];
  resources: ResourceLink[];
  labCheckpoints: TrainingLabCheckpoint[];
  initialLabProgress: TrainingParticipantLabCheckpointRecord[];
  initialSubmissions: TrainingSubmissionRecord[];
  initialWorkspaces: TrainingLabWorkspaceRecord[];
  currentSlideIndex?: number | null;
  currentSlideTitle?: string | null;
  facilitatorPrompt?: string | null;
  /**
   * `"module"` renders the full workspace with deck chips, materials, managed
   * Jupyter card, and the file browser details. `"lab"` hides these so a
   * dedicated lab route can provide its own top bar, data pane, and AI coach.
   */
  variant?: PythonLearningWorkspaceVariant;
  /**
   * When provided, the workspace focuses the matching checkpoint on mount
   * instead of inferring from the deck slide. Used by the full-viewport lab
   * route which selects the checkpoint from its URL segment.
   */
  initialCheckpointSlug?: string | null;
};

type PyodideFsStat = {
  mode: number;
  size: number;
};

type PyodideFs = {
  mkdir: (path: string) => void;
  writeFile: (path: string, data: Uint8Array) => void;
  readdir: (path: string) => string[];
  stat: (path: string) => PyodideFsStat;
  readFile: (path: string) => Uint8Array;
  isFile: (mode: number) => boolean;
};

type PyodideGlobals = {
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
};

type PyodideInstance = {
  loadPackage: (packages: string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  FS: PyodideFs;
  globals: PyodideGlobals;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

type CheckpointCompletionMode = "passed" | "guided_complete" | "retry_needed";

type LabStatusState = {
  status: "not_started" | "launched" | "completed";
  completionMode: CheckpointCompletionMode | null;
  taskSummary: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  lastEventAt: string | null;
};

type TaskRunState = "not_started" | "passed" | "retry_needed" | "guided_complete";

type TaskStatusState = {
  state: TaskRunState;
  message: string | null;
  details: string[];
  updatedAt: string | null;
};

type TaskCheckResult = {
  passed: boolean;
  message: string;
  details: string[];
};

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full";

function getDefaultTaskForCheckpoint(checkpoint: TrainingLabCheckpoint | null, taskStatusById: Record<string, TaskStatusState>) {
  const tasks = pythonTasksOf(checkpoint?.tasks);
  if (!tasks.length) return null;
  return (
    tasks.find((task) => {
      const status = taskStatusById[task.id]?.state ?? "not_started";
      return status !== "passed" && status !== "guided_complete";
    }) ?? tasks[0]
  );
}

function getTaskTone(state: TaskRunState) {
  if (state === "passed" || state === "guided_complete") {
    return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100";
  }
  if (state === "retry_needed") {
    return "border-rose-400/20 bg-rose-400/[0.08] text-rose-100";
  }
  return "border-white/10 bg-white/[0.03] text-zinc-200";
}

function getTaskLabel(state: TaskRunState, mode: PythonTaskCheck["mode"]) {
  if (state === "passed") return "Passed";
  if (state === "guided_complete") return "Discussed";
  if (state === "retry_needed") return "Retry needed";
  return mode === "guided" ? "Awaiting discussion" : "Awaiting check";
}

export function PythonLearningWorkspace({
  inviteCode,
  moduleSlug,
  deckHref,
  workbookHref,
  notebookPreviews,
  resources,
  labCheckpoints,
  initialLabProgress,
  initialSubmissions,
  initialWorkspaces,
  currentSlideIndex = null,
  currentSlideTitle = null,
  facilitatorPrompt = null,
  variant = "module",
  initialCheckpointSlug = null,
}: PythonLearningWorkspaceProps) {
  const isLabVariant = variant === "lab";
  const [activeNotebookSlug, setActiveNotebookSlug] = useState(notebookPreviews[0]?.slug ?? "");
  const [selectedCodeBlockIndex, setSelectedCodeBlockIndex] = useState(0);
  const [editorCodeByNotebook, setEditorCodeByNotebook] = useState<Record<string, string>>({});
  const [followSlideGuidance, setFollowSlideGuidance] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [labStatusBySlug, setLabStatusBySlug] = useState<Record<string, LabStatusState>>({});
  const [taskStatusById, setTaskStatusById] = useState<Record<string, TaskStatusState>>({});
  const [runtimeState, setRuntimeState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [runtimeMessage, setRuntimeMessage] = useState("Load the browser lab to start running Python inside this page.");
  const [runStdout, setRunStdout] = useState("");
  const [runStderr, setRunStderr] = useState("");
  const [lastRunFailed, setLastRunFailed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFileRecord[]>([]);
  const [dataPreview, setDataPreview] = useState<DataFramePreview | null>(null);
  const [chartPreviews, setChartPreviews] = useState<ChartPreview[]>([]);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [aiAssessmentsBySubmissionId, setAiAssessmentsBySubmissionId] = useState<
    Record<string, TrainingAiAssessmentRecord | null>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managedWorkspace, setManagedWorkspace] = useState<TrainingLabWorkspaceRecord | null>(initialWorkspaces[0] ?? null);
  const [managedWorkspaceLaunchUrl, setManagedWorkspaceLaunchUrl] = useState<string | null>(null);
  const [isManagedWorkspaceLoading, setIsManagedWorkspaceLoading] = useState(false);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const progressSentRef = useRef(false);
  const bootstrappedRef = useRef(false);

  const activeNotebook = useMemo(
    () => notebookPreviews.find((notebook) => notebook.slug === activeNotebookSlug) ?? notebookPreviews[0],
    [activeNotebookSlug, notebookPreviews],
  );
  const editorCode = activeNotebook ? editorCodeByNotebook[activeNotebook.slug] ?? activeNotebook.codeBlocks[0]?.code ?? "" : "";
  const notebookResources = useMemo(() => resources.filter((resource) => resource.kind === "notebook"), [resources]);
  const datasetResources = useMemo(() => resources.filter((resource) => resource.kind === "dataset"), [resources]);
  const supportResources = useMemo(
    () => resources.filter((resource) => resource.kind !== "dataset" && resource.kind !== "notebook"),
    [resources],
  );

  const labCheckpointCards = useMemo(
    () =>
      labCheckpoints.map((checkpoint) => ({
        ...checkpoint,
        ...(labStatusBySlug[checkpoint.slug] ?? {
          status: "not_started" as const,
          completionMode: null,
          taskSummary: null,
          launchedAt: null,
          completedAt: null,
          lastEventAt: null,
        }),
      })),
    [labCheckpoints, labStatusBySlug],
  );
  const completedCheckpointCount = useMemo(
    () => labCheckpointCards.filter((checkpoint) => checkpoint.status === "completed").length,
    [labCheckpointCards],
  );
  const currentSlideNumber = typeof currentSlideIndex === "number" ? currentSlideIndex + 1 : null;
  const activeCheckpoint = useMemo(() => {
    if (initialCheckpointSlug) {
      const pinned = labCheckpointCards.find((checkpoint) => checkpoint.slug === initialCheckpointSlug);
      if (pinned) return pinned;
    }
    if (currentSlideNumber === null) return null;
    return (
      labCheckpointCards.find(
        (checkpoint) => currentSlideNumber >= checkpoint.startSlide && currentSlideNumber <= checkpoint.endSlide,
      ) ?? null
    );
  }, [currentSlideNumber, initialCheckpointSlug, labCheckpointCards]);
  const overdueCheckpoint = useMemo(() => {
    if (currentSlideNumber === null) return null;
    return (
      labCheckpointCards.find(
        (checkpoint) => currentSlideNumber > checkpoint.endSlide && checkpoint.status !== "completed",
      ) ?? null
    );
  }, [currentSlideNumber, labCheckpointCards]);
  const slideGuidance = useMemo(() => {
    if (currentSlideNumber === null || !activeCheckpoint) return null;
    const intervention = resolveCheckpointInterventionPrompt(activeCheckpoint, currentSlideNumber);

    return {
      notebookSlug: activeCheckpoint.notebookSlug,
      blockIndex: activeCheckpoint.blockIndex,
      message: intervention?.prompt ?? activeCheckpoint.facilitatorPrompt,
    };
  }, [activeCheckpoint, currentSlideNumber]);
  const activeCheckpointTasks = pythonTasksOf(activeCheckpoint?.tasks);
  const activeTask =
    activeCheckpointTasks.find((task) => task.id === activeTaskId) ??
    getDefaultTaskForCheckpoint(activeCheckpoint, taskStatusById);
  const activeTaskStatus = activeTask
    ? taskStatusById[activeTask.id] ?? { state: "not_started", message: null, details: [], updatedAt: null }
    : null;

  useEffect(() => {
    const nextState = Object.fromEntries(
      labCheckpoints.map((checkpoint) => {
        const record = initialLabProgress.find((item) => item.labSlug === checkpoint.slug) ?? null;
        return [
          checkpoint.slug,
          {
            status: record?.status ?? "not_started",
            completionMode: record?.completionMode ?? null,
            taskSummary: record?.taskSummary ?? null,
            launchedAt: record?.launchedAt ?? null,
            completedAt: record?.completedAt ?? null,
            lastEventAt: record?.lastEventAt ?? null,
          } satisfies LabStatusState,
        ];
      }),
    );
    setLabStatusBySlug(nextState);
  }, [initialLabProgress, labCheckpoints]);

  useEffect(() => {
    const nextTaskState = Object.fromEntries(
      labCheckpoints.flatMap((checkpoint) =>
        pythonTasksOf(checkpoint.tasks).map((task) => {
          const checkpointRecord = initialLabProgress.find((item) => item.labSlug === checkpoint.slug) ?? null;
          const state =
            checkpointRecord?.status === "completed"
              ? task.mode === "guided"
                ? "guided_complete"
                : "passed"
              : "not_started";
          return [
            task.id,
            {
              state,
              message: null,
              details: [],
              updatedAt: checkpointRecord?.lastEventAt ?? null,
            } satisfies TaskStatusState,
          ];
        }),
      ),
    );
    setTaskStatusById(nextTaskState);
  }, [initialLabProgress, labCheckpoints]);

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  useEffect(() => {
    setManagedWorkspace(initialWorkspaces[0] ?? null);
  }, [initialWorkspaces]);

  useEffect(() => {
    if (!initialWorkspaces.length) return;
    void refreshManagedWorkspace();
  }, [initialWorkspaces.length]);

  useEffect(() => {
    if (!activeNotebook) return;
    setSelectedCodeBlockIndex(0);
    setEditorCodeByNotebook((current) => {
      if (current[activeNotebook.slug]) return current;
      return {
        ...current,
        [activeNotebook.slug]: activeNotebook.codeBlocks[0]?.code ?? "",
      };
    });
  }, [activeNotebook]);

  useEffect(() => {
    if (!followSlideGuidance || !slideGuidance) return;
    const guidedNotebook = notebookPreviews.find((notebook) => notebook.slug === slideGuidance.notebookSlug);
    if (!guidedNotebook) return;
    const nextBlock = guidedNotebook.codeBlocks[slideGuidance.blockIndex] ?? guidedNotebook.codeBlocks[0];
    if (!nextBlock) return;
    setActiveNotebookSlug(guidedNotebook.slug);
    setSelectedCodeBlockIndex(slideGuidance.blockIndex);
    setEditorCodeByNotebook((current) => ({
      ...current,
      [guidedNotebook.slug]: nextBlock.code,
    }));
  }, [followSlideGuidance, notebookPreviews, slideGuidance]);

  useEffect(() => {
    if (!activeCheckpoint) {
      setActiveTaskId(null);
      return;
    }
    const fallbackTask = getDefaultTaskForCheckpoint(activeCheckpoint, taskStatusById);
    setActiveTaskId((current) => {
      if (current && pythonTasksOf(activeCheckpoint.tasks).some((task) => task.id === current)) {
        return current;
      }
      return fallbackTask?.id ?? null;
    });
  }, [activeCheckpoint, taskStatusById]);

  useEffect(() => {
    if (!isLabVariant) return;
    publishLabCoachContext({
      taskId: activeTask?.id ?? null,
      taskTitle: activeTask?.title ?? null,
      taskSuccessCriteria: activeTask?.successCriteria ?? null,
      code: editorCode || null,
      stdout: runStdout || null,
      stderr: runStderr || null,
    });
  }, [activeTask?.id, activeTask?.title, activeTask?.successCriteria, editorCode, isLabVariant, runStderr, runStdout]);

  const initialCheckpointAppliedRef = useRef(false);
  useEffect(() => {
    if (initialCheckpointAppliedRef.current) return;
    if (!initialCheckpointSlug) return;
    const checkpoint = labCheckpoints.find((item) => item.slug === initialCheckpointSlug);
    if (!checkpoint) return;
    const notebook = notebookPreviews.find((item) => item.slug === checkpoint.notebookSlug);
    if (!notebook) return;
    const block = notebook.codeBlocks[checkpoint.blockIndex] ?? notebook.codeBlocks[0];
    if (!block) return;
    initialCheckpointAppliedRef.current = true;
    const tasks = pythonTasksOf(checkpoint.tasks);
    const fallbackTask = tasks.find((task) => {
      const status = taskStatusById[task.id]?.state ?? "not_started";
      return status !== "passed" && status !== "guided_complete";
    }) ?? tasks[0] ?? null;
    setFollowSlideGuidance(false);
    setActiveNotebookSlug(notebook.slug);
    setSelectedCodeBlockIndex(checkpoint.blockIndex);
    setActiveTaskId(fallbackTask?.id ?? null);
    setEditorCodeByNotebook((current) => ({
      ...current,
      [notebook.slug]: block.code,
    }));
  }, [initialCheckpointSlug, labCheckpoints, notebookPreviews, taskStatusById]);

  useEffect(() => {
    if (progressSentRef.current) return;
    progressSentRef.current = true;
    void fetch("/api/training/participant/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode,
        moduleSlug,
        eventType: "lab_launched",
        progressPercent: 5,
        metadata: {
          source: "training-browser-lab",
        },
      }),
    }).catch(() => undefined);
  }, [inviteCode, moduleSlug]);

  function focusNotebook(notebookSlug: string, blockIndex: number, preferredTaskId?: string | null) {
    const notebook = notebookPreviews.find((item) => item.slug === notebookSlug);
    if (!notebook) return;
    const block = notebook.codeBlocks[blockIndex] ?? notebook.codeBlocks[0];
    if (!block) return;
    setActiveNotebookSlug(notebook.slug);
    setSelectedCodeBlockIndex(blockIndex);
    setActiveTaskId(preferredTaskId ?? null);
    setLastRunFailed(false);
    setEditorCodeByNotebook((current) => ({
      ...current,
      [notebook.slug]: block.code,
    }));
  }

  function focusCheckpoint(checkpoint: TrainingLabCheckpoint) {
    const task = getDefaultTaskForCheckpoint(checkpoint, taskStatusById);
    if (task) {
      focusTask(task);
      return;
    }
    focusNotebook(checkpoint.notebookSlug, checkpoint.blockIndex, null);
  }

  function focusTask(task: PythonTaskCheck) {
    setFollowSlideGuidance(false);
    focusNotebook(task.notebookSlug, task.blockIndex, task.id);
  }

  function replaceEditorWithBlock(index: number) {
    if (!activeNotebook) return;
    const block = activeNotebook.codeBlocks[index];
    if (!block) return;
    setSelectedCodeBlockIndex(index);
    setLastRunFailed(false);
    setEditorCodeByNotebook((current) => ({
      ...current,
      [activeNotebook.slug]: block.code,
    }));
  }

  async function refreshManagedWorkspace() {
    try {
      setIsManagedWorkspaceLoading(true);
      const response = await fetch(
        `/api/training/participant/workspace?inviteCode=${encodeURIComponent(inviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to refresh the managed workspace.");
      }

      const payload = (await response.json()) as {
        data: { workspace: TrainingLabWorkspaceRecord; launchUrl?: string | null } | null;
      };
      setManagedWorkspace(payload.data?.workspace ?? null);
      setManagedWorkspaceLaunchUrl(payload.data?.launchUrl ?? null);
    } catch (error) {
      setRuntimeMessage(error instanceof Error ? error.message : "Unable to refresh the managed workspace.");
    } finally {
      setIsManagedWorkspaceLoading(false);
    }
  }

  async function provisionManagedWorkspace() {
    try {
      setIsManagedWorkspaceLoading(true);
      const response = await fetch("/api/training/participant/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? "Unable to provision the managed workspace.");
      }

      const payload = (await response.json()) as {
        data: { workspace: TrainingLabWorkspaceRecord; launchUrl?: string | null };
      };
      setManagedWorkspace(payload.data.workspace);
      setManagedWorkspaceLaunchUrl(payload.data.launchUrl ?? null);
      setRuntimeMessage(
        payload.data.launchUrl
          ? "Managed Jupyter lab is ready. You can open it in a new tab."
          : "Managed Jupyter lab provisioning has started. Refresh in a moment to check readiness.",
      );

      if (payload.data.launchUrl && typeof window !== "undefined") {
        window.open(payload.data.launchUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setRuntimeMessage(error instanceof Error ? error.message : "Unable to provision the managed workspace.");
    } finally {
      setIsManagedWorkspaceLoading(false);
    }
  }

  async function ensurePyodideScript() {
    if (typeof window === "undefined") return;
    if (window.loadPyodide) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide script.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = `${PYODIDE_INDEX_URL}/pyodide.js`;
      script.async = true;
      script.dataset.pyodide = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Pyodide script."));
      document.head.appendChild(script);
    });
  }

  function ensureDir(pyodide: PyodideInstance, path: string) {
    const segments = path.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current += `/${segment}`;
      try {
        pyodide.FS.mkdir(current);
      } catch {
        // Directory already exists in the virtual file system.
      }
    }
  }

  async function prepareVirtualWorkspace(pyodide: PyodideInstance) {
    ensureDir(pyodide, "/workspace");
    ensureDir(pyodide, "/workspace/notebooks");
    ensureDir(pyodide, "/workspace/data");
    ensureDir(pyodide, "/workspace/data/uploads");
    for (const notebook of notebookPreviews) {
      const outputDir = notebook.outputFolder.replace(/^\/+/, "").replace(/^workspace\//, "");
      ensureDir(pyodide, `/workspace/${outputDir}`);
    }

    await Promise.all(
      datasetResources.map(async (resource) => {
        const response = await fetch(resource.href, { cache: "force-cache" });
        const bytes = new Uint8Array(await response.arrayBuffer());
        const filename = resource.href.split("/").pop();
        if (!filename) return;
        pyodide.FS.writeFile(`/workspace/data/${filename}`, bytes);
      }),
    );

    await pyodide.runPythonAsync(`
import os
os.chdir("/workspace/notebooks")
`);
  }

  function listWorkspaceFiles(pyodide: PyodideInstance) {
    const directoryConfigs = [
      { directory: "/workspace/data", scope: "dataset" as const, prefix: "/workspace/data/" },
      { directory: "/workspace/data/uploads", scope: "upload" as const, prefix: "/workspace/data/uploads/" },
      ...notebookPreviews.map((notebook) => ({
        directory: `/workspace/${notebook.outputFolder.replace(/^\/+/, "").replace(/^workspace\//, "")}`,
        scope: "output" as const,
        prefix: "/workspace/outputs/",
      })),
    ];
    const files: WorkspaceFileRecord[] = [];

    for (const { directory, scope, prefix } of directoryConfigs) {
      let entries: string[] = [];
      try {
        entries = pyodide.FS.readdir(directory);
      } catch {
        entries = [];
      }

      for (const entry of entries) {
        if (entry === "." || entry === "..") continue;
        const fullPath = `${directory}/${entry}`;
        const stat = pyodide.FS.stat(fullPath);
        if (pyodide.FS.isFile(stat.mode)) {
          files.push({
            path: fullPath,
            name: fullPath.replace(prefix, ""),
            size: stat.size,
            scope,
          });
        }
      }
    }

    files.sort((left, right) => left.name.localeCompare(right.name));
    setWorkspaceFiles(files);
  }

  async function initializeRuntime() {
    if (pyodideRef.current && bootstrappedRef.current) {
      setRuntimeState("ready");
      setRuntimeMessage("Browser lab is ready. Load a task and run it here.");
      return;
    }

    try {
      setRuntimeState("loading");
      setRuntimeMessage("Loading the browser Python runtime and training datasets. This first load can take a moment.");
      await ensurePyodideScript();
      const pyodide =
        pyodideRef.current ??
        (await window.loadPyodide?.({
          indexURL: PYODIDE_INDEX_URL,
        }));

      if (!pyodide) {
        throw new Error("Pyodide did not initialise.");
      }

      pyodideRef.current = pyodide;
      await pyodide.loadPackage(["numpy", "pandas", "matplotlib"]);
      await prepareVirtualWorkspace(pyodide);
      bootstrappedRef.current = true;
      listWorkspaceFiles(pyodide);
      setRuntimeState("ready");
      setRuntimeMessage("Browser lab is ready. The datasets are mounted and the notebook workspace is live.");
    } catch (error) {
      setRuntimeState("error");
      setRuntimeMessage(error instanceof Error ? error.message : "The browser lab failed to start.");
    }
  }

  async function runTaskValidation(pyodide: PyodideInstance, task: PythonTaskCheck): Promise<TaskCheckResult | null> {
    if (task.mode !== "auto" || !task.validationPython) return null;
    pyodide.globals.set("__cursor_task_validation_code", task.validationPython);
    await pyodide.runPythonAsync(`
import json

__cursor_task_passed = False
__cursor_task_message = "The check did not run."
__cursor_task_details = []
exec(__cursor_task_validation_code, globals())
__cursor_task_result = json.dumps({
    "passed": bool(__cursor_task_passed),
    "message": str(__cursor_task_message),
    "details": [str(item) for item in (__cursor_task_details or [])],
})
`);
    const rawResult = String(pyodide.globals.get("__cursor_task_result") ?? "{}");
    return JSON.parse(rawResult) as TaskCheckResult;
  }

  async function captureRunArtifacts(pyodide: PyodideInstance) {
    await pyodide.runPythonAsync(`
import base64
import io
import json

__cursor_artifacts = json.dumps({
    "charts": [],
    "dataframePreview": None,
})

try:
    import pandas as pd
except Exception:
    pd = None

dataframe_preview = None
if pd is not None:
    for name, value in globals().items():
        if isinstance(value, pd.DataFrame):
            preview = value.head(8).copy()
            preview = preview.where(pd.notnull(preview), None)
            dataframe_preview = {
                "name": str(name),
                "rowCount": int(value.shape[0]),
                "columnCount": int(value.shape[1]),
                "columns": [str(column) for column in value.columns.tolist()],
                "rows": preview.to_dict(orient="records"),
            }
            break

charts = []
try:
    import matplotlib.pyplot as plt

    for figure_number in plt.get_fignums():
        figure = plt.figure(figure_number)
        buffer = io.BytesIO()
        figure.savefig(buffer, format="png", bbox_inches="tight")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        charts.append({
            "id": f"figure-{figure_number}",
            "dataUrl": f"data:image/png;base64,{encoded}",
        })
    plt.close("all")
except Exception:
    charts = []

__cursor_artifacts = json.dumps({
    "charts": charts,
    "dataframePreview": dataframe_preview,
})
`);

    const rawArtifacts = String(pyodide.globals.get("__cursor_artifacts") ?? "{}");
    const parsed = JSON.parse(rawArtifacts) as {
      charts?: ChartPreview[];
      dataframePreview?: DataFramePreview | null;
    };
    return {
      charts: parsed.charts ?? [],
      dataframePreview: parsed.dataframePreview ?? null,
    };
  }

  function buildTaskSummary(checkpoint: TrainingLabCheckpoint) {
    const tasks = pythonTasksOf(checkpoint.tasks);
    const autoTasks = tasks.filter((task) => task.mode === "auto");
    const guidedTasks = tasks.filter((task) => task.mode === "guided");
    const passedAuto = autoTasks.filter((task) => taskStatusById[task.id]?.state === "passed").length;
    const completedGuided = guidedTasks.filter((task) => taskStatusById[task.id]?.state === "guided_complete").length;
    return `${passedAuto}/${autoTasks.length} auto passed, ${completedGuided}/${guidedTasks.length} guided discussed`;
  }

  function canCompleteCheckpoint(checkpoint: TrainingLabCheckpoint) {
    const tasks = pythonTasksOf(checkpoint.tasks);
    const autoReady = tasks
      .filter((task) => task.mode === "auto")
      .every((task) => taskStatusById[task.id]?.state === "passed");
    const guidedReady = tasks
      .filter((task) => task.mode === "guided")
      .every((task) => taskStatusById[task.id]?.state === "guided_complete");
    return autoReady && guidedReady;
  }

  async function sendLabCheckpointEvent(
    checkpoint: TrainingLabCheckpoint,
    eventType: "lab_launched" | "lab_completed",
    metadata: Record<string, unknown> = {},
  ) {
    const response = await fetch("/api/training/participant/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode,
        moduleSlug,
        eventType,
        metadata: {
          labSlug: checkpoint.slug,
          labTitle: checkpoint.title,
          notebookSlug: checkpoint.notebookSlug,
          blockIndex: checkpoint.blockIndex,
          ...metadata,
        },
      }),
    }).catch(() => null);

    if (!response?.ok) return;

    const now = new Date().toISOString();
    const completionMode =
      metadata.completionMode === "passed" ||
      metadata.completionMode === "guided_complete" ||
      metadata.completionMode === "retry_needed"
        ? (metadata.completionMode as CheckpointCompletionMode)
        : null;
    const taskSummary = typeof metadata.taskSummary === "string" ? metadata.taskSummary : null;

    setLabStatusBySlug((current) => ({
      ...current,
      [checkpoint.slug]: {
        status: eventType === "lab_completed" ? "completed" : "launched",
        completionMode,
        taskSummary,
        launchedAt: eventType === "lab_launched" ? now : current[checkpoint.slug]?.launchedAt ?? now,
        completedAt: eventType === "lab_completed" ? now : current[checkpoint.slug]?.completedAt ?? null,
        lastEventAt: now,
      },
    }));

    if (eventType === "lab_launched") {
      setRuntimeMessage(
        `Checkpoint started: ${checkpoint.title}. Work through the tasks in order before you record completion.`,
      );
    } else {
      setRuntimeMessage(
        `Checkpoint completed: ${checkpoint.title}. Your facilitator can now see the updated status.`,
      );
    }
  }

  async function startCheckpointIfNeeded(checkpoint: TrainingLabCheckpoint) {
    const currentStatus = labStatusBySlug[checkpoint.slug]?.status ?? "not_started";
    if (currentStatus !== "not_started") return;
    await sendLabCheckpointEvent(checkpoint, "lab_launched", {
      completionMode: null,
      taskSummary: buildTaskSummary(checkpoint),
    });
  }

  async function runCurrentCode() {
    const pyodide = pyodideRef.current;
    if (!pyodide || !activeNotebook) return;

    try {
      setIsRunning(true);
      setLastRunFailed(false);
      setRunStdout("");
      setRunStderr("");
      setDataPreview(null);
      setChartPreviews([]);

      if (activeCheckpoint) {
        await startCheckpointIfNeeded(activeCheckpoint);
      }

      pyodide.globals.set("__user_code", editorCode);
      await pyodide.runPythonAsync(`
import io
import sys
import traceback

_cursor_stdout = io.StringIO()
_cursor_stderr = io.StringIO()
_cursor_old_stdout = sys.stdout
_cursor_old_stderr = sys.stderr
sys.stdout = _cursor_stdout
sys.stderr = _cursor_stderr

try:
    exec(__user_code, globals())
    __cursor_stdout_output = _cursor_stdout.getvalue()
    __cursor_stderr_output = _cursor_stderr.getvalue()
except Exception:
    __cursor_stdout_output = _cursor_stdout.getvalue()
    __cursor_stderr_output = _cursor_stderr.getvalue() + traceback.format_exc()
finally:
    sys.stdout = _cursor_old_stdout
    sys.stderr = _cursor_old_stderr
`);

      const stdout = String(pyodide.globals.get("__cursor_stdout_output") ?? "").trim();
      const stderr = String(pyodide.globals.get("__cursor_stderr_output") ?? "").trim();
      const runFailed = stderr.includes("Traceback (most recent call last)");
      setRunStdout(stdout);
      setRunStderr(stderr);
      setLastRunFailed(runFailed);
      const artifacts = await captureRunArtifacts(pyodide);
      setDataPreview(artifacts.dataframePreview);
      setChartPreviews(artifacts.charts);
      listWorkspaceFiles(pyodide);

      if (runFailed) {
        if (activeCheckpoint) {
          await sendLabCheckpointEvent(activeCheckpoint, "lab_launched", {
            completionMode: "retry_needed",
            taskSummary: buildTaskSummary(activeCheckpoint),
          });
        }
        if (activeTask) {
          setTaskStatusById((current) => ({
            ...current,
            [activeTask.id]: {
              state: activeTask.mode === "guided" ? current[activeTask.id]?.state ?? "not_started" : "retry_needed",
              message: "The notebook run failed. Fix the traceback and rerun this task.",
              details: [],
              updatedAt: new Date().toISOString(),
            },
          }));
        }
        setRuntimeMessage("The last run did not complete cleanly. Fix the traceback and rerun the task.");
        return;
      }

      if (activeTask?.mode === "auto") {
        const validationResult = await runTaskValidation(pyodide, activeTask);
        if (validationResult) {
          const nextState: TaskRunState = validationResult.passed ? "passed" : "retry_needed";
          setTaskStatusById((current) => ({
            ...current,
            [activeTask.id]: {
              state: nextState,
              message: validationResult.message,
              details: validationResult.details,
              updatedAt: new Date().toISOString(),
            },
          }));

          if (!validationResult.passed && activeCheckpoint) {
            await sendLabCheckpointEvent(activeCheckpoint, "lab_launched", {
              completionMode: "retry_needed",
              taskSummary: buildTaskSummary(activeCheckpoint),
            });
          }

          setRuntimeMessage(validationResult.message);
        } else {
          setRuntimeMessage("Run completed cleanly. Review the output and continue.");
        }
        return;
      }

      setRuntimeMessage(
        activeTask?.mode === "guided"
          ? "Run completed cleanly. Review the output, then record the guided discussion when you are ready."
          : "Run completed cleanly. Review the output and continue.",
      );
    } catch (error) {
      setLastRunFailed(true);
      if (activeCheckpoint) {
        await sendLabCheckpointEvent(activeCheckpoint, "lab_launched", {
          completionMode: "retry_needed",
          taskSummary: buildTaskSummary(activeCheckpoint),
        });
      }
      if (activeTask?.mode === "auto") {
        setTaskStatusById((current) => ({
          ...current,
          [activeTask.id]: {
            state: "retry_needed",
            message: "The notebook run failed before the task could be checked.",
            details: [],
            updatedAt: new Date().toISOString(),
          },
        }));
      }
      setRuntimeMessage("The last run failed before completion. Fix the issue and rerun.");
      setRunStdout("");
      setRunStderr(error instanceof Error ? error.message : "Code execution failed.");
    } finally {
      setIsRunning(false);
    }
  }

  async function recordCheckpointCompletion(checkpoint: TrainingLabCheckpoint) {
    const hasGuidedTask = pythonTasksOf(checkpoint.tasks).some((task) => task.mode === "guided");
    await sendLabCheckpointEvent(checkpoint, "lab_completed", {
      completionMode: hasGuidedTask ? "guided_complete" : "passed",
      taskSummary: buildTaskSummary(checkpoint),
    });
  }

  function markGuidedTaskComplete(task: PythonTaskCheck) {
    setTaskStatusById((current) => ({
      ...current,
      [task.id]: {
        state: "guided_complete",
        message: "Guided discussion recorded for this task.",
        details: [],
        updatedAt: new Date().toISOString(),
      },
    }));
    setRuntimeMessage(`Guided task recorded: ${task.title}.`);
  }

  async function uploadWorkspaceFiles(fileList: FileList) {
    await initializeRuntime();
    const pyodide = pyodideRef.current;
    if (!pyodide) return;

    ensureDir(pyodide, "/workspace/data/uploads");
    await Promise.all(
      Array.from(fileList).map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        pyodide.FS.writeFile(`/workspace/data/uploads/${file.name}`, bytes);
      }),
    );
    listWorkspaceFiles(pyodide);
    setRuntimeMessage(`${fileList.length} file${fileList.length === 1 ? "" : "s"} uploaded into /workspace/data/uploads.`);
  }

  async function submitCurrentSnapshot() {
    if (!activeNotebook) return;

    try {
      setIsSubmitting(true);
      const outputFiles = workspaceFiles.filter((file) => file.scope === "output");
      const response = await fetch("/api/training/participant/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          summary: `Snapshot from ${activeNotebook.title}`,
          scope: activeTask ? "task" : activeCheckpoint ? "checkpoint" : "module",
          scopeId: activeTask?.id ?? activeCheckpoint?.slug ?? null,
          kind: "notebook_snapshot",
          metadata: {
            notebookSlug: activeNotebook.slug,
            notebookTitle: activeNotebook.title,
            checkpointSlug: activeCheckpoint?.slug ?? null,
            taskId: activeTask?.id ?? null,
            taskTitle: activeTask?.title ?? null,
            code: editorCode,
            stdout: runStdout,
            stderr: runStderr,
            outputFileNames: outputFiles.map((file) => file.name),
            chartCount: chartPreviews.length,
            dataPreviewName: dataPreview?.name ?? null,
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? "Submission failed.");
      }

      const payload = (await response.json()) as {
        data?: TrainingSubmissionRecord;
        assessment?: TrainingAiAssessmentRecord | null;
      };
      if (payload.data) {
        const submissionRecord = payload.data;
        setSubmissions((current) => [submissionRecord, ...current]);
        if (payload.assessment) {
          const assessmentRecord = payload.assessment;
          setAiAssessmentsBySubmissionId((current) => ({
            ...current,
            [submissionRecord.id]: assessmentRecord,
          }));
        }
      }
      const assessmentMessage =
        payload.assessment && payload.assessment.status === "completed"
          ? ` AI assessor: ${payload.assessment.scoreBand.replace(/_/g, " ")}.`
          : "";
      setRuntimeMessage(
        `Snapshot submitted. Your latest code, output, and generated files are now saved for review.${assessmentMessage}`,
      );
    } catch (error) {
      setRuntimeMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadVirtualFile(file: WorkspaceFileRecord) {
    const pyodide = pyodideRef.current;
    if (!pyodide) return;
    const bytes = pyodide.FS.readFile(file.path);
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "csv"
        ? "text/csv;charset=utf-8"
        : extension === "png"
          ? "image/png"
          : "application/octet-stream";
    const blob = new Blob([arrayBuffer], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name.split("/").pop() ?? "output";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const runtimeBadgeClass =
    runtimeState === "ready"
      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100"
      : runtimeState === "loading"
        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-100"
        : runtimeState === "error"
          ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-100"
          : "border-white/10 text-zinc-400";
  const managedWorkspaceBadgeClass =
    managedWorkspace?.status === "active"
      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100"
      : managedWorkspace?.status === "provisioning"
        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-100"
        : managedWorkspace?.status === "error"
          ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-100"
          : "border-white/10 text-zinc-400";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.65fr)]">
      <div className="space-y-4">
        {/* compact status bar (module variant only; lab variant surfaces signals inside the workspace card) */}
        {isLabVariant ? null : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {currentSlideNumber ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  Slide {currentSlideNumber}{currentSlideTitle ? ` · ${currentSlideTitle}` : ""}
                </span>
              ) : (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">Deck not synced</span>
              )}
              <span className={`rounded-full border px-3 py-1 text-xs ${runtimeBadgeClass}`}>
                {runtimeState === "ready" ? "Lab ready" : runtimeState === "loading" ? "Loading lab" : runtimeState === "error" ? "Lab error" : "Lab not loaded"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                {completedCheckpointCount}/{labCheckpointCards.length} checkpoints
              </span>
              {overdueCheckpoint ? (
                <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.08] px-3 py-1 text-xs text-rose-200">
                  Overdue: {overdueCheckpoint.title}
                </span>
              ) : null}
              {lastRunFailed ? (
                <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.08] px-3 py-1 text-xs text-rose-200">
                  Last run failed
                </span>
              ) : null}
              {facilitatorPrompt ? (
                <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-xs text-amber-200">
                  {facilitatorPrompt}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <a href={deckHref} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]">Deck</a>
              <a href={workbookHref} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]">Workbook</a>
            </div>
          </div>
        )}
        {isLabVariant && runtimeState === "idle" ? null : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
            {runtimeMessage}
          </div>
        )}
        {isLabVariant ? null : (
        <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Managed Jupyter lab</p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {managedWorkspace ? "Remote notebook workspace" : "Provision a managed backend"}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                This launches a self-provisioned Jupyter environment with the module notebooks and datasets mounted into a tenant-scoped workspace.
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${managedWorkspaceBadgeClass}`}>
              {managedWorkspace?.status ?? "not provisioned"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void provisionManagedWorkspace()}
              disabled={isManagedWorkspaceLoading}
              className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1.5 text-xs text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isManagedWorkspaceLoading ? "Working..." : managedWorkspace ? "Resume managed lab" : "Provision managed lab"}
            </button>
            <button
              type="button"
              onClick={() => void refreshManagedWorkspace()}
              disabled={isManagedWorkspaceLoading}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh status
            </button>
            {managedWorkspaceLaunchUrl ? (
              <a
                href={managedWorkspaceLaunchUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-100 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.12]"
              >
                Open managed lab
              </a>
            ) : null}
          </div>
          {managedWorkspace?.metadata && typeof managedWorkspace.metadata.port === "number" ? (
            <p className="mt-3 text-xs text-zinc-500">
              Local dev launch. Jupyter listens on port {String(managedWorkspace.metadata.port)} and opens directly on this machine when ready.
            </p>
          ) : null}
        </div>
        )}

        {/* active task */}
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              {activeTask ? (
                <>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    {isLabVariant ? "Verify" : activeCheckpoint?.title ?? "Task"}
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold text-white">{activeTask.title}</h3>
                  <p className="mt-1.5 text-sm text-zinc-400">{activeTask.successCriteria}</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Notebook studio</p>
                  <h3 className="mt-1.5 text-xl font-semibold text-white">
                    {slideGuidance ? activeCheckpoint?.title ?? "Follow the deck" : "Open the deck to begin"}
                  </h3>
                  {slideGuidance ? <p className="mt-1.5 text-sm text-zinc-400">{slideGuidance.message}</p> : null}
                </>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {activeTask ? (
                <div className={`rounded-full border px-3 py-1 text-xs font-medium ${getTaskTone(activeTaskStatus?.state ?? "not_started")}`}>
                  {getTaskLabel(activeTaskStatus?.state ?? "not_started", activeTask.mode)}
                </div>
              ) : null}
              {isLabVariant ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] ${runtimeBadgeClass}`}>
                  {runtimeState === "ready" ? "Lab ready" : runtimeState === "loading" ? "Loading lab" : runtimeState === "error" ? "Lab error" : "Lab not loaded"}
                </span>
              ) : null}
            </div>
          </div>

          {isLabVariant && (overdueCheckpoint || lastRunFailed || facilitatorPrompt) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {overdueCheckpoint ? (
                <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.08] px-3 py-1 text-xs text-rose-200">
                  Overdue: {overdueCheckpoint.title}
                </span>
              ) : null}
              {lastRunFailed ? (
                <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.08] px-3 py-1 text-xs text-rose-200">
                  Last run failed
                </span>
              ) : null}
              {facilitatorPrompt ? (
                <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-xs text-amber-200">
                  {facilitatorPrompt}
                </span>
              ) : null}
            </div>
          ) : null}

          {activeTaskStatus?.message ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getTaskTone(activeTaskStatus.state)}`}>
              {activeTaskStatus.message}
              {activeTaskStatus.details.length > 0 ? (
                <div className="mt-2 space-y-0.5 text-xs opacity-80">
                  {activeTaskStatus.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* notebook + block switcher */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {notebookPreviews.map((notebook) => {
              const isActive = notebook.slug === activeNotebook?.slug;
              return (
                <button
                  key={notebook.slug}
                  type="button"
                  onClick={() => { setFollowSlideGuidance(false); focusNotebook(notebook.slug, 0, null); }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    isActive ? "border-sky-400/30 bg-sky-400/[0.1] text-sky-100" : "border-white/10 bg-black/10 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {notebook.title}
                </button>
              );
            })}
            {activeNotebook?.codeBlocks.map((block, index) => {
              const isActive = selectedCodeBlockIndex === index;
              return (
                <button
                  key={`${activeNotebook.slug}-${index}`}
                  type="button"
                  onClick={() => replaceEditorWithBlock(index)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    isActive ? "border-white/20 bg-white/[0.07] text-white" : "border-white/10 bg-black/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {block.label}
                </button>
              );
            })}
          </div>

          {/* editor + output */}
          {activeNotebook ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
              <div className="rounded-[1.5rem] border border-white/8 bg-[#07111b]">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                  <p className="text-xs text-zinc-400">{activeNotebook.title}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void initializeRuntime()}
                      className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1.5 text-xs text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/[0.12]"
                    >
                      {runtimeState === "ready" ? "Lab ready" : runtimeState === "loading" ? "Loading..." : "Load lab"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void runCurrentCode()}
                      disabled={runtimeState !== "ready" || isRunning}
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-100 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRunning ? "Running..." : activeTask?.mode === "auto" ? "Run + check" : "Run"}
                    </button>
                  </div>
                </div>
                <CodeEditor
                  value={editorCode}
                  onChange={(nextValue) =>
                    activeNotebook
                      ? setEditorCodeByNotebook((current) => ({ ...current, [activeNotebook.slug]: nextValue }))
                      : undefined
                  }
                  className="rounded-b-[1.5rem]"
                />
              </div>

              <div className="space-y-3">
                <OutputPanel
                  expectedSignals={activeNotebook.expectedSignals}
                  stdout={runStdout}
                  stderr={runStderr}
                  dataPreview={dataPreview}
                  charts={chartPreviews}
                />
                <FileExplorer
                  files={workspaceFiles}
                  onUpload={(files) => {
                    void uploadWorkspaceFiles(files);
                  }}
                  onDownload={downloadVirtualFile}
                />
                <SubmissionPanel
                  submissions={submissions}
                  activeNotebookSlug={activeNotebook.slug}
                  canSubmit={runtimeState === "ready" && !isRunning}
                  isSubmitting={isSubmitting}
                  onSubmit={() => submitCurrentSnapshot()}
                  aiAssessments={aiAssessmentsBySubmissionId}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* right rail */}
      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        {/* guidance + follow toggle (deck-driven; hidden in lab variant where there is no deck context) */}
        {isLabVariant ? null : (
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{activeCheckpoint?.title ?? "Awaiting checkpoint"}</p>
              <button
                type="button"
                onClick={() => setFollowSlideGuidance((current) => !current)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                  followSlideGuidance ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {followSlideGuidance ? "Following" : "Paused"}
              </button>
            </div>
            {slideGuidance ? (
              <p className="mt-2 text-xs leading-5 text-zinc-500">{slideGuidance.message}</p>
            ) : null}
          </div>
        )}

        {/* active checkpoint tasks */}
        {activeCheckpoint ? (
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-2 pb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {isLabVariant ? "Tasks" : activeCheckpoint.title}
              </p>
              <div className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getTaskTone(activeCheckpoint.status === "completed" ? "passed" : activeCheckpoint.completionMode === "retry_needed" ? "retry_needed" : "not_started")}`}>
                {activeCheckpoint.status === "completed"
                  ? "Done"
                  : activeCheckpoint.completionMode === "retry_needed"
                    ? "Retry"
                    : "Active"}
              </div>
            </div>

            <div className="space-y-2">
              {activeCheckpointTasks.map((task) => {
                const taskStatus = taskStatusById[task.id] ?? { state: "not_started" as TaskRunState, message: null, details: [], updatedAt: null };
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => focusTask(task)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                      activeTask?.id === task.id
                        ? "border-sky-400/20 bg-sky-400/[0.08] text-white"
                        : "border-white/10 bg-black/10 text-zinc-300 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{task.title}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${getTaskTone(taskStatus.state)}`}>
                        {getTaskLabel(taskStatus.state, task.mode)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
              {activeTask?.mode === "guided" ? (
                <button
                  type="button"
                  onClick={() => markGuidedTaskComplete(activeTask)}
                  className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-xs text-amber-100 transition hover:border-amber-400/30 hover:bg-amber-400/[0.12]"
                >
                  Mark discussed
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void startCheckpointIfNeeded(activeCheckpoint)}
                className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1.5 text-xs text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/[0.12]"
              >
                Start
              </button>
              <button
                type="button"
                disabled={!canCompleteCheckpoint(activeCheckpoint)}
                onClick={() => void recordCheckpointCompletion(activeCheckpoint)}
                className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-100 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Complete
              </button>
            </div>
          </div>
        ) : null}

        {/* notes for the active task / checkpoint */}
        {activeCheckpoint ? (
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Workbench notes</p>
            <ParticipantNotes
              inviteCode={inviteCode}
              moduleSlug={moduleSlug}
              scope={activeTask ? "task" : "checkpoint"}
              scopeId={activeTask?.id ?? activeCheckpoint.slug}
              label={activeTask ? activeTask.title : activeCheckpoint.title}
              placeholder="What did you try, what worked, what didn't? Notes are private unless you share."
              compact
            />
          </div>
        ) : null}

        {/* all checkpoints */}
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Progress</p>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              {completedCheckpointCount}/{labCheckpointCards.length}
            </span>
          </div>
          <div className="space-y-2">
            {labCheckpointCards.map((checkpoint) => {
              const dot =
                checkpoint.status === "completed"
                  ? "bg-emerald-400"
                  : checkpoint.completionMode === "retry_needed"
                    ? "bg-rose-400"
                    : checkpoint.status === "launched"
                      ? "bg-amber-400"
                      : "bg-zinc-600";
              return (
                <button
                  key={checkpoint.slug}
                  type="button"
                  onClick={() => focusCheckpoint(checkpoint)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-left text-xs transition hover:border-white/16 hover:bg-white/[0.04]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="font-medium text-white">{checkpoint.title}</span>
                  <span className="ml-auto shrink-0 text-zinc-500">{checkpoint.startSlide}–{checkpoint.endSlide}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* materials */}
        {isLabVariant ? null : (
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.2)]">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Materials</p>
          <div className="space-y-1.5">
            {[...notebookResources, ...supportResources].map((resource) => (
              <a
                key={resource.href}
                href={resource.href}
                className="block rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-zinc-300 transition hover:border-white/16 hover:bg-white/[0.04]"
              >
                {resource.label}
              </a>
            ))}
          </div>
        </div>
        )}

        {isLabVariant ? null : (
        <details className="rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4">
          <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.2em] text-zinc-500">File browser</summary>
          <div className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-zinc-300">
              {datasetResources.map((resource) => (
                <p key={resource.href}>{resource.label}</p>
              ))}
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-xs leading-6 text-zinc-300">
                <code>{`python-training/
  notebooks/
    day1_python_foundations.ipynb
    day2_numpy_pandas_core.ipynb
    day3_reporting_and_handoff.ipynb
  data/
    transactions.csv
    customers.csv
    accounts.csv
    branches.csv
    service_tickets.csv
  outputs/
    day1/
    day2/
    day3_pack/
  participant-workbook.md
  index.html`}</code>
              </pre>
            </div>
          </div>
        </details>
        )}
      </div>
    </div>
  );
}
