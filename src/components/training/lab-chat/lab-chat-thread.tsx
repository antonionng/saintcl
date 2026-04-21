"use client";

import { useEffect, useRef, useState } from "react";

import { LabChatMessageView } from "./lab-chat-message";
import type { LabChatMessage } from "./lab-chat-types";

export type LabChatThreadProps = {
  messages: LabChatMessage[];
  runtimeReady: boolean;
  onRunCode: (code: string) => void;
  onStartCheckpoint?: () => void;
  onMarkComplete?: () => void;
  canMarkComplete?: boolean;
  onRetryCoach?: (prompt: string, extraSystem: string | null) => void;
};

export function LabChatThread({
  messages,
  runtimeReady,
  onRunCode,
  onStartCheckpoint,
  onMarkComplete,
  canMarkComplete,
  onRetryCoach,
}: LabChatThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onScroll() {
      if (!container) return;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const atBottom = distanceFromBottom < 80;
      stickToBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        ref={containerRef}
        className="min-h-0 w-full flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
          {messages.map((message) => {
            const isBriefMessage = message.kind === "system_brief";
            return (
              <LabChatMessageView
                key={message.id}
                message={message}
                runtimeReady={runtimeReady}
                onRunCode={onRunCode}
                onStartCheckpoint={isBriefMessage ? onStartCheckpoint : undefined}
                onMarkComplete={onMarkComplete}
                canMarkComplete={canMarkComplete}
                onRetryCoach={onRetryCoach}
              />
            );
          })}
        </div>
      </div>
      {!isAtBottom ? (
        <button
          type="button"
          onClick={() => {
            const container = containerRef.current;
            if (!container) return;
            container.scrollTop = container.scrollHeight;
            stickToBottomRef.current = true;
          }}
          className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] text-zinc-200 shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
