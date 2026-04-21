"use client";

import type { LabBeat } from "@/components/training/lab-coach-context";
import type { PythonTaskCheck } from "@/lib/python-task-checks";
import {
  isWorkbenchTask,
  type WorkbenchTask,
} from "@/lib/training-lab-checkpoints";

export type ActiveTaskState = "not_started" | "active" | "passed" | "retry";

export type LabChatNextActionTone = "primary" | "neutral" | "warn" | "success";

export type LabChatNextAction = {
  id: string;
  label: string;
  helper?: string | null;
  tone?: LabChatNextActionTone;
  disabled?: boolean;
  onSelect: () => void;
};

// The active task can be either an auto-validated python task or a workbench
// (brief / note / defend) task.
export type LabChatActiveTask = PythonTaskCheck | WorkbenchTask;

export type LabChatActiveTaskBarProps = {
  activityTitle: string;
  activeTask: LabChatActiveTask | null;
  taskState: ActiveTaskState;
  taskIndex: number;
  taskCount: number;
  nextAction: LabChatNextAction | null;
  // The current step in the four-step lab loop (Brief / Engage / Verify /
  // Defend). Null for legacy modules that do not run the four-step loop.
  currentStep?: LabBeat | null;
  // Steps the participant has already completed in the current lab.
  // Drives the four-dot progress indicator.
  stepsCompleted?: ReadonlySet<LabBeat>;
  // The actual question leadership is asking for this lab. Surfaced as a
  // prominent quote on the BRIEF beat so the participant knows what they are
  // restating, and shown as a quiet reference on later beats.
  leadershipQuestion?: string | null;
};

const TONE_CLASSES: Record<LabChatNextActionTone, string> = {
  primary:
    "border-sky-400/40 bg-sky-400/[0.18] text-sky-50 hover:bg-sky-400/[0.26]",
  neutral:
    "border-white/15 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.10]",
  warn:
    "border-amber-400/40 bg-amber-400/[0.16] text-amber-50 hover:bg-amber-400/[0.24]",
  success:
    "border-emerald-400/40 bg-emerald-400/[0.18] text-emerald-50 hover:bg-emerald-400/[0.26]",
};

const STEP_ORDER: LabBeat[] = ["brief", "engage", "verify", "defend"];

const STEP_LABEL: Record<LabBeat, string> = {
  brief: "Brief",
  engage: "Engage",
  verify: "Verify",
  defend: "Defend",
};

function successCriteriaList(task: LabChatActiveTask | null): string[] {
  if (!task) return [];
  if (isWorkbenchTask(task)) {
    return task.successCriteria.map((entry) => entry.trim()).filter(Boolean);
  }
  const single = task.successCriteria.trim();
  return single ? [single] : [];
}

export function LabChatActiveTaskBar({
  activityTitle,
  activeTask,
  taskState,
  taskIndex,
  taskCount,
  nextAction,
  currentStep,
  stepsCompleted,
  leadershipQuestion,
}: LabChatActiveTaskBarProps) {
  const taskTitle = activeTask?.title ?? "All tasks complete - ready to wrap up";
  const successCriteria = successCriteriaList(activeTask);
  const tone = nextAction?.tone ?? "primary";
  const buttonClasses = TONE_CLASSES[tone];

  const stepNumber = currentStep ? STEP_ORDER.indexOf(currentStep) + 1 : null;
  const showStepDots = Boolean(currentStep);

  // Eyebrow: one row, plain language.
  // Format: "Step N of 4 - <StepName>  *  <Activity>  *  Task X / Y"
  // We only render the segments we actually have so the line stays clean.
  const eyebrowParts: string[] = [];
  if (stepNumber && currentStep) {
    eyebrowParts.push(`Step ${stepNumber} of 4 - ${STEP_LABEL[currentStep]}`);
  }
  if (activityTitle) eyebrowParts.push(activityTitle);
  if (taskCount > 0) {
    eyebrowParts.push(`Task ${Math.max(taskIndex + 1, 1)} of ${taskCount}`);
  }

  // Done flavour: when the task has just passed, the success criteria block
  // would feel like nagging. Show a small done note instead.
  const isDone = taskState === "passed";
  const isRetry = taskState === "retry";

  return (
    <section
      aria-label="Active lab task"
      className="border-b border-white/[0.08] bg-gradient-to-b from-black/60 to-black/30 px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2.5">
        {eyebrowParts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {eyebrowParts.map((part, index) => (
              <span key={`${part}-${index}`} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden className="text-zinc-700">
                    /
                  </span>
                ) : null}
                <span
                  className={
                    index === 0 && currentStep
                      ? "text-sky-300"
                      : "text-zinc-400"
                  }
                >
                  {part}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-white">
            {taskTitle}
          </h3>
          {leadershipQuestion ? (
            currentStep === "brief" ? (
              <figure className="mt-2 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] px-3.5 py-2.5">
                <figcaption className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                  Leadership is asking
                </figcaption>
                <blockquote className="mt-1 text-[13px] leading-relaxed text-amber-50/95">
                  &ldquo;{leadershipQuestion}&rdquo;
                </blockquote>
                <p className="mt-1.5 text-[11px] text-amber-200/70">
                  Restate this in your own words below before you open the chat.
                </p>
              </figure>
            ) : (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-300">
                  Leadership ask &middot; show
                </summary>
                <blockquote className="mt-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] italic leading-relaxed text-zinc-300">
                  &ldquo;{leadershipQuestion}&rdquo;
                </blockquote>
              </details>
            )
          ) : null}
          {!isDone && successCriteria.length > 0 ? (
            successCriteria.length === 1 ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-300">
                {successCriteria[0]}
              </p>
            ) : (
              <ul className="mt-1.5 space-y-0.5 text-[12.5px] leading-relaxed text-zinc-300">
                {successCriteria.map((criterion, index) => (
                  <li
                    key={`${criterion}-${index}`}
                    className="flex gap-2"
                  >
                    <span aria-hidden className="mt-1 size-1 shrink-0 rounded-full bg-zinc-500" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {isDone ? (
            <p className="mt-1 text-[12.5px] text-emerald-300/90">
              Done. {nextAction ? "Pick the next move on the right." : "Move on when you are ready."}
            </p>
          ) : null}
          {isRetry ? (
            <p className="mt-1 text-[11.5px] text-amber-300/90">
              Last attempt did not pass. Read the run output above, iterate, or ask the coach for a hint.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {showStepDots ? (
            <ol className="flex items-center gap-1.5" aria-label="Lab steps">
              {STEP_ORDER.map((step) => {
                const completed = stepsCompleted?.has(step) ?? false;
                const isCurrent = step === currentStep;
                const dotClass = completed
                  ? "bg-emerald-400"
                  : isCurrent
                    ? "bg-sky-400 ring-2 ring-sky-400/30"
                    : "bg-white/15";
                return (
                  <li
                    key={step}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500"
                  >
                    <span aria-hidden className={`size-2 rounded-full ${dotClass}`} />
                    <span
                      className={
                        isCurrent
                          ? "text-sky-200"
                          : completed
                            ? "text-emerald-200/80"
                            : "text-zinc-500"
                      }
                    >
                      {STEP_LABEL[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <span aria-hidden />
          )}

          {nextAction ? (
            <div className="flex flex-col items-end gap-0.5">
              <button
                type="button"
                onClick={nextAction.onSelect}
                disabled={nextAction.disabled}
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClasses}`}
              >
                {nextAction.label}
              </button>
              {nextAction.helper ? (
                <span className="text-[10.5px] text-zinc-500">{nextAction.helper}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
