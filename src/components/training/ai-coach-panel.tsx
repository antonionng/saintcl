"use client";

import { useCallback, useRef, useState } from "react";

import type { TrainingLabCheckpoint } from "@/lib/training-lab-checkpoints";

export type AiCoachMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type AiCoachContext = {
  taskId?: string | null;
  taskTitle?: string | null;
  taskSuccessCriteria?: string | null;
  datasetName?: string | null;
  code?: string | null;
  stdout?: string | null;
  stderr?: string | null;
};

export type AiCoachPanelProps = {
  inviteCode: string;
  moduleSlug: string;
  checkpoint: TrainingLabCheckpoint | null;
  getContext?: () => AiCoachContext;
};

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiCoachPanel({
  inviteCode,
  moduleSlug,
  checkpoint,
  getContext,
}: AiCoachPanelProps) {
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendPrompt = useCallback(
    async (prompt: string, extraSystem?: string) => {
      if (!prompt.trim()) return;
      setError(null);
      const userMessage: AiCoachMessage = {
        id: createMessageId(),
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      };
      const priorMessages = messages;
      setMessages((current) => [...current, userMessage]);
      setIsSending(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const context = getContext ? getContext() : {};
        const conversation = priorMessages
          .slice(-6)
          .map((m) => `${m.role === "user" ? "Learner" : "Coach"}: ${m.content}`)
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
            scope: checkpoint ? "checkpoint" : "module",
            scopeId: checkpoint?.slug ?? null,
            intent: "ask",
            labContext: {
              checkpoint: checkpoint
                ? {
                    slug: checkpoint.slug,
                    title: checkpoint.title,
                    description: checkpoint.description,
                    facilitatorPrompt: checkpoint.facilitatorPrompt,
                  }
                : null,
              task: {
                id: context.taskId ?? null,
                title: context.taskTitle ?? null,
                successCriteria: context.taskSuccessCriteria ?? null,
              },
              datasetName: context.datasetName ?? null,
              code: context.code ?? null,
              stdout: context.stdout ?? null,
              stderr: context.stderr ?? null,
              priorConversation: conversation || null,
            },
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new Error(body?.error?.message ?? `Coach returned ${response.status}`);
        }
        const payload = (await response.json()) as {
          data?: {
            results?: Array<{
              output?: string;
              status?: string;
              errorMessage?: string;
            }>;
          };
        };
        const result = payload.data?.results?.[0];
        if (!result || result.status !== "completed" || !result.output?.trim()) {
          throw new Error(result?.errorMessage ?? "The coach returned an empty response.");
        }
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content: result.output!.trim(),
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (sendError) {
        if ((sendError as Error).name === "AbortError") return;
        setError((sendError as Error).message);
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [checkpoint, getContext, inviteCode, messages, moduleSlug],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const prompt = input.trim();
      if (!prompt) return;
      setInput("");
      void sendPrompt(prompt);
    },
    [input, sendPrompt],
  );

  const handleQuickAction = useCallback(
    (action: "explain-error" | "check-work" | "hint") => {
      const context = getContext ? getContext() : {};
      if (action === "explain-error") {
        const stderr = context.stderr?.trim();
        const prompt = stderr
          ? "Explain this error and tell me how to fix it in one or two sentences."
          : "I am stuck. Help me read the current error or warning and suggest a fix.";
        void sendPrompt(prompt, "The learner asked for error help. Focus on the last stderr.");
        return;
      }
      if (action === "check-work") {
        const prompt = "Check my work against the success criteria. Call out what is solid and what still needs to land.";
        void sendPrompt(prompt, "The learner asked you to assess their current code and output against the task success criteria.");
        return;
      }
      const prompt = "Give me a single next-step hint without giving away the full answer.";
      void sendPrompt(prompt, "The learner asked for a hint. Nudge them forward without solving for them.");
    },
    [getContext, sendPrompt],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          AI coach
        </p>
        <p className="mt-1 text-sm font-medium text-white">
          {checkpoint ? `Coach for ${checkpoint.title}` : "Lab coach"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Ask for help, a hint, or a check of your current work. The coach sees
          your task, code, and last run so you do not have to paste it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleQuickAction("explain-error")}
          disabled={isSending}
          className="rounded-full border border-rose-400/20 bg-rose-400/[0.08] px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-400/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Explain error
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("check-work")}
          disabled={isSending}
          className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-400/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check my work
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction("hint")}
          disabled={isSending}
          className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1.5 text-xs text-sky-100 transition hover:bg-sky-400/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Hint
        </button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-[1.25rem] border border-white/[0.08] bg-black/30 p-3 text-sm">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No messages yet. Ask a question or use a quick action.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-2xl border px-3 py-2 text-xs ${
                  message.role === "assistant"
                    ? "border-sky-400/20 bg-sky-400/[0.05] text-sky-50"
                    : message.role === "user"
                      ? "border-white/10 bg-white/[0.05] text-zinc-100"
                      : "border-amber-400/20 bg-amber-400/[0.05] text-amber-100"
                }`}
              >
                <p className="whitespace-pre-wrap leading-5">{message.content}</p>
              </li>
            ))}
          </ul>
        )}
        {isSending ? (
          <p className="mt-2 text-xs text-zinc-500">Coach is thinking...</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-rose-300">{error}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the coach..."
          className="flex-1 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-sky-400/40"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-full border border-sky-400/30 bg-sky-400/[0.12] px-3 py-2 text-xs text-sky-100 transition hover:bg-sky-400/[0.18] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
