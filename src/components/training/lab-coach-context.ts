"use client";

// The four-step loop participants run in every lab (Brief, Engage, Verify,
// Defend). The type identifier is `LabBeat` for legacy reasons - the user-
// facing word is "step" everywhere in copy and UI. See
// python-training/MODULE-REFRAME.md sections 5 and 7.
export type LabBeat = "brief" | "engage" | "verify" | "defend";

export type LabCoachContextSnapshot = {
  taskId: string | null;
  taskTitle: string | null;
  taskSuccessCriteria: string | null;
  datasetName: string | null;
  code: string | null;
  stdout: string | null;
  stderr: string | null;
  // Which step the participant is currently on. Lets the coach shift its
  // posture (helpful at Engage, skeptical at Verify, holding-the-line at
  // Defend) without us having to thread that through every prompt. The
  // field is named currentBeat for legacy reasons; the user-facing word is
  // "step".
  currentBeat: LabBeat | null;
  // Set when the participant enters the Defend step. References a
  // ChallengeQuestion.id from the active checkpoint's challengeQuestions
  // bank in src/lib/training-lab-checkpoints.ts.
  activeChallengeQuestionId: string | null;
};

const EVENT_NAME = "saintclaw:lab-coach-context";
const STORE_KEY = "__saintclawLabCoachContext__";

type StoreHolder = { [STORE_KEY]?: LabCoachContextSnapshot };

function emptySnapshot(): LabCoachContextSnapshot {
  return {
    taskId: null,
    taskTitle: null,
    taskSuccessCriteria: null,
    datasetName: null,
    code: null,
    stdout: null,
    stderr: null,
    currentBeat: null,
    activeChallengeQuestionId: null,
  };
}

function resolveWindowStore(): StoreHolder | null {
  if (typeof window === "undefined") return null;
  return window as unknown as StoreHolder;
}

export function publishLabCoachContext(snapshot: Partial<LabCoachContextSnapshot>) {
  const store = resolveWindowStore();
  if (!store) return;
  const next: LabCoachContextSnapshot = {
    ...emptySnapshot(),
    ...(store[STORE_KEY] ?? {}),
    ...snapshot,
  };
  store[STORE_KEY] = next;
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  } catch {
    // best-effort
  }
}

export function readLabCoachContext(): LabCoachContextSnapshot {
  const store = resolveWindowStore();
  const existing = store?.[STORE_KEY];
  return existing ?? emptySnapshot();
}

export function subscribeToLabCoachContext(
  listener: (snapshot: LabCoachContextSnapshot) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  function handler(event: Event) {
    const detail = (event as CustomEvent<LabCoachContextSnapshot>).detail;
    if (detail) listener(detail);
  }
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
