"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  publishLabCoachContext,
  type LabBeat,
} from "@/components/training/lab-coach-context";
import {
  isWorkbenchTask,
  type ChallengeQuestion,
  type TrainingLabCheckpoint,
  type TrainingLabCheckpointTask,
  type WorkbenchTask,
} from "@/lib/training-lab-checkpoints";
import type { PythonTaskCheck } from "@/lib/python-task-checks";
import {
  usePyodideRuntime,
  type DatasetResource,
} from "@/lib/pyodide-runtime";
import type { TrainingModuleResource } from "@/lib/training";

import {
  LabChatActiveTaskBar,
  type ActiveTaskState,
  type LabChatActiveTask,
  type LabChatNextAction,
} from "./lab-chat-active-task-bar";
import { LabChatComposer, type LabChatQuickAction } from "./lab-chat-composer";
import { LabChatThread } from "./lab-chat-thread";
import type {
  AttachedDataset,
  LabChatMessage,
} from "./lab-chat-types";

type NotebookPreview = {
  slug: string;
  title: string;
  href: string;
  outputFolder: string;
  focus: string[];
  codeBlocks: Array<{ label: string; code: string }>;
  expectedSignals: string[];
};

export type LabChatShellProps = {
  inviteCode: string;
  moduleSlug: string;
  activeCheckpoint: TrainingLabCheckpoint | null;
  notebookPreviews: NotebookPreview[];
  moduleDatasets: TrainingModuleResource[];
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Persisted lab chat snapshot. Bumped if the shape changes incompatibly so
// stale entries get ignored cleanly instead of crashing on hydrate.
type PersistedLabState = {
  version: 1;
  savedAt: string;
  messages: LabChatMessage[];
  attachedDataset: AttachedDataset | null;
  checkpointStatus: "not_started" | "launched" | "completed";
  taskState: Record<string, "passed" | "retry" | "guided_complete" | "not_started">;
  workbenchTaskState: Record<string, "not_started" | "submitted">;
  taskAttemptCount: Record<string, number>;
};

const PERSIST_VERSION = 1 as const;

function buildPersistKey(
  inviteCode: string,
  moduleSlug: string,
  checkpointSlug: string,
): string {
  return `saintclaw:lab-state:v${PERSIST_VERSION}:${inviteCode}:${moduleSlug}:${checkpointSlug}`;
}

// Tracks which (storageKey)s have already shown a "welcome back" note in
// this browser tab so switching between labs in the SPA does not spam the
// chat. A page reload starts fresh, which is exactly when we want to tell
// the participant we restored their state.
const announcedRestoreKeys = new Set<string>();

function pythonTasksOf(checkpoint: TrainingLabCheckpoint | null): PythonTaskCheck[] {
  return (checkpoint?.tasks ?? []).filter(
    (task): task is PythonTaskCheck => !isWorkbenchTask(task),
  );
}

function workbenchTasksOf(checkpoint: TrainingLabCheckpoint | null): WorkbenchTask[] {
  return (checkpoint?.tasks ?? []).filter((task): task is WorkbenchTask =>
    isWorkbenchTask(task),
  );
}

function unifiedTasksOf(
  checkpoint: TrainingLabCheckpoint | null,
): TrainingLabCheckpointTask[] {
  return checkpoint?.tasks ?? [];
}

function isFourStepLab(checkpoint: TrainingLabCheckpoint | null): boolean {
  if (!checkpoint) return false;
  return workbenchTasksOf(checkpoint).length > 0 && pythonTasksOf(checkpoint).length > 0;
}

// Maps a workbench task to the step it represents in the four-step loop.
// The convention in src/lib/training-lab-checkpoints.ts is:
//   - "<slug>-brief"      - brief step
//   - "<slug>-note-issue" - note-an-issue (still verify step)
//   - "<slug>-defend"     - defend step
function stepForWorkbenchTask(task: WorkbenchTask): LabBeat {
  if (task.id.endsWith("-brief")) return "brief";
  if (task.id.endsWith("-defend")) return "defend";
  return "verify";
}

// Deterministic challenge question pick. Same participant + lab pair always
// gets the same question across reloads so the facilitator can hold them to
// it. We do this client-side because the bank lives in code and is small.
function pickChallengeQuestion(
  questions: ChallengeQuestion[],
  seed: string,
): ChallengeQuestion | null {
  if (questions.length === 0) return null;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const positiveHash = hash >>> 0;
  return questions[positiveHash % questions.length] ?? questions[0];
}

function deriveSuccessCriteria(checkpoint: TrainingLabCheckpoint | null): string[] {
  const tasks = pythonTasksOf(checkpoint);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const task of tasks) {
    const criterion = task.successCriteria.trim();
    if (!criterion || seen.has(criterion)) continue;
    seen.add(criterion);
    out.push(criterion);
  }
  return out;
}

function friendlyCoachError(error: unknown): { friendly: string; raw: string } {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const lowered = raw.toLowerCase();
  let friendly: string;
  if (lowered.includes("429") || lowered.includes("rate-limit") || lowered.includes("rate limit")) {
    friendly =
      "Coach is rate-limited upstream right now. Try again in a few seconds, or rephrase the ask.";
  } else if (
    lowered.includes("temporarily") ||
    lowered.includes("unavailable") ||
    lowered.includes("503")
  ) {
    friendly = "Coach provider is temporarily unavailable. Try again shortly.";
  } else if (lowered.includes("timeout") || lowered.includes("timed out")) {
    friendly = "Coach took too long to reply. Try again with a shorter question.";
  } else if (lowered.includes("empty response") || lowered.includes("empty")) {
    friendly = "Coach returned an empty response. Try again or rephrase the ask.";
  } else if (
    lowered.includes("invalid copilot request") ||
    lowered.includes("strict") ||
    lowered.includes("unrecognized") ||
    lowered.includes("zod") ||
    lowered.includes("schema")
  ) {
    // Schema mismatches usually mean the lab UI is sending a field the API
    // does not yet accept. Surface a more actionable line so we notice in dev.
    friendly =
      "Coach call was rejected as invalid. Reload the lab and try again — if this keeps happening, capture the details and report it.";
  } else {
    friendly = "Coach is having trouble right now. Try again, or rephrase your question.";
  }
  return { friendly, raw };
}

function workspacePathFor(resource: TrainingModuleResource): string | null {
  const filename = resource.href.split("/").pop();
  if (!filename) return null;
  return `/workspace/data/${filename}`;
}

