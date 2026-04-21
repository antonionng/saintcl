"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  subscribeToLiveDelivery,
  type LiveSession,
} from "@/lib/training-realtime";

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
    live?: LiveSession | null;
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

const FALLBACK_POLL_MS = 30_000;

function sendDeckCommand(
  iframe: HTMLIFrameElement | null,
  payload: { command: "goToSlide"; slideId?: string; slideIndex?: number },
) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage({ type: "python-training:command", ...payload }, "*");
}

function deriveLiveSession(payload: LiveStateResponse): LiveSession | null {
  if (payload.data?.live) return payload.data.live;
  const legacy = payload.data?.liveSession;
  if (!legacy) return null;
  const lockToFacilitator = Boolean(legacy.metadata?.lockToFacilitator);
  const broadcastEnabled = Boolean(legacy.broadcastEnabled);
  return {
    cohortId: "",
    moduleId: "",
    facilitatorSlideId: legacy.currentSlideId ?? null,
    facilitatorSlideIndex: typeof legacy.currentSlideIndex === "number" ? legacy.currentSlideIndex : 0,
    liveMode: lockToFacilitator ? "locked" : broadcastEnabled ? "on" : "off",
    prompt: legacy.metadata?.facilitatorPrompt ?? null,
    promptAt: null,
    updatedAt: legacy.updatedAt ?? new Date().toISOString(),
  };
}

export function PythonParticipantDeckPanel({
  inviteCode,
  moduleSlug,
  deckHref = "/python-training",
  deckTitle = "participant deck",
  onDeckStateChange,
  onFacilitatorPromptChange,
}: {
  inviteCode: string;
  moduleSlug: string;
  deckHref?: string;
  deckTitle?: string;
  onDeckStateChange?: (deckState: ParticipantDeckState | null) => void;
  onFacilitatorPromptChange?: (prompt: string | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [followFacilitator, setFollowFacilitator] = useState(true);
  const [deckState, setDeckState] = useState<ParticipantDeckState | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);

  const facilitatorSlideIndex = liveSession?.facilitatorSlideIndex ?? null;
  const liveMode = liveSession?.liveMode ?? "off";
  const broadcastEnabled = liveMode !== "off";
  const lockToFacilitator = liveMode === "locked";
  const facilitatorPrompt = liveSession?.prompt ?? null;

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

  // Coalesce slide_viewed events: debounce by 1500ms keyed on slideId, skip
  // when nothing changed since the last send, and use sendBeacon on pagehide
  // so the final position still lands when the participant closes the tab.
  const lastSentSlideIdRef = useRef<string | null>(null);
  const pendingSlidePayloadRef = useRef<{
    slideId: string;
    slideIndex: number;
    totalSlides: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (typeof deckState?.slideIndex !== "number") return;
    if (typeof deckState?.slideId !== "string" || !deckState.slideId) return;

    const slidePayload = {
      slideId: deckState.slideId,
      slideIndex: deckState.slideIndex,
      totalSlides: Math.max(deckState.totalSlides, 1),
      title: deckState.title,
    };

    if (lastSentSlideIdRef.current === slidePayload.slideId) {
      pendingSlidePayloadRef.current = null;
      return;
    }
    pendingSlidePayloadRef.current = slidePayload;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const payload = pendingSlidePayloadRef.current;
      if (!payload) return;
      pendingSlidePayloadRef.current = null;
      lastSentSlideIdRef.current = payload.slideId;
      void fetch("/api/training/participant/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          moduleSlug,
          eventType: "slide_viewed",
          progressPercent: Math.max(
            1,
            Math.round(((payload.slideIndex + 1) / payload.totalSlides) * 100),
          ),
          metadata: {
            slideId: payload.slideId,
            slideIndex: payload.slideIndex,
            title: payload.title,
          },
        }),
        signal: controller.signal,
        keepalive: true,
      }).catch(() => undefined);
    }, 1500);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deckState?.slideId, deckState?.slideIndex, deckState?.title, deckState?.totalSlides, inviteCode, moduleSlug]);

  useEffect(() => {
    function flushOnHide() {
      const payload = pendingSlidePayloadRef.current;
      if (!payload) return;
      pendingSlidePayloadRef.current = null;
      lastSentSlideIdRef.current = payload.slideId;
      try {
        const body = JSON.stringify({
          inviteCode,
          moduleSlug,
          eventType: "slide_viewed",
          progressPercent: Math.max(
            1,
            Math.round(((payload.slideIndex + 1) / payload.totalSlides) * 100),
          ),
          metadata: {
            slideId: payload.slideId,
            slideIndex: payload.slideIndex,
            title: payload.title,
          },
        });
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/training/participant/progress", blob);
        }
      } catch {
        // Best-effort; ignore.
      }
    }

    window.addEventListener("pagehide", flushOnHide);
    return () => window.removeEventListener("pagehide", flushOnHide);
  }, [inviteCode, moduleSlug]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let fallbackTimer: number | null = null;

    async function hydrate(): Promise<LiveSession | null> {
      const response = await fetch(
        `/api/training/live-state?inviteCode=${encodeURIComponent(inviteCode)}&moduleSlug=${encodeURIComponent(moduleSlug)}`,
        { cache: "no-store" },
      );
      if (!response.ok || cancelled) return null;
      const payload = (await response.json()) as LiveStateResponse;
      if (cancelled) return null;
      const next = deriveLiveSession(payload);
      if (next) setLiveSession(next);
      return next;
    }

    void hydrate().then((initial) => {
      if (cancelled) return;
      const supabase = createClient();
      const cohortId = initial?.cohortId ?? "";
      const moduleId = initial?.moduleId ?? "";

      if (supabase && cohortId && moduleId) {
        const subscription = subscribeToLiveDelivery({
          supabase,
          cohortId,
          moduleId,
          onLiveSession: (next) => {
            if (cancelled) return;
            setLiveSession(next);
          },
        });
        unsubscribe = subscription.unsubscribe;
      }

      // Slow fallback poll covers dropped broadcasts and unauthenticated viewers.
      fallbackTimer = window.setInterval(() => {
        void hydrate();
      }, FALLBACK_POLL_MS);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (fallbackTimer !== null) window.clearInterval(fallbackTimer);
    };
  }, [inviteCode, moduleSlug]);

  useEffect(() => {
    if (!liveSession) return;
    const shouldFollow = followFacilitator || liveSession.liveMode === "locked";
    if (!shouldFollow) return;
    if (liveSession.liveMode === "off") return;
    if (liveSession.facilitatorSlideIndex === deckState?.slideIndex) return;

    sendDeckCommand(iframeRef.current, {
      command: "goToSlide",
      slideId: liveSession.facilitatorSlideId ?? undefined,
      slideIndex: liveSession.facilitatorSlideIndex,
    });
  }, [liveSession, followFacilitator, deckState?.slideIndex]);

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
