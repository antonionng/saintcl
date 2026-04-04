"use client";

import { useEffect, useRef, useState } from "react";

export type ParticipantDeckState = {
  slideId: string;
  slideIndex: number;
  totalSlides: number;
  title: string;
  eyebrow: string;
  fragmentIndex: number;
  fragmentCount: number;
};

type LiveStateResponse = {
  data?: {
    liveSession?: {
      currentSlideId?: string | null;
      currentSlideIndex?: number;
      broadcastEnabled?: boolean;
      metadata?: {
        lockToFacilitator?: boolean;
        facilitatorPrompt?: string | null;
      };
      updatedAt?: string;
    } | null;
  };
};

function sendDeckCommand(
  iframe: HTMLIFrameElement | null,
  payload: { command: "goToSlide"; slideId?: string; slideIndex?: number },
) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage({ type: "python-training:command", ...payload }, "*");
}

export function PythonParticipantDeckPanel({
  inviteCode,
  moduleSlug,
  deckHref = "/python-training",
  deckTitle = "participant deck",
  onDeckStateChange,
  onFacilitatorPromptChange,
  enableProgressTracking = true,
}: {
  inviteCode: string;
  moduleSlug: string;
  deckHref?: string;
  deckTitle?: string;
  onDeckStateChange?: (deckState: ParticipantDeckState | null) => void;
  onFacilitatorPromptChange?: (prompt: string | null) => void;
  enableProgressTracking?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [followFacilitator, setFollowFacilitator] = useState(true);
  const [deckState, setDeckState] = useState<ParticipantDeckState | null>(null);
  const [facilitatorSlideIndex, setFacilitatorSlideIndex] = useState<number | null>(null);
  const [broadcastEnabled, setBroadcastEnabled] = useState(false);
  const [lockToFacilitator, setLockToFacilitator] = useState(false);
  const [facilitatorPrompt, setFacilitatorPrompt] = useState<string | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "python-training:state") {
        setDeckState(event.data);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    onDeckStateChange?.(deckState);
  }, [deckState, onDeckStateChange]);

  useEffect(() => {
    onFacilitatorPromptChange?.(facilitatorPrompt);
  }, [facilitatorPrompt, onFacilitatorPromptChange]);

  useEffect(() => {
    if (!enableProgressTracking) return;
    if (typeof deckState?.slideIndex !== "number") return;

    const controller = new AbortController();
    void fetch("/api/training/participant/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode,
        moduleSlug,
        eventType: "slide_viewed",
        progressPercent: Math.max(1, Math.round(((deckState.slideIndex + 1) / Math.max(deckState.totalSlides, 1)) * 100)),
        metadata: {
          slideId: deckState.slideId,
          slideIndex: deckState.slideIndex,
          title: deckState.title,
        },
      }),
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [deckState?.slideId, deckState?.slideIndex, deckState?.title, deckState?.totalSlides, enableProgressTracking, inviteCode, moduleSlug]);

  useEffect(() => {
    let cancelled = false;

    async function pollLiveState() {
      const response = await fetch(
        `/api/training/live-state?inviteCode=${encodeURIComponent(inviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`,
        { cache: "no-store" },
      );
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as LiveStateResponse;
      if (cancelled) return;

      const liveSession = payload.data?.liveSession ?? null;
      setBroadcastEnabled(Boolean(liveSession?.broadcastEnabled));
      setLockToFacilitator(Boolean(liveSession?.metadata?.lockToFacilitator));
      setFacilitatorPrompt(liveSession?.metadata?.facilitatorPrompt ?? null);
      setFacilitatorSlideIndex(typeof liveSession?.currentSlideIndex === "number" ? liveSession.currentSlideIndex : null);

      if (
        (followFacilitator || Boolean(liveSession?.metadata?.lockToFacilitator)) &&
        liveSession?.broadcastEnabled &&
        typeof liveSession.currentSlideIndex === "number" &&
        liveSession.currentSlideIndex !== deckState?.slideIndex
      ) {
        sendDeckCommand(iframeRef.current, {
          command: "goToSlide",
          slideId: liveSession.currentSlideId ?? undefined,
          slideIndex: liveSession.currentSlideIndex,
        });
      }
    }

    pollLiveState();
    const interval = window.setInterval(pollLiveState, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [deckState?.slideIndex, followFacilitator, inviteCode, moduleSlug]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-4 py-3 text-sm text-zinc-300">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Participant deck</p>
          <p className="mt-2 font-medium text-white">
            {deckState ? `Slide ${deckState.slideIndex + 1} of ${deckState.totalSlides}` : "Loading deck"}
          </p>
          <p className="mt-1 text-zinc-400">
            {broadcastEnabled
              ? `Facilitator broadcast is live${typeof facilitatorSlideIndex === "number" ? ` on slide ${facilitatorSlideIndex + 1}` : ""}.`
              : "Facilitator broadcast is currently off."}
          </p>
          {facilitatorPrompt ? <p className="mt-2 text-amber-200">{facilitatorPrompt}</p> : null}
        </div>
        <button
          type="button"
          className={`rounded-full border px-4 py-2 text-sm transition ${
            lockToFacilitator || followFacilitator
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.05]"
          }`}
          onClick={() => {
            if (lockToFacilitator) return;
            setFollowFacilitator((current) => !current);
          }}
          disabled={lockToFacilitator}
        >
          {lockToFacilitator ? "Locked to facilitator" : followFacilitator ? "Following facilitator" : "Follow facilitator"}
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <iframe
          ref={iframeRef}
          src={deckHref}
          title={deckTitle}
          className="h-[76vh] w-full border-0 bg-black"
        />
      </div>
    </div>
  );
}
