import { recordRequestEvent } from "@/lib/observability";

export type ChatLatencyMarkerKind =
  | "first_token"
  | "full_response"
  | "model_call"
  | "queue_age"
  | "session_open"
  | "tool_call";

type ChatLatencyMarkerInput = {
  orgId: string;
  agentId?: string | null;
  sessionKey?: string | null;
  actorUserId?: string | null;
  marker: ChatLatencyMarkerKind;
  latencyMs: number;
  status?: "ok" | "error" | "timeout";
  model?: string | null;
  provider?: string | null;
  channel?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Records a chat-level latency marker for downstream observability dashboards.
 * Markers are stored in the same `request_events` table as RPC events but are
 * tagged with a stable `event_type` so dashboards can chart first-token,
 * full-response, queue-age, and model-call durations per agent and per org.
 */
export async function recordChatLatencyMarker(input: ChatLatencyMarkerInput) {
  if (!Number.isFinite(input.latencyMs) || input.latencyMs < 0) {
    return;
  }

  await recordRequestEvent({
    orgId: input.orgId,
    agentId: input.agentId ?? null,
    sessionKey: input.sessionKey ?? null,
    actorUserId: input.actorUserId ?? null,
    source: "saintagi.chat.latency",
    eventType: `chat.latency.${input.marker}`,
    status: input.status ?? "ok",
    latencyMs: Math.round(input.latencyMs),
    provider: input.provider ?? null,
    model: input.model ?? null,
    channel: input.channel ?? null,
    errorMessage: input.errorMessage ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      marker: input.marker,
    },
  }).catch(() => null);
}

/**
 * Lightweight helper that wraps an async function with a latency timer and
 * emits a chat latency marker on completion (or error). Intended for new chat
 * hooks that want one-line latency instrumentation. The wrapper rethrows on
 * error so the calling code keeps its existing failure semantics.
 */
export async function withChatLatencyMarker<T>(
  input: Omit<ChatLatencyMarkerInput, "latencyMs" | "status">,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    await recordChatLatencyMarker({
      ...input,
      latencyMs: Date.now() - startedAt,
      status: "ok",
    });
    return result;
  } catch (error) {
    await recordChatLatencyMarker({
      ...input,
      latencyMs: Date.now() - startedAt,
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
