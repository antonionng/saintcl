"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  liveModeFromLegacy,
  subscribeToLiveDelivery,
  type LiveSession,
} from "@/lib/training-realtime";

export type DeckState = {
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

function deriveLiveSession(payload: LiveStateResponse): LiveSession | null {
  if (payload.data?.live) return payload.data.live;
  const legacy = payload.data?.liveSession;
  if (!legacy) return null;
  return {
    cohortId: "",
    moduleId: "",
    facilitatorSlideId: legacy.currentSlideId ?? null,
    facilitatorSlideIndex:
      typeof legacy.currentSlideIndex === "number" ? legacy.currentSlideIndex : 0,
    liveMode: liveModeFromLegacy({
      broadcastEnabled: Boolean(legacy.broadcastEnabled),
      lockToFacilitator: Boolean(legacy.metadata?.lockToFacilitator),
    }),
    prompt: legacy.metadata?.facilitatorPrompt ?? null,
    promptAt: null,
    updatedAt: legacy.updatedAt ?? new Date().toISOString(),
  };
}

export function sendDeckCommand(
  iframe: HTMLIFrameElement | null,
  payload: { command: "goToSlide"; slideId?: string; slideIndex?: number },
) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    { type: "python-training:command", ...payload },
    "*",
  );
}

export type LiveDeckSession = {
  deckState: DeckState | null;
  liveSession: LiveSession | null;
  followLive: boolean;
  setFollowLive: (value: boolean) => void;
  toggleFollowLive: () => void;
  rejoinFacilitator: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
};

export function useLiveDeckSession(input: {
  inviteCode: string;
  moduleSlug: string;
  onDeckStateChange?: (next: DeckState | null) => void;
}): LiveDeckSession {
  const { inviteCode, moduleSlug, onDeckStateChange } = input;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [followLive, setFollowLive] = useState(true);

  const liveMode = liveSession?.liveMode ?? "off";
  const lockedToFacilitator = liveMode === "locked";
  const facilitatorSlideIndex = liveSession?.facilitatorSlideIndex ?? null;

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
  }, [
    deckState?.slideId,
    deckState?.slideIndex,
    deckState?.title,
    deckState?.totalSlides,
    inviteCode,
    moduleSlug,
  ]);

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
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.sendBeacon === "function"
        ) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/training/participant/progress", blob);
        }
      } catch {
        // Best-effort.
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
    const shouldFollow = followLive || lockedToFacilitator;
    if (!shouldFollow) return;
    if (liveSession.liveMode === "off") return;
    if (liveSession.facilitatorSlideIndex === deckState?.slideIndex) return;

    sendDeckCommand(iframeRef.current, {
      command: "goToSlide",
      slideId: liveSession.facilitatorSlideId ?? undefined,
      slideIndex: liveSession.facilitatorSlideIndex,
    });
  }, [liveSession, followLive, lockedToFacilitator, deckState?.slideIndex]);

  const toggleFollowLive = useCallback(() => {
    if (lockedToFacilitator) return;
    setFollowLive((current) => !current);
  }, [lockedToFacilitator]);

  const rejoinFacilitator = useCallback(() => {
    if (typeof facilitatorSlideIndex !== "number") return;
    sendDeckCommand(iframeRef.current, {
      command: "goToSlide",
      slideId: liveSession?.facilitatorSlideId ?? undefined,
      slideIndex: facilitatorSlideIndex,
    });
    setFollowLive(true);
  }, [facilitatorSlideIndex, liveSession?.facilitatorSlideId]);

  return {
    deckState,
    liveSession,
    followLive,
    setFollowLive,
    toggleFollowLive,
    rejoinFacilitator,
    iframeRef,
  };
}