export function LabChatShell({
  inviteCode,
  moduleSlug,
  activeCheckpoint,
  notebookPreviews,
  moduleDatasets,
}: LabChatShellProps) {
  const datasetResources: DatasetResource[] = useMemo(
    () => moduleDatasets.map((resource) => ({ label: resource.label, href: resource.href })),
    [moduleDatasets],
  );
  const notebookOutputFolders = useMemo(
    () => notebookPreviews.map((preview) => preview.outputFolder),
    [notebookPreviews],
  );

  const runtime = usePyodideRuntime({
    datasetResources,
    notebookOutputFolders,
  });

  const [messages, setMessages] = useState<LabChatMessage[]>([]);
  const [attachedDataset, setAttachedDataset] = useState<AttachedDataset | null>(null);
  const [isCoachReplying, setIsCoachReplying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState<
    "not_started" | "launched" | "completed"
  >("not_started");
  const [taskState, setTaskState] = useState<
    Record<string, "passed" | "retry" | "guided_complete" | "not_started">
  >({});
  const [workbenchTaskState, setWorkbenchTaskState] = useState<
    Record<string, "not_started" | "submitted">
  >({});
  const [activeChallengeQuestion, setActiveChallengeQuestion] =
    useState<ChallengeQuestion | null>(null);
  const lastRunResultIdRef = useRef<string | null>(null);
  const lastStderrRef = useRef<string>("");
  const lastStdoutRef = useRef<string>("");
  const lastCodeRef = useRef<string>("");
  const lastUserMessageRef = useRef<string>("");
  const attachOpenerRef = useRef<(() => void) | null>(null);
  // Tracks how many code runs have been attempted against each task. We use
  // this so that the FIRST time a task auto-fails (typically right after the
  // previous task just passed and the user has not yet written anything for
  // this task), we surface a soft "now work on this" hint instead of a scary
  // RETRY verdict. Subsequent failed runs do escalate to RETRY.
  const taskAttemptCountRef = useRef<Record<string, number>>({});

  const tasks = useMemo(() => pythonTasksOf(activeCheckpoint), [activeCheckpoint]);
  const autoTasks = useMemo(() => tasks.filter((task) => task.mode === "auto"), [tasks]);
  const guidedTasks = useMemo(() => tasks.filter((task) => task.mode === "guided"), [tasks]);
  const workbenchTasks = useMemo(() => workbenchTasksOf(activeCheckpoint), [activeCheckpoint]);
  const unifiedTasks = useMemo(() => unifiedTasksOf(activeCheckpoint), [activeCheckpoint]);
  const fourStepLab = useMemo(() => isFourStepLab(activeCheckpoint), [activeCheckpoint]);
  const successCriteria = useMemo(() => deriveSuccessCriteria(activeCheckpoint), [activeCheckpoint]);

  // Convenience handles into the standard lab structure produced by
  // src/lib/training-lab-checkpoints.ts buildPythonLabWorkbenchTasks.
  const briefTask = useMemo(
    () => workbenchTasks.find((task) => task.id.endsWith("-brief")) ?? null,
    [workbenchTasks],
  );
  const noteIssueTask = useMemo(
    () => workbenchTasks.find((task) => task.id.endsWith("-note-issue")) ?? null,
    [workbenchTasks],
  );
  const defendTask = useMemo(
    () => workbenchTasks.find((task) => task.id.endsWith("-defend")) ?? null,
    [workbenchTasks],
  );

  const activeTaskIndex = useMemo(() => {
    if (tasks.length === 0) return -1;
    const idx = tasks.findIndex((task) => {
      const state = taskState[task.id];
      return state !== "passed" && state !== "guided_complete";
    });
    return idx === -1 ? tasks.length - 1 : idx;
  }, [tasks, taskState]);

  const activeTask = activeTaskIndex >= 0 ? tasks[activeTaskIndex] : null;

  const activeTaskBarState = useMemo<ActiveTaskState>(() => {
    if (!activeTask) return "not_started";
    const state = taskState[activeTask.id];
    if (state === "passed" || state === "guided_complete") return "passed";
    if (state === "retry") return "retry";
    if (checkpointStatus === "not_started") return "not_started";
    return "active";
  }, [activeTask, checkpointStatus, taskState]);

  const passedCount = useMemo(() => {
    return tasks.filter((task) => {
      const state = taskState[task.id];
      return state === "passed" || state === "guided_complete";
    }).length;
  }, [tasks, taskState]);

  // Unified four-step-loop view. For non-four-step checkpoints these all
  // resolve to the same values as the legacy ones above so the UI is
  // unchanged for older modules.
  const isComplete = useCallback(
    (task: TrainingLabCheckpointTask): boolean => {
      if (isWorkbenchTask(task)) {
        return workbenchTaskState[task.id] === "submitted";
      }
      const state = taskState[task.id];
      return state === "passed" || state === "guided_complete";
    },
    [taskState, workbenchTaskState],
  );

  const unifiedActiveTaskIndex = useMemo(() => {
    if (!fourStepLab) return activeTaskIndex;
    if (unifiedTasks.length === 0) return -1;
    const idx = unifiedTasks.findIndex((task) => !isComplete(task));
    return idx === -1 ? unifiedTasks.length - 1 : idx;
  }, [activeTaskIndex, fourStepLab, isComplete, unifiedTasks]);

  const unifiedActiveTask: LabChatActiveTask | null = useMemo(() => {
    if (!fourStepLab) return activeTask;
    if (unifiedActiveTaskIndex < 0) return null;
    return unifiedTasks[unifiedActiveTaskIndex] ?? null;
  }, [activeTask, fourStepLab, unifiedActiveTaskIndex, unifiedTasks]);

  const unifiedActiveTaskBarState = useMemo<ActiveTaskState>(() => {
    if (!fourStepLab) return activeTaskBarState;
    if (!unifiedActiveTask) return "not_started";
    if (isComplete(unifiedActiveTask)) return "passed";
    if (!isWorkbenchTask(unifiedActiveTask)) {
      const state = taskState[unifiedActiveTask.id];
      if (state === "retry") return "retry";
    }
    if (checkpointStatus === "not_started") return "not_started";
    return "active";
  }, [
    activeTaskBarState,
    checkpointStatus,
    fourStepLab,
    isComplete,
    taskState,
    unifiedActiveTask,
  ]);

  // Derive the current step from where the participant is in the unified
  // task list. Brief task pending = Brief step; auto-task pending with no
  // run yet = Engage step; auto-task pending with at least one attempt or
  // note-issue task pending = Verify step; defend task pending = Defend
  // step. Returns null for non-four-step labs so legacy modules see no
  // step indicator at all.
  const currentStep = useMemo<LabBeat | null>(() => {
    if (!fourStepLab || !unifiedActiveTask) return null;
    if (isWorkbenchTask(unifiedActiveTask)) {
      return stepForWorkbenchTask(unifiedActiveTask);
    }
    const attempts = taskAttemptCountRef.current[unifiedActiveTask.id] ?? 0;
    return attempts === 0 ? "engage" : "verify";
  }, [fourStepLab, unifiedActiveTask]);

  // Steps the participant has actually completed so far. Drives the
  // four-dot progress indicator in the active task bar. Brief and Defend
  // are 1:1 with their workbench tasks. Engage is "completed" once any
  // python task in this lab has passed (the participant has shown they can
  // get something to run). Verify is "completed" once both the note-issue
  // workbench task is submitted AND every python task has passed.
  const stepsCompleted = useMemo<Set<LabBeat>>(() => {
    const done = new Set<LabBeat>();
    if (!fourStepLab) return done;
    const briefSubmitted = briefTask
      ? workbenchTaskState[briefTask.id] === "submitted"
      : false;
    const noteSubmitted = noteIssueTask
      ? workbenchTaskState[noteIssueTask.id] === "submitted"
      : false;
    const defendSubmitted = defendTask
      ? workbenchTaskState[defendTask.id] === "submitted"
      : false;
    const anyPythonPassed = tasks.some((task) => {
      const state = taskState[task.id];
      return state === "passed" || state === "guided_complete";
    });
    const allPythonPassed = tasks.every((task) => {
      const state = taskState[task.id];
      return state === "passed" || state === "guided_complete";
    });
    if (briefSubmitted) done.add("brief");
    if (briefSubmitted && anyPythonPassed) done.add("engage");
    if (briefSubmitted && allPythonPassed && noteSubmitted) done.add("verify");
    if (defendSubmitted) done.add("defend");
    return done;
  }, [
    briefTask,
    defendTask,
    fourStepLab,
    noteIssueTask,
    taskState,
    tasks,
    workbenchTaskState,
  ]);

  // Pick the participant's challenge question the moment they enter Defend.
  // We seed the picker with inviteCode + checkpoint slug so reloads don't
  // shuffle the question.
  useEffect(() => {
    if (!fourStepLab || !activeCheckpoint) {
      if (activeChallengeQuestion) setActiveChallengeQuestion(null);
      return;
    }
    if (currentStep !== "defend") return;
    if (activeChallengeQuestion) return;
    const bank = activeCheckpoint.challengeQuestions ?? [];
    const picked = pickChallengeQuestion(
      bank,
      `${inviteCode}::${activeCheckpoint.slug}`,
    );
    if (picked) {
      setActiveChallengeQuestion(picked);
      setMessages((current) => [
        ...current,
        {
          id: createId("note"),
          kind: "system_note",
          tone: "info",
          text: `Defend step. Your challenge question: "${picked.prompt}" Write your answer in the chat below, then click "Submit my Defend answer" when you are ready.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [activeChallengeQuestion, activeCheckpoint, currentStep, fourStepLab, inviteCode]);

  // Push the live step + challenge question id into the coach context store
  // so the copilot system prompt can shift posture and the facilitator
  // console panel can read it.
  useEffect(() => {
    if (!fourStepLab || !activeCheckpoint) return;
    publishLabCoachContext({
      currentBeat: currentStep,
      activeChallengeQuestionId: activeChallengeQuestion?.id ?? null,
      taskId: unifiedActiveTask?.id ?? null,
      taskTitle: unifiedActiveTask?.title ?? activeCheckpoint.title,
      taskSuccessCriteria: unifiedActiveTask
        ? isWorkbenchTask(unifiedActiveTask)
          ? unifiedActiveTask.successCriteria.join(" / ")
          : unifiedActiveTask.successCriteria
        : null,
    });
  }, [
    activeChallengeQuestion,
    activeCheckpoint,
    currentStep,
    fourStepLab,
    unifiedActiveTask,
  ]);

  const unifiedPassedCount = useMemo(() => {
    if (!fourStepLab) return passedCount;
    return unifiedTasks.filter((task) => isComplete(task)).length;
  }, [fourStepLab, isComplete, passedCount, unifiedTasks]);

  const starterCodeBlock = useMemo(() => {
    if (!activeCheckpoint) return null;
    const notebook = notebookPreviews.find((preview) => preview.slug === activeCheckpoint.notebookSlug);
    if (!notebook) return null;
    const target =
      notebook.codeBlocks[activeCheckpoint.blockIndex] ?? notebook.codeBlocks[0] ?? null;
    if (!target) return null;
    // Notebook block 0 is the setup block (imports + helper functions like
    // read_csv_safe, triage_summary). When the participant clicks "Run
    // Notebook block N" for any later block, that later block typically
    // depends on the setup helpers. Pyodide runs each snippet in the same
    // global namespace, but if the setup block has never been executed (e.g.
    // first click is straight on block 2), the helpers are undefined and the
    // run fails with a NameError that has nothing to do with the lab.
    // Prepending the setup block to the runnable code keeps the snippet
    // self-sufficient so first-run UX is not a confusing traceback.
    if (activeCheckpoint.blockIndex > 0 && notebook.codeBlocks[0]) {
      const setup = notebook.codeBlocks[0].code.trim();
      const targetCode = target.code.trim();
      return {
        ...target,
        code: setup ? `${setup}\n\n${targetCode}` : targetCode,
      };
    }
    return target;
  }, [activeCheckpoint, notebookPreviews]);

  useEffect(() => {
    runtime.load().catch(() => undefined);
  }, [runtime]);

  const lastRuntimeErrorRef = useRef<string | null>(null);

  // Stable per-lab storage key. Null while no checkpoint is active so the
  // hydrate / save effects below short-circuit safely.
  const persistKey = useMemo(() => {
    if (!activeCheckpoint) return null;
    return buildPersistKey(inviteCode, moduleSlug, activeCheckpoint.slug);
  }, [activeCheckpoint, inviteCode, moduleSlug]);

  // Tracks the persistKey we have most recently hydrated for, so the save
  // effect does not race against the hydrate effect and overwrite restored
  // state with the brief blank state that exists between effects firing.
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeCheckpoint) {
      setMessages([]);
      hydratedKeyRef.current = null;
      return;
    }

    let restored: PersistedLabState | null = null;
    if (persistKey && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(persistKey);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedLabState;
          if (parsed && parsed.version === PERSIST_VERSION) {
            restored = parsed;
          }
        }
      } catch {
        // Corrupt entry. Fall through to the fresh-start branch below.
      }
    }

    if (restored) {
      setMessages(restored.messages ?? []);
      setAttachedDataset(restored.attachedDataset ?? null);
      setCheckpointStatus(restored.checkpointStatus ?? "not_started");
      setTaskState(restored.taskState ?? {});
      setWorkbenchTaskState(restored.workbenchTaskState ?? {});
      taskAttemptCountRef.current = restored.taskAttemptCount ?? {};
    } else {
      setMessages([]);
      setAttachedDataset(null);
      setCheckpointStatus("not_started");
      setTaskState({});
      setWorkbenchTaskState({});
      taskAttemptCountRef.current = {};
    }

    setActiveChallengeQuestion(null);
    lastRunResultIdRef.current = null;
    lastStderrRef.current = "";
    lastStdoutRef.current = "";
    lastCodeRef.current = "";
    lastUserMessageRef.current = "";
    hydratedKeyRef.current = persistKey;

    // If we restored meaningful state and have not yet announced this in
    // the current tab session, drop a single, unobtrusive note so the
    // participant immediately knows where they are. Pyodide is per-tab and
    // does NOT persist, so we also remind them to re-run the setup block
    // before any later block expects helpers from it.
    if (
      restored &&
      persistKey &&
      !announcedRestoreKeys.has(persistKey) &&
      ((restored.messages?.length ?? 0) > 0 ||
        Object.keys(restored.taskState ?? {}).length > 0 ||
        Object.keys(restored.workbenchTaskState ?? {}).length > 0)
    ) {
      announcedRestoreKeys.add(persistKey);
      const savedAt = restored.savedAt
        ? new Date(restored.savedAt).toLocaleString()
        : null;
      setMessages((current) => [
        ...current,
        {
          id: createId("note"),
          kind: "system_note",
          tone: "info",
          text: savedAt
            ? `Welcome back. Restored your chat and progress for this lab from ${savedAt}. Python restarts fresh in your browser, so re-run any earlier setup or notebook block before continuing.`
            : "Welcome back. Restored your chat and progress for this lab. Python restarts fresh in your browser, so re-run any earlier setup or notebook block before continuing.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    const firstTask = unifiedTasks[0] ?? null;
    const firstTaskTitle = firstTask?.title ?? activeCheckpoint.title;
    const firstTaskSuccess = firstTask
      ? isWorkbenchTask(firstTask)
        ? firstTask.successCriteria.join(" / ")
        : firstTask.successCriteria
      : null;
    publishLabCoachContext({
      taskId: firstTask?.id ?? null,
      taskTitle: firstTaskTitle,
      taskSuccessCriteria: firstTaskSuccess,
      datasetName: restored?.attachedDataset?.label ?? null,
      code: null,
      stdout: null,
      stderr: null,
      currentBeat: fourStepLab && briefTask ? "brief" : null,
      activeChallengeQuestionId: null,
    });
  }, [activeCheckpoint, briefTask, fourStepLab, persistKey, unifiedTasks]);

  // Persist whenever the participant-visible state changes for the active
  // lab. We skip the empty initial state so we do not overwrite a real
  // saved snapshot with a brief blank window between hydrate effects firing
  // (the hydratedKeyRef guard handles the in-flight case as well).
  useEffect(() => {
    if (!persistKey || typeof window === "undefined") return;
    if (hydratedKeyRef.current !== persistKey) return;
    const isEmpty =
      messages.length === 0 &&
      checkpointStatus === "not_started" &&
      Object.keys(taskState).length === 0 &&
      Object.keys(workbenchTaskState).length === 0 &&
      !attachedDataset;
    if (isEmpty) return;
    const payload: PersistedLabState = {
      version: PERSIST_VERSION,
      savedAt: new Date().toISOString(),
      messages,
      attachedDataset,
      checkpointStatus,
      taskState,
      workbenchTaskState,
      taskAttemptCount: taskAttemptCountRef.current,
    };
    try {
      window.localStorage.setItem(persistKey, JSON.stringify(payload));
    } catch {
      // localStorage may be unavailable (private mode) or full. Either
      // way persistence is best-effort and we should not interrupt the
      // session.
    }
  }, [
    persistKey,
    messages,
    attachedDataset,
    checkpointStatus,
    taskState,
    workbenchTaskState,
  ]);

  const appendMessage = useCallback((message: LabChatMessage) => {
    setMessages((current) => [...current, message]);
  }, []);

  // Surface Pyodide load failures as a single chat warning so the learner
  // sees an actionable message in the thread (alongside the top banner)
  // instead of a stuck spinner. We only post once per error transition so
  // the chat does not fill up if reload also fails.
  useEffect(() => {
    if (runtime.state !== "error") {
      lastRuntimeErrorRef.current = null;
      return;
    }
    if (lastRuntimeErrorRef.current === runtime.message) return;
    lastRuntimeErrorRef.current = runtime.message;
    appendMessage({
      id: createId("note"),
      kind: "system_note",
      tone: "warn",
      text: `Python runtime did not load (${runtime.message}). Click "Reload runtime" in the banner above, or refresh the page.`,
      createdAt: new Date().toISOString(),
    });
  }, [appendMessage, runtime.message, runtime.state]);

  const sendCheckpointEvent = useCallback(
    async (
      checkpoint: TrainingLabCheckpoint,
      eventType: "lab_launched" | "lab_completed",
      metadata: Record<string, unknown> = {},
    ) => {
      try {
        await fetch("/api/training/participant/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        });
      } catch {
        // best-effort, surfaced separately if it matters
      }
    },
    [inviteCode, moduleSlug],
  );

  const ensureCheckpointStarted = useCallback(async () => {
    if (!activeCheckpoint) return;
    if (checkpointStatus !== "not_started") return;
    setCheckpointStatus("launched");
    await sendCheckpointEvent(activeCheckpoint, "lab_launched", {
      completionMode: null,
    });
  }, [activeCheckpoint, checkpointStatus, sendCheckpointEvent]);

  const handleStartCheckpoint = useCallback(() => {
    void ensureCheckpointStarted();
  }, [ensureCheckpointStarted]);

  const handleAttachModuleDataset = useCallback(
    (resource: TrainingModuleResource) => {
      const id = `module:${resource.href}`;
      const next: AttachedDataset = {
        id,
        label: resource.label,
        source: "module",
        workspacePath: workspacePathFor(resource),
      };
      setAttachedDataset(next);
      publishLabCoachContext({ datasetName: resource.label });
    },
    [],
  );

  const handleClearDataset = useCallback(() => {
    setAttachedDataset(null);
    publishLabCoachContext({ datasetName: null });
  }, []);

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      try {
        const written = await runtime.uploadFiles(files);
        const lastName = written[written.length - 1] ?? files[files.length - 1]?.name ?? null;
        if (lastName) {
          const path = `/workspace/data/uploads/${lastName}`;
          const next: AttachedDataset = {
            id: `upload:${path}`,
            label: lastName,
            source: "uploaded",
            workspacePath: path,
          };
          setAttachedDataset(next);
          publishLabCoachContext({ datasetName: lastName });
        }
        try {
          const formData = new FormData();
          formData.append("inviteCode", inviteCode);
          formData.append("moduleSlug", moduleSlug);
          for (const file of files) {
            formData.append("files", file);
          }
          await fetch("/api/training/participant/workspace/upload", {
            method: "POST",
            body: formData,
          });
        } catch {
          // background mirror only; uploads still usable in browser FS
        }
      } catch (error) {
        appendMessage({
          id: createId("note"),
          kind: "system_note",
          tone: "warn",
          text:
            error instanceof Error
              ? `Upload failed: ${error.message}`
              : "Upload failed.",
          createdAt: new Date().toISOString(),
        });
      } finally {
        setIsUploading(false);
      }
    },
    [appendMessage, inviteCode, moduleSlug, runtime],
  );

  type ValidationOutcome = {
    task: PythonTaskCheck;
    result: { passed: boolean; message: string; details: string[] } | null;
  };

  const validateSingleTask = useCallback(
    async (task: PythonTaskCheck): Promise<ValidationOutcome> => {
      if (!task.validationPython) {
        return { task, result: null };
      }
      const result = await runtime.runValidation(task.validationPython);
      return { task, result };
    },
    [runtime],
  );

  const handleRunCode = useCallback(
    async (code: string) => {
      if (!activeCheckpoint) return;
      const trimmed = code.trim();
      if (!trimmed) return;

      const runId = createId("run");
      lastRunResultIdRef.current = runId;
      lastCodeRef.current = trimmed;

      const initialMessage: LabChatMessage = {
        id: runId,
        kind: "code_run",
        label: starterCodeBlock?.label ?? "Run",
        code: trimmed,
        status: "running",
        stdout: "",
        stderr: "",
        dataPreview: null,
        charts: [],
        files: [],
        createdAt: new Date().toISOString(),
      };
      appendMessage(initialMessage);

      await ensureCheckpointStarted();

      const result = await runtime.run(trimmed);
      lastStdoutRef.current = result.stdout;
      lastStderrRef.current = result.stderr;
      publishLabCoachContext({
        code: trimmed,
        stdout: result.stdout || null,
        stderr: result.stderr || null,
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === runId && message.kind === "code_run"
            ? {
                ...message,
                status: result.failed ? "failed" : "ok",
                stdout: result.stdout,
                stderr: result.stderr,
                dataPreview: result.dataPreview,
                charts: result.charts,
                files: result.files,
              }
            : message,
        ),
      );

      if (result.failed) {
        appendMessage({
          id: createId("checkpoint"),
          kind: "checkpoint_event",
          status: "retry",
          title: activeCheckpoint.title,
          detail:
            "The run hit an error. Click \"Ask coach to explain my error\" above to walk through the traceback. The coach will name what went wrong and propose a short fix you can run inline.",
          details: [],
          createdAt: new Date().toISOString(),
        });
        return;
      }

      if (autoTasks.length === 0) {
        return;
      }

      const focusTask =
        autoTasks.find((task) => taskState[task.id] !== "passed") ?? null;
      if (!focusTask) {
        appendMessage({
          id: createId("checkpoint"),
          kind: "checkpoint_event",
          status: "passed",
          title: activeCheckpoint.title,
          detail:
            guidedTasks.length > 0
              ? "All auto checks already passed. Discuss the guided tasks, then mark complete."
              : "All checks already passed. Mark the checkpoint complete when you are ready.",
          details: [],
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const previousAttempts = taskAttemptCountRef.current[focusTask.id] ?? 0;
      taskAttemptCountRef.current = {
        ...taskAttemptCountRef.current,
        [focusTask.id]: previousAttempts + 1,
      };

      const outcome = await validateSingleTask(focusTask);
      const validationResult = outcome.result;
      if (!validationResult) {
        return;
      }

      if (validationResult.passed) {
        setTaskState((current) => ({
          ...current,
          [focusTask.id]: "passed",
        }));
        const nextTask = autoTasks.find(
          (task) => task.id !== focusTask.id && taskState[task.id] !== "passed",
        );
        appendMessage({
          id: createId("checkpoint"),
          kind: "checkpoint_event",
          status: "passed",
          title: focusTask.title,
          detail: nextTask
            ? `Nice. Now work on "${nextTask.title}". ${nextTask.successCriteria}`
            : guidedTasks.length > 0
              ? "All auto checks passed. Discuss the guided tasks, then mark complete."
              : "All checks passed. Mark the checkpoint complete when you are ready.",
          details: [],
          createdAt: new Date().toISOString(),
        });
        return;
      }

      // Failed. If this is the first time we've ever validated this task
      // (typically immediately after the previous task passed and the user
      // hasn't actually attempted this one yet), surface a soft "now work on
      // this" guidance verdict instead of marking it as a RETRY. Only
      // escalate to RETRY once the learner has actually had a go.
      const isFirstEverAttempt = previousAttempts === 0;
      if (isFirstEverAttempt) {
        appendMessage({
          id: createId("checkpoint"),
          kind: "checkpoint_event",
          status: "passed",
          title: `Now work on: ${focusTask.title}`,
          detail: `${focusTask.successCriteria} Write code for this step, then click Run again.`,
          details: [],
          createdAt: new Date().toISOString(),
        });
        return;
      }

      setTaskState((current) => ({
        ...current,
        [focusTask.id]: "retry",
      }));
      appendMessage({
        id: createId("checkpoint"),
        kind: "checkpoint_event",
        status: "retry",
        title: focusTask.title,
        detail:
          validationResult.message ||
          "This task did not pass yet. Read the run output above, then iterate or ask the coach.",
        details: validationResult.details ?? [],
        createdAt: new Date().toISOString(),
      });
    },
    [
      activeCheckpoint,
      appendMessage,
      autoTasks,
      ensureCheckpointStarted,
      guidedTasks.length,
      runtime,
      starterCodeBlock,
      taskState,
      validateSingleTask,
    ],
  );

  const sendCoachPrompt = useCallback(
    async (prompt: string, extraSystem?: string) => {
      if (!prompt.trim()) return;
      lastUserMessageRef.current = prompt;
      appendMessage({
        id: createId("user"),
        kind: "user_text",
        text: prompt,
        createdAt: new Date().toISOString(),
      });
      const replyId = createId("assistant");
      appendMessage({
        id: replyId,
        kind: "assistant_reply",
        text: "",
        createdAt: new Date().toISOString(),
        isPending: true,
      });
      setIsCoachReplying(true);
      try {
        const conversation = messages
          .filter((message) => message.kind === "user_text" || message.kind === "assistant_reply")
          .slice(-6)
          .map((message) => {
            if (message.kind === "user_text") return `Learner: ${message.text}`;
            if (message.kind === "assistant_reply") return `Coach: ${message.text}`;
            return null;
          })
          .filter(Boolean)
          .join("\n");

        const response = await fetch("/api/training/participant/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteCode,
            moduleSlug,
            prompt,
            system: extraSystem ?? null,
            surface: "studio",
            scope: activeCheckpoint ? "checkpoint" : "module",
            scopeId: activeCheckpoint?.slug ?? null,
            intent: "ask",
            labContext: {
              checkpoint: activeCheckpoint
                ? {
                    slug: activeCheckpoint.slug,
                    title: activeCheckpoint.title,
                    description: activeCheckpoint.description,
                    facilitatorPrompt: activeCheckpoint.facilitatorPrompt,
                    dataPosture: activeCheckpoint.dataPosture ?? null,
                    leadershipQuestion: activeCheckpoint.leadershipQuestion ?? null,
                  }
                : null,
              task: (() => {
                if (fourStepLab && unifiedActiveTask) {
                  const isWb = isWorkbenchTask(unifiedActiveTask);
                  return {
                    id: unifiedActiveTask.id,
                    title: unifiedActiveTask.title,
                    successCriteria: isWb
                      ? unifiedActiveTask.successCriteria.join("; ")
                      : unifiedActiveTask.successCriteria,
                    inputHint: isWb ? null : unifiedActiveTask.inputHint,
                    kind: isWb ? "workbench" : "python",
                    prompt: unifiedActiveTask.prompt,
                  };
                }
                const currentTask =
                  tasks.find((task) => {
                    const state = taskState[task.id];
                    return state !== "passed" && state !== "guided_complete";
                  }) ?? tasks[0] ?? null;
                return {
                  id: currentTask?.id ?? null,
                  title: currentTask?.title ?? null,
                  successCriteria:
                    currentTask?.successCriteria ?? (successCriteria.join("; ") || null),
                  inputHint: currentTask?.inputHint ?? null,
                  kind: "python",
                  prompt: currentTask?.prompt ?? null,
                };
              })(),
              currentBeat: currentStep,
              challengeQuestion: activeChallengeQuestion
                ? {
                    id: activeChallengeQuestion.id,
                    type: activeChallengeQuestion.type,
                    prompt: activeChallengeQuestion.prompt,
                    rubric: activeChallengeQuestion.rubric,
                  }
                : null,
              datasetName: attachedDataset?.label ?? null,
              code: lastCodeRef.current || null,
              stdout: lastStdoutRef.current || null,
              stderr: lastStderrRef.current || null,
              priorConversation: conversation || null,
            },
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          throw new Error(body?.error?.message ?? `Coach returned ${response.status}`);
        }
        const payload = (await response.json()) as {
          data?: {
            results?: Array<{ output?: string; status?: string; errorMessage?: string }>;
          };
        };
        const result = payload.data?.results?.[0];
        if (!result || result.status !== "completed" || !result.output?.trim()) {
          throw new Error(result?.errorMessage ?? "The coach returned an empty response.");
        }
        const text = result.output.trim();
        setMessages((current) =>
          current.map((message) =>
            message.id === replyId && message.kind === "assistant_reply"
              ? { ...message, text, isPending: false }
              : message,
          ),
        );
      } catch (error) {
        const { friendly, raw } = friendlyCoachError(error);
        setMessages((current) => {
          // Drop the empty pending reply and append a dedicated error bubble
          // that carries the original prompt + system so the learner can
          // retry with one click.
          const withoutPending = current.filter((message) => message.id !== replyId);
          return [
            ...withoutPending,
            {
              id: createId("error"),
              kind: "assistant_error",
              text: friendly,
              detail: raw || null,
              retryPrompt: prompt,
              retryExtraSystem: extraSystem ?? null,
              createdAt: new Date().toISOString(),
            },
          ];
        });
      } finally {
        setIsCoachReplying(false);
      }
    },
    [
      activeChallengeQuestion,
      activeCheckpoint,
      appendMessage,
      attachedDataset,
      currentStep,
      fourStepLab,
      inviteCode,
      messages,
      moduleSlug,
      successCriteria,
      taskState,
      tasks,
      unifiedActiveTask,
    ],
  );

  // Persist a workbench task's evidence (the participant's own writing) and
  // mark the task as submitted so the four-step loop advances. Evidence
  // travels through the standard /api/training/participant/submit endpoint
  // so the facilitator console picks it up alongside other submissions.
  const submitWorkbenchTask = useCallback(
    async (task: WorkbenchTask, summary: string) => {
      const trimmed = summary.trim();
      if (!trimmed) {
        appendMessage({
          id: createId("note"),
          kind: "system_note",
          tone: "warn",
          text: `Write your ${task.title.toLowerCase()} in the chat first, then mark it done.`,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      let submitOk = false;
      let failureReason: string | null = null;
      try {
        const response = await fetch("/api/training/participant/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteCode,
            moduleSlug,
            scope: "task",
            scopeId: task.id,
            kind: "workbench_state",
            summary: trimmed.slice(0, 500),
            metadata: {
              checkpointSlug: task.checkpointSlug,
              taskKind: task.kind,
              beat: stepForWorkbenchTask(task),
              fullText: trimmed,
              challengeQuestionId: activeChallengeQuestion?.id ?? null,
            },
          }),
        });
        if (response.ok) {
          submitOk = true;
        } else {
          const body = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          failureReason =
            body?.error?.message ?? `Submit returned ${response.status}.`;
        }
      } catch (error) {
        failureReason = error instanceof Error ? error.message : String(error ?? "");
      }

      if (!submitOk) {
        appendMessage({
          id: createId("note"),
          kind: "system_note",
          tone: "warn",
          text: `Could not save your ${task.title.toLowerCase()} (${
            failureReason ?? "unknown error"
          }). Click "Mark ${task.title.toLowerCase().split(" ")[0]} done" to retry.`,
          createdAt: new Date().toISOString(),
        });
        return;
      }

      setWorkbenchTaskState((current) => ({
        ...current,
        [task.id]: "submitted",
      }));
      appendMessage({
        id: createId("checkpoint"),
        kind: "checkpoint_event",
        status: "passed",
        title: task.title,
        detail:
          task.id.endsWith("-defend")
            ? "Defend answer saved. You can refine it any time before marking the lab complete."
            : task.id.endsWith("-brief")
              ? "Brief saved. Now move into the chat to engage and verify."
              : "Note saved.",
        details: [],
        createdAt: new Date().toISOString(),
      });
    },
    [activeChallengeQuestion, appendMessage, inviteCode, moduleSlug],
  );

  const canMarkComplete = useMemo(() => {
    if (!activeCheckpoint || checkpointStatus === "completed") return false;
    if (fourStepLab) {
      return unifiedTasks.length > 0 && unifiedTasks.every((task) => isComplete(task));
    }
    if (autoTasks.length === 0 && guidedTasks.length === 0) return true;
    const autoOk = autoTasks.every((task) => taskState[task.id] === "passed");
    const guidedOk = guidedTasks.every((task) => taskState[task.id] === "guided_complete");
    return autoOk && guidedOk;
  }, [
    activeCheckpoint,
    autoTasks,
    checkpointStatus,
    fourStepLab,
    guidedTasks,
    isComplete,
    taskState,
    unifiedTasks,
  ]);

  const handleMarkComplete = useCallback(async () => {
    if (!activeCheckpoint) return;
    if (!canMarkComplete) return;
    setCheckpointStatus("completed");
    await sendCheckpointEvent(activeCheckpoint, "lab_completed", {
      completionMode: guidedTasks.length > 0 ? "guided_complete" : "passed",
    });
    appendMessage({
      id: createId("checkpoint"),
      kind: "checkpoint_event",
      status: "completed",
      title: activeCheckpoint.title,
      detail: "Lab complete. Your progress is saved.",
      details: [],
      createdAt: new Date().toISOString(),
    });
  }, [activeCheckpoint, appendMessage, canMarkComplete, guidedTasks.length, sendCheckpointEvent]);

  const handleMarkGuidedTasksDiscussed = useCallback(() => {
    if (guidedTasks.length === 0) return;
    setTaskState((current) => {
      const next = { ...current };
      for (const task of guidedTasks) {
        next[task.id] = "guided_complete";
      }
      return next;
    });
    appendMessage({
      id: createId("note"),
      kind: "system_note",
      tone: "success",
      text: `Guided discussion recorded for ${guidedTasks.length} task${guidedTasks.length === 1 ? "" : "s"}.`,
      createdAt: new Date().toISOString(),
    });
  }, [appendMessage, guidedTasks]);

  const quickActions = useMemo<LabChatQuickAction[]>(() => {
    const actions: LabChatQuickAction[] = [];

    // Four-step lab: surface step-aware actions first so participants are
    // pushed toward the right move at the right time.
    if (fourStepLab) {
      if (currentStep === "brief" && briefTask) {
        actions.push({
          id: "brief-this-task",
          label: "Brief this task",
          prompt:
            "Help me brief the current task. Start by quoting the leadership question back to me word for word from the lab context (so I see the exact ask). Then ask me to restate it in my own words. Then walk me through the questions I should answer in writing before I prompt you for code, with one example of what 'good' would look like for each. Do not write any python code on this beat.",
        });
        actions.push({
          id: "mark-brief-done",
          label: "Mark brief done",
          onSelect: () => void submitWorkbenchTask(briefTask, lastUserMessageRef.current),
        });
      }
      if (currentStep === "engage" || currentStep === "verify") {
        actions.push({
          id: "pressure-test",
          label: "Pressure-test this",
          prompt:
            "Argue against my last interpretation or my last code. What is the strongest counter-argument from the same evidence? Be concrete and give me one specific thing to recheck. If a verification snippet helps, give me a short runnable python block.",
        });
        actions.push({
          id: "what-might-be-wrong",
          label: "What might be wrong here?",
          prompt:
            "Look at my most recent code and run output above and name one specific thing that might be wrong, however small. Be concrete - line, value, or assumption. If a fix or check helps, give me a short runnable python block I can click Run on.",
        });
      }
      if (currentStep === "verify" && noteIssueTask) {
        actions.push({
          id: "mark-note-done",
          label: "Mark issue noted",
          onSelect: () => void submitWorkbenchTask(noteIssueTask, lastUserMessageRef.current),
        });
      }
      if (currentStep === "defend" && defendTask) {
        actions.push({
          id: "submit-defend",
          label: "Submit my Defend answer",
          onSelect: () => void submitWorkbenchTask(defendTask, lastUserMessageRef.current),
        });
      }
    }

    if (starterCodeBlock) {
      actions.push({
        id: "run-starter",
        label: `Run ${starterCodeBlock.label}`,
        onSelect: () => void handleRunCode(starterCodeBlock.code),
      });
    }
    actions.push({
      id: "next-step",
      label: "Suggest the next step",
      prompt:
        "Give me a single next-step hint for the current task without giving away the full answer. If a code block helps, give me one short runnable python block I can click Run on right here in the chat.",
    });
    actions.push({
      id: "check-work",
      label: "Check my work",
      prompt:
        "Check my last run (the code and stdout/stderr above) against the success criteria. Call out what is solid and what still needs to land. If a fix is needed, propose a short runnable python block I can click Run on inline.",
    });
    if (lastStderrRef.current) {
      actions.push({
        id: "explain-error",
        label: "Explain my last error",
        prompt:
          "Explain the last error from my run in one or two short sentences and tell me how to fix it. If a fix is needed, give me a short runnable python block I can click Run on right here.",
      });
    }
    if (!fourStepLab && guidedTasks.length > 0) {
      actions.push({
        id: "mark-guided",
        label: "Mark guided discussion done",
        onSelect: handleMarkGuidedTasksDiscussed,
      });
    }
    return actions;
  }, [
    briefTask,
    currentStep,
    defendTask,
    fourStepLab,
    guidedTasks.length,
    handleMarkGuidedTasksDiscussed,
    handleRunCode,
    noteIssueTask,
    starterCodeBlock,
    submitWorkbenchTask,
  ]);

  const runtimeReady = runtime.state === "ready";

  const requestAttachOpen = useCallback(() => {
    attachOpenerRef.current?.();
  }, []);

  const askCoachExplainLastError = useCallback(() => {
    void sendCoachPrompt(
      "Explain my last error in one or two short sentences and tell me how to fix it. If a fix is needed, give me a short runnable python block I can click Run on right here in the chat.",
    );
  }, [sendCoachPrompt]);

  const askCoachForHint = useCallback(() => {
    void sendCoachPrompt(
      "Give me a single next-step hint for the current task without giving away the full answer. If a code block helps, give me one short runnable python block I can click Run on right here in the chat.",
    );
  }, [sendCoachPrompt]);

  const taskMentionsCsv = useMemo(() => {
    if (!activeTask) return false;
    const haystack = `${activeTask.prompt ?? ""} ${activeTask.inputHint ?? ""} ${activeTask.successCriteria ?? ""}`.toLowerCase();
    return haystack.includes("csv") || haystack.includes("dataset") || haystack.includes("dataframe");
  }, [activeTask]);

  const nextAction = useMemo<LabChatNextAction | null>(() => {
    if (!activeCheckpoint) return null;

    if (checkpointStatus === "completed") {
      return {
        id: "completed",
        label: "Checkpoint complete",
        tone: "success",
        disabled: true,
        onSelect: () => undefined,
      };
    }

    if (!runtimeReady) {
      return {
        id: "loading",
        label: "Loading Python...",
        tone: "neutral",
        disabled: true,
        onSelect: () => undefined,
      };
    }

    // Four-step lab affordances. We surface a step-aligned next action that
    // tells the participant what move comes next without giving away the
    // answer, then fall back to the legacy logic for the auto python task.
    // Every beat resolves to a deterministic primary action so the chip is
    // never empty.
    if (fourStepLab) {
      // Resolve current beat from the active workbench task when it is one,
      // otherwise infer from currentStep so the engage beat (auto python) is
      // also covered.
      const beat: LabBeat | null =
        unifiedActiveTask && isWorkbenchTask(unifiedActiveTask)
          ? stepForWorkbenchTask(unifiedActiveTask)
          : currentStep;

      if (beat === "brief") {
        return {
          id: "brief-next",
          label: "Brief in the chat",
          tone: "primary",
          helper:
            "Type your brief, then click Mark brief done. The coach can help you sharpen it.",
          onSelect: () =>
            void sendCoachPrompt(
              "Help me brief the current task. Start by quoting the leadership question back to me word for word from the lab context (so I see the exact ask). Then ask me to restate it in my own words. Then walk me through the questions I should answer in writing before I prompt you for code, with one example of what 'good' would look like for each. Do not write any python code on this beat.",
            ),
        };
      }
      if (beat === "engage") {
        // If the last run failed, the most useful next move is almost never
        // "Run the same block again". Surface the explain-error chip in the
        // primary slot so participants who drop into a traceback know exactly
        // what to click. The legacy "Run starter" / "Pressure-test" actions
        // remain available in the quick-action chips below.
        if (lastStderrRef.current) {
          return {
            id: "explain-error",
            label: "Ask coach to explain my error",
            tone: "warn",
            helper: "Coach reads the traceback and proposes a fix.",
            onSelect: askCoachExplainLastError,
          };
        }
        if (starterCodeBlock) {
          return {
            id: "run-starter",
            label: `Run ${starterCodeBlock.label}`,
            tone: "primary",
            helper: "Runs the starter block in your workspace.",
            onSelect: () => void handleRunCode(starterCodeBlock.code),
          };
        }
        return {
          id: "pressure-test",
          label: "Pressure-test this",
          tone: "primary",
          helper: "Coach argues against your last interpretation.",
          onSelect: () =>
            void sendCoachPrompt(
              "Argue against my last interpretation or my last code. What is the strongest counter-argument from the same evidence? Be concrete and give me one specific thing to recheck. If a verification snippet helps, give me a short runnable python block.",
            ),
        };
      }
      if (beat === "verify") {
        if (lastStderrRef.current) {
          return {
            id: "explain-error",
            label: "Ask coach to explain my error",
            tone: "warn",
            helper: "Coach reads the traceback and proposes a fix.",
            onSelect: askCoachExplainLastError,
          };
        }
        return {
          id: "check-my-work",
          label: "Check my work",
          tone: "primary",
          helper: "Coach checks the last run against success criteria.",
          onSelect: () =>
            void sendCoachPrompt(
              "Check my last run (the code and stdout/stderr above) against the success criteria. Call out what is solid and what still needs to land. If a fix is needed, propose a short runnable python block I can click Run on inline.",
            ),
        };
      }
      if (beat === "defend") {
        if (activeChallengeQuestion) {
          return {
            id: "answer-challenge",
            label: "Answer challenge question",
            tone: "primary",
            helper: "Write your answer in the chat, then click Submit my Defend answer.",
            onSelect: () =>
              void sendCoachPrompt(
                `I am answering this challenge question: "${activeChallengeQuestion.prompt}" Help me sharpen what I have written so far - hold me to the rubric, do not write the answer for me.`,
              ),
          };
        }
        return {
          id: "defend-help",
          label: "Pressure-test my answer",
          tone: "primary",
          helper: "Coach holds you to the rubric.",
          onSelect: () =>
            void sendCoachPrompt(
              "Read my last answer to the challenge question above and pressure-test it against the rubric. Quote one phrase back at me that does not yet hold up.",
            ),
        };
      }
    }

    if (!attachedDataset && taskMentionsCsv && moduleDatasets.length > 0) {
      return {
        id: "attach",
        label: "Pick the dataset for the coach",
        tone: "primary",
        helper:
          "Bundled CSVs are already in /workspace/data/. Picking one focuses the coach on the right file.",
        onSelect: requestAttachOpen,
      };
    }

    if (lastStderrRef.current) {
      return {
        id: "explain-error",
        label: "Ask coach to explain",
        tone: "warn",
        helper: "Coach will explain the last traceback.",
        onSelect: askCoachExplainLastError,
      };
    }

    if (activeTask && activeTaskBarState === "retry") {
      return {
        id: "hint",
        label: "Ask coach for a hint",
        tone: "warn",
        helper: "One small nudge without spoilers.",
        onSelect: askCoachForHint,
      };
    }

    if (
      starterCodeBlock &&
      activeTask &&
      activeTaskIndex === 0 &&
      (taskState[activeTask.id] ?? "not_started") === "not_started" &&
      !lastCodeRef.current
    ) {
      return {
        id: "run-starter",
        label: `Run ${starterCodeBlock.label}`,
        tone: "primary",
        helper: "Runs the starter block in your workspace.",
        onSelect: () => void handleRunCode(starterCodeBlock.code),
      };
    }

    if (
      activeTask &&
      (taskState[activeTask.id] ?? "not_started") === "not_started"
    ) {
      return {
        id: "ask-walkthrough",
        label: "Ask coach for a starter",
        tone: "primary",
        helper: "Coach explains this task and offers code you can run.",
        onSelect: () =>
          void sendCoachPrompt(
            `Help me with "${activeTask.title}". The chat is my Python workspace and any code block you give me has a Run button right below it. In one or two short bullets explain what success looks like, then give me one runnable python code block I can click Run on as a starter. Do not tell me to open a separate workspace or terminal.`,
          ),
      };
    }

    if (
      autoTasks.length > 0 &&
      autoTasks.every((task) => taskState[task.id] === "passed") &&
      guidedTasks.length > 0 &&
      guidedTasks.some((task) => taskState[task.id] !== "guided_complete")
    ) {
      return {
        id: "mark-guided",
        label: "Mark guided complete",
        tone: "success",
        helper: "Confirms the discussion items.",
        onSelect: handleMarkGuidedTasksDiscussed,
      };
    }

    if (canMarkComplete) {
      return {
        id: "mark-checkpoint",
        label: "Mark lab complete",
        tone: "success",
        helper: "Saves your progress and unlocks the back-to-module link.",
        onSelect: () => void handleMarkComplete(),
      };
    }

    if (checkpointStatus === "not_started") {
      return {
        id: "start",
        label: "Start lab",
        tone: "primary",
        helper: "Marks this lab as in progress on your record.",
        onSelect: handleStartCheckpoint,
      };
    }

    return {
      id: "ask-coach",
      label: "Ask the coach",
      tone: "neutral",
      helper: "Type below or pick a quick action.",
      onSelect: () => undefined,
      disabled: true,
    };
    // messages is included so the memo recomputes after each run, picking up
    // the latest values of lastCodeRef.current and lastStderrRef.current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeChallengeQuestion,
    activeCheckpoint,
    activeTask,
    activeTaskBarState,
    activeTaskIndex,
    askCoachExplainLastError,
    askCoachForHint,
    attachedDataset,
    autoTasks,
    canMarkComplete,
    checkpointStatus,
    fourStepLab,
    guidedTasks,
    handleMarkComplete,
    handleMarkGuidedTasksDiscussed,
    handleRunCode,
    handleStartCheckpoint,
    messages,
    moduleDatasets.length,
    requestAttachOpen,
    runtimeReady,
    sendCoachPrompt,
    starterCodeBlock,
    taskMentionsCsv,
    taskState,
    unifiedActiveTask,
  ]);

  const handleAttachReady = useCallback((open: () => void) => {
    attachOpenerRef.current = open;
  }, []);

  // True once the participant has actually engaged the chat for this lab
  // (sent a message, gotten a coach reply, or run code). Drives the
  // auto-collapse on the active task bar so the chat surface gets more
  // room once the conversation is underway.
  const hasChatStarted = useMemo(
    () =>
      messages.some(
        (message) =>
          message.kind === "user_text" ||
          message.kind === "assistant_reply" ||
          message.kind === "code_run",
      ),
    [messages],
  );

  return (
    <div className="flex min-h-0 flex-1 gap-0">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <RuntimeBanner
          state={runtime.state}
          message={runtime.message}
          onReload={() => {
            void runtime.reload();
          }}
        />
        {activeCheckpoint ? (
          <LabChatActiveTaskBar
            activityTitle={activeCheckpoint.title}
            activeTask={fourStepLab ? unifiedActiveTask : activeTask}
            taskState={fourStepLab ? unifiedActiveTaskBarState : activeTaskBarState}
            taskIndex={fourStepLab ? unifiedActiveTaskIndex : activeTaskIndex}
            taskCount={fourStepLab ? unifiedTasks.length : tasks.length}
            nextAction={nextAction}
            currentStep={currentStep}
            stepsCompleted={stepsCompleted}
            leadershipQuestion={activeCheckpoint.leadershipQuestion ?? null}
            hasChatStarted={hasChatStarted}
          />
        ) : null}
        <LabChatThread
          messages={messages}
          runtimeReady={runtimeReady}
          onRunCode={(code) => {
            void handleRunCode(code);
          }}
          onStartCheckpoint={handleStartCheckpoint}
          onMarkComplete={() => {
            void handleMarkComplete();
          }}
          canMarkComplete={canMarkComplete}
          onRetryCoach={(retryPrompt, extraSystem) => {
            void sendCoachPrompt(retryPrompt, extraSystem ?? undefined);
          }}
        />
        <LabChatComposer
          inviteCode={inviteCode}
          moduleSlug={moduleSlug}
          moduleDatasets={moduleDatasets}
          attachedDataset={attachedDataset}
          onSendText={(text) => sendCoachPrompt(text)}
          onAttachModuleDataset={handleAttachModuleDataset}
          onClearDataset={handleClearDataset}
          onUploadFiles={handleUploadFiles}
          quickActions={quickActions}
          isSending={isCoachReplying}
          isUploading={isUploading}
          runtimeReady={runtimeReady}
          onAttachReady={handleAttachReady}
        />
      </section>

      <aside className="hidden w-[260px] shrink-0 flex-col gap-3 border-l border-white/[0.08] bg-black/30 px-4 py-4 lg:flex">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Progress</p>
            {(fourStepLab ? unifiedTasks.length : tasks.length) > 0 ? (
              <span className="text-[10px] font-medium text-zinc-400">
                {fourStepLab ? unifiedPassedCount : passedCount}/
                {fourStepLab ? unifiedTasks.length : tasks.length}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-white">
            {checkpointStatus === "completed"
              ? "Checkpoint complete"
              : checkpointStatus === "launched"
                ? "Checkpoint in progress"
                : "Not started"}
          </p>
          {checkpointStatus === "completed" ? (
            <a
              href={`/academy/${inviteCode}/${moduleSlug}`}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/[0.16] px-3 py-1.5 text-[11px] font-medium text-emerald-50 transition hover:bg-emerald-400/[0.24]"
            >
              Lab complete &middot; back to module
            </a>
          ) : null}
          {(fourStepLab ? unifiedTasks.length : tasks.length) > 0 ? (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-emerald-400/70 transition-all"
                style={{
                  width: `${Math.round(
                    ((fourStepLab ? unifiedPassedCount : passedCount) /
                      Math.max(fourStepLab ? unifiedTasks.length : tasks.length, 1)) *
                      100,
                  )}%`,
                }}
                aria-hidden
              />
            </div>
          ) : null}
          <div className="mt-2 space-y-1">
            {(fourStepLab ? unifiedTasks : tasks).map((task, index) => {
              const isWb = isWorkbenchTask(task);
              const completed = isWb
                ? workbenchTaskState[task.id] === "submitted"
                : taskState[task.id] === "passed" ||
                  taskState[task.id] === "guided_complete";
              const isRetry = !isWb && taskState[task.id] === "retry";
              const isActive =
                index === (fourStepLab ? unifiedActiveTaskIndex : activeTaskIndex) &&
                !completed;
              const modeBadge = isWb ? "workbench" : task.mode;
              const tone = completed
                ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
                : isRetry
                  ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
                  : isActive
                    ? "border-sky-400/40 bg-sky-400/[0.10] text-sky-50"
                    : "border-white/10 bg-white/[0.02] text-zinc-400";
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] transition ${tone} ${
                    isActive ? "ring-1 ring-sky-400/30" : ""
                  }`}
                >
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />
                  <span className="min-w-0 truncate">{task.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.16em] opacity-70">
                    {modeBadge}
                  </span>
                </div>
              );
            })}
            {(fourStepLab ? unifiedTasks.length : tasks.length) === 0 ? (
              <p className="text-[11px] text-zinc-500">
                No structured checks for this checkpoint. Use Mark complete when done.
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Artifacts</p>
          <div className="mt-2 space-y-1.5">
            {runtime.state === "loading" && runtime.files.length === 0 ? (
              <div className="space-y-1.5" aria-hidden>
                <div className="h-6 w-full animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="h-6 w-3/4 animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="h-6 w-2/3 animate-pulse rounded-xl bg-white/[0.04]" />
              </div>
            ) : runtime.files.filter((file) => file.scope === "output").length === 0 ? (
              <p className="text-[11px] text-zinc-500">
                Outputs you save during runs will appear here.
              </p>
            ) : (
              runtime.files
                .filter((file) => file.scope === "output")
                .map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => runtime.downloadFile(file)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-left text-[11px] text-zinc-200 transition hover:bg-white/[0.06]"
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">Download</span>
                  </button>
                ))
            )}
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Files in workspace</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {runtime.files.length} mounted &middot; data, uploads, outputs
          </p>
        </div>
      </aside>
    </div>
  );
}

function RuntimeBanner({
  state,
  message,
  onReload,
}: {
  state: "idle" | "loading" | "ready" | "error";
  message: string;
  onReload?: () => void;
}) {
  if (state === "ready") return null;
  const tone =
    state === "error"
      ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
      : "border-amber-400/30 bg-amber-400/[0.08] text-amber-100";
  const label =
    state === "loading"
      ? "Loading Python..."
      : state === "error"
        ? "Lab error"
        : "Lab idle";
  return (
    <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-2 text-[11px] ${tone}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <span className="font-medium uppercase tracking-[0.18em] text-[10px]">{label}</span>
      <span className="opacity-90">{message}</span>
      {state === "error" && onReload ? (
        <button
          type="button"
          onClick={onReload}
          className="ml-auto rounded-full border border-rose-300/40 bg-rose-300/[0.12] px-3 py-0.5 text-[10px] font-medium text-rose-50 transition hover:bg-rose-300/[0.2]"
        >
          Reload runtime
        </button>
      ) : null}
    </div>
  );
}
