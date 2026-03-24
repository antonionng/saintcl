import { createHash } from "node:crypto";

import type { OpenClawSessionUsageLogEntry } from "./openclaw/client";

function stableHash(input: string) {
  return createHash("sha1").update(input).digest("hex");
}

export function buildObservabilityDedupeKey(parts: Array<string | number | null | undefined>) {
  return stableHash(
    parts
      .filter((part) => part != null && part !== "")
      .map((part) => String(part))
      .join("|"),
  );
}

export function projectSessionUsageLogs(input: {
  orgId: string;
  session: {
    key: string;
    agentId?: string;
    modelProvider?: string;
    model?: string;
    channel?: string;
  };
  agentId?: string | null;
  actorUserId?: string | null;
  logs: OpenClawSessionUsageLogEntry[];
}) {
  const requestEvents = [];
  const activityEvents = [];

  for (const entry of input.logs) {
    const contentHash = stableHash(entry.content);
    const occurredAt = new Date(entry.timestamp).toISOString();
    const dedupeKey = buildObservabilityDedupeKey([
      input.session.key,
      entry.role,
      entry.timestamp,
      contentHash,
    ]);

    activityEvents.push({
      orgId: input.orgId,
      agentId: input.agentId,
      actorUserId: input.actorUserId,
      sessionKey: input.session.key,
      source: "session_usage_logs",
      eventType: `session.${entry.role}`,
      level: "info",
      role: entry.role,
      provider: input.session.modelProvider ?? null,
      model: input.session.model ?? null,
      channel: input.session.channel ?? null,
      message: entry.content,
      dedupeKey,
      occurredAt,
      metadata: {
        tokens: entry.tokens ?? null,
        cost: entry.cost ?? null,
      },
    });

    if (entry.role !== "assistant") {
      continue;
    }

    requestEvents.push({
      orgId: input.orgId,
      agentId: input.agentId,
      actorUserId: input.actorUserId,
      sessionKey: input.session.key,
      source: "session_usage_logs",
      eventType: "request.completed",
      requestId: dedupeKey,
      provider: input.session.modelProvider ?? null,
      model: input.session.model ?? null,
      channel: input.session.channel ?? null,
      status: "completed",
      totalTokens: entry.tokens ?? null,
      costUsd: entry.cost ?? null,
      dedupeKey,
      occurredAt,
      metadata: {
        role: entry.role,
        contentHash,
      },
    });
  }

  return {
    requestEvents,
    activityEvents,
  };
}
