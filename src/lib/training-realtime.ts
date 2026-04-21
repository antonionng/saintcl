import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { TrainingLiveSessionRecord } from "@/types";

export type LiveMode = "off" | "on" | "locked";

export type LiveSession = {
  cohortId: string;
  moduleId: string;
  facilitatorSlideId: string | null;
  facilitatorSlideIndex: number;
  liveMode: LiveMode;
  prompt: string | null;
  promptAt: string | null;
  updatedAt: string;
};

export type LiveParticipantPosition = {
  participantId: string;
  slideId: string | null;
  slideIndex: number;
  progressPercent: number | null;
  occurredAt: string;
};

export function liveModeFromLegacy(input: {
  broadcastEnabled: boolean;
  lockToFacilitator: boolean;
}): LiveMode {
  if (input.lockToFacilitator) return "locked";
  if (input.broadcastEnabled) return "on";
  return "off";
}

export function legacyFromLiveMode(mode: LiveMode): {
  broadcastEnabled: boolean;
  lockToFacilitator: boolean;
} {
  if (mode === "locked") return { broadcastEnabled: true, lockToFacilitator: true };
  if (mode === "on") return { broadcastEnabled: true, lockToFacilitator: false };
  return { broadcastEnabled: false, lockToFacilitator: false };
}

type LiveSessionMetadata = {
  lockToFacilitator?: boolean;
  facilitatorPrompt?: string | null;
  facilitatorPromptAt?: string | null;
};

export function toLiveSession(record: TrainingLiveSessionRecord): LiveSession {
  const metadata = (record.metadata ?? {}) as LiveSessionMetadata;
  return {
    cohortId: record.cohortId,
    moduleId: record.moduleId,
    facilitatorSlideId: record.currentSlideId ?? null,
    facilitatorSlideIndex: record.currentSlideIndex,
    liveMode: liveModeFromLegacy({
      broadcastEnabled: record.broadcastEnabled,
      lockToFacilitator: Boolean(metadata.lockToFacilitator),
    }),
    prompt: metadata.facilitatorPrompt ?? null,
    promptAt: metadata.facilitatorPromptAt ?? null,
    updatedAt: record.updatedAt,
  };
}

export function liveChannelTopic(cohortId: string, moduleId: string) {
  return `training:live:${cohortId}:${moduleId}`;
}

export type SubscribeArgs = {
  supabase: SupabaseClient;
  cohortId: string;
  moduleId: string;
  onLiveSession?: (session: LiveSession) => void;
  onPosition?: (position: LiveParticipantPosition) => void;
};

export function subscribeToLiveDelivery({
  supabase,
  cohortId,
  moduleId,
  onLiveSession,
  onPosition,
}: SubscribeArgs): { channel: RealtimeChannel; unsubscribe: () => void } {
  const channel = supabase.channel(liveChannelTopic(cohortId, moduleId), {
    config: { broadcast: { self: false, ack: false } },
  });

  if (onLiveSession) {
    channel.on("broadcast", { event: "live-session" }, ({ payload }) => {
      onLiveSession(payload as LiveSession);
    });
  }

  if (onPosition) {
    channel.on("broadcast", { event: "position" }, ({ payload }) => {
      onPosition(payload as LiveParticipantPosition);
    });
  }

  channel.subscribe();

  return {
    channel,
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

type BroadcastMessage = {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
};

async function broadcastViaHttp(messages: BroadcastMessage[]) {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return;
  if (messages.length === 0) return;

  try {
    await fetch(`${env.supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        apikey: env.supabaseServiceRoleKey,
      },
      body: JSON.stringify({ messages }),
      cache: "no-store",
    });
  } catch {
    // Best-effort delivery; clients hydrate via initial fetch and keep a slow fallback poll.
  }
}

export async function publishLiveSession(session: LiveSession) {
  await broadcastViaHttp([
    {
      topic: liveChannelTopic(session.cohortId, session.moduleId),
      event: "live-session",
      payload: session as unknown as Record<string, unknown>,
    },
  ]);
}

export async function publishParticipantPosition(input: {
  cohortId: string;
  moduleId: string;
  position: LiveParticipantPosition;
}) {
  await broadcastViaHttp([
    {
      topic: liveChannelTopic(input.cohortId, input.moduleId),
      event: "position",
      payload: input.position as unknown as Record<string, unknown>,
    },
  ]);
}
