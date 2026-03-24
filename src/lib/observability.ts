import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildObservabilityDedupeKey, projectSessionUsageLogs } from "@/lib/observability-shared";

type BaseObservabilityInput = {
  orgId: string;
  agentId?: string | null;
  actorUserId?: string | null;
  sessionKey?: string | null;
  source: string;
  occurredAt?: string | Date | number | null;
  dedupeKey?: string | null;
};

export type RequestEventInput = BaseObservabilityInput & {
  requestId?: string | null;
  eventType: string;
  path?: string | null;
  method?: string | null;
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  status: string;
  statusCode?: number | null;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cacheReadTokens?: number | null;
  cacheWriteTokens?: number | null;
  costUsd?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

export type SessionActivityEventInput = BaseObservabilityInput & {
  eventType: string;
  level?: string;
  role?: string | null;
  provider?: string | null;
  model?: string | null;
  channel?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
};

function normalizeTimestamp(value?: string | Date | number | null) {
  if (value == null) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  return new Date(value).toISOString();
}

function mapRequestEvent(input: RequestEventInput) {
  const occurredAt = normalizeTimestamp(input.occurredAt);
  return {
    org_id: input.orgId,
    agent_id: input.agentId ?? null,
    actor_user_id: input.actorUserId ?? null,
    session_key: input.sessionKey ?? null,
    request_id: input.requestId ?? randomUUID(),
    dedupe_key:
      input.dedupeKey ??
      buildObservabilityDedupeKey([
        input.orgId,
        input.source,
        input.eventType,
        input.sessionKey,
        input.requestId,
        input.path,
        input.method,
        input.status,
        occurredAt,
      ]),
    source: input.source,
    event_type: input.eventType,
    path: input.path ?? null,
    method: input.method ?? null,
    provider: input.provider ?? null,
    model: input.model ?? null,
    channel: input.channel ?? null,
    status: input.status,
    status_code: input.statusCode ?? null,
    latency_ms: input.latencyMs ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    total_tokens: input.totalTokens ?? null,
    cache_read_tokens: input.cacheReadTokens ?? null,
    cache_write_tokens: input.cacheWriteTokens ?? null,
    cost_usd: input.costUsd ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
    metadata: input.metadata ?? {},
    occurred_at: occurredAt,
  };
}

function mapSessionActivityEvent(input: SessionActivityEventInput) {
  const occurredAt = normalizeTimestamp(input.occurredAt);
  return {
    org_id: input.orgId,
    agent_id: input.agentId ?? null,
    actor_user_id: input.actorUserId ?? null,
    session_key: input.sessionKey ?? null,
    dedupe_key:
      input.dedupeKey ??
      buildObservabilityDedupeKey([
        input.orgId,
        input.source,
        input.eventType,
        input.sessionKey,
        input.role,
        input.message,
        occurredAt,
      ]),
    source: input.source,
    event_type: input.eventType,
    level: input.level ?? "info",
    role: input.role ?? null,
    provider: input.provider ?? null,
    model: input.model ?? null,
    channel: input.channel ?? null,
    message: input.message,
    metadata: input.metadata ?? {},
    occurred_at: occurredAt,
  };
}

export async function recordRequestEvents(inputs: RequestEventInput[]) {
  if (inputs.length === 0) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  await admin.from("request_events").upsert(inputs.map(mapRequestEvent), {
    onConflict: "org_id,dedupe_key",
    ignoreDuplicates: false,
  });
}

export async function recordRequestEvent(input: RequestEventInput) {
  await recordRequestEvents([input]);
}

export async function recordSessionActivityEvents(inputs: SessionActivityEventInput[]) {
  if (inputs.length === 0) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  await admin.from("session_activity_events").upsert(inputs.map(mapSessionActivityEvent), {
    onConflict: "org_id,dedupe_key",
    ignoreDuplicates: false,
  });
}

export async function recordSessionActivityEvent(input: SessionActivityEventInput) {
  await recordSessionActivityEvents([input]);
}
export { buildObservabilityDedupeKey, projectSessionUsageLogs };
