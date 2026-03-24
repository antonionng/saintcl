import WebSocket from "ws";

import { env, isOpenClawConfigured } from "@/lib/env";
import { recordRequestEvent } from "@/lib/observability";
import { buildOpenClawModelAllowlist } from "@/lib/openclaw/model-catalog";
import type { OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

type OpenClawFrame<T = unknown> =
  | { type: "req"; id: string; method: string; params: Record<string, unknown> }
  | { type: "res"; id: string; ok: boolean; payload?: T; error?: { message: string } }
  | { type: "event"; event: string; payload?: T };

export type OpenClawGatewayModel = {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
};

export type OpenClawSessionUsageEntry = {
  key: string;
  sessionId: string;
  agentId?: string;
  channel?: string;
  modelProvider?: string;
  model?: string;
  usage?: {
    totalTokens?: number;
    totalCost?: number;
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
};

export type OpenClawSessionUsageLogEntry = {
  timestamp: number;
  role: "user" | "assistant" | "tool" | "toolResult";
  content: string;
  tokens?: number;
  cost?: number;
};

export type OpenClawSessionUsageTimePoint = {
  timestamp: number;
  tokens: number;
  cost: number;
  messages?: number;
  toolCalls?: number;
  errors?: number;
};

export type OpenClawSessionUsageTimeSeries = {
  key: string;
  totals?: {
    totalTokens?: number;
    totalCost?: number;
  };
  points: OpenClawSessionUsageTimePoint[];
};

function formatUsageDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type OpenClawConfigSnapshot = {
  hash: string;
  config?: Record<string, unknown>;
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export class OpenClawClient {
  constructor(
    private readonly runtime?: Pick<OpenClawRuntimeDescriptor, "gatewayUrl" | "gatewayToken">,
    private readonly context?: {
      orgId?: string;
      source?: "env" | "runtime";
    },
  ) {}

  private observeGatewayCall(input: {
    requestId: string;
    method: string;
    params: Record<string, unknown>;
    status: "completed" | "failed";
    latencyMs: number;
    errorMessage?: string;
  }) {
    if (!this.context?.orgId) {
      return;
    }

    const sessionKey =
      typeof input.params.key === "string"
        ? input.params.key
        : typeof input.params.sessionKey === "string"
          ? input.params.sessionKey
          : null;
    const model = typeof input.params.model === "string" ? input.params.model : null;

    void recordRequestEvent({
      orgId: this.context.orgId,
      sessionKey,
      requestId: input.requestId,
      source: "gateway_rpc",
      eventType: `rpc.${input.method}`,
      method: input.method,
      model,
      status: input.status,
      latencyMs: input.latencyMs,
      errorMessage: input.errorMessage,
      metadata: {
        runtimeSource: this.context.source ?? "env",
      },
    }).catch(() => null);
  }

  async health() {
    if (!isOpenClawConfigured()) {
      return { ok: true, mode: "mock", gateway: "unconfigured" };
    }

    if (!this.runtime?.gatewayUrl && !env.openClawGatewayUrl) {
      return { ok: true, mode: "managed", gateway: "runtime-resolved-on-demand" };
    }

    return this.call("health", {});
  }

  private async getConfigHash(): Promise<string> {
    const result = await this.call<{ hash: string }>("config.get", {});
    return result.hash;
  }

  async getConfigSnapshot() {
    return this.call<OpenClawConfigSnapshot>("config.get", {});
  }

  async ensureControlUiAllowedOrigins(origins: string[]) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const snapshot = await this.getConfigSnapshot();
    const config = snapshot.config ?? {};
    const gateway =
      config.gateway && typeof config.gateway === "object" && !Array.isArray(config.gateway)
        ? (config.gateway as Record<string, unknown>)
        : {};
    const controlUi =
      gateway.controlUi && typeof gateway.controlUi === "object" && !Array.isArray(gateway.controlUi)
        ? (gateway.controlUi as Record<string, unknown>)
        : {};
    const currentOrigins = Array.isArray(controlUi.allowedOrigins)
      ? controlUi.allowedOrigins.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    const mergedOrigins = [...new Set([...currentOrigins, ...origins.map((value) => value.trim()).filter(Boolean)])];
    if (mergedOrigins.length === currentOrigins.length) {
      return { changed: false, allowedOrigins: currentOrigins };
    }

    const raw = JSON.stringify({
      gateway: {
        controlUi: {
          allowedOrigins: mergedOrigins,
        },
      },
    });

    await this.call("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true, allowedOrigins: mergedOrigins };
  }

  async ensureEmbeddedControlUiAccess(origins: string[]) {
    const result = await this.ensureControlUiAllowedOrigins(origins);
    return {
      ...result,
      dangerouslyDisableDeviceAuth: false,
    };
  }

  async provisionAgent(input: { agentId: string; workspace: string; model: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      agents: {
        list: [{ id: input.agentId, workspace: input.workspace, model: input.model }],
      },
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async updateAgentModel(input: { agentId: string; workspace: string; model: string }) {
    return this.provisionAgent(input);
  }

  async deleteAgent(input: { agentId: string; deleteFiles?: boolean }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    return this.call<{ ok: true; agentId: string; removedBindings?: number }>("agents.delete", {
      agentId: input.agentId,
      deleteFiles: input.deleteFiles ?? true,
    });
  }

  async setAgentFile(input: { agentId: string; name: string; content: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    return this.call("agents.files.set", {
      agentId: input.agentId,
      name: input.name,
      content: input.content,
    });
  }

  async configureAgentKnowledgeSearch(input: {
    agentId: string;
    extraPaths: string[];
    provider?: "openai" | "gemini" | "voyage" | "mistral" | "ollama";
    model?: string;
  }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      agents: {
        list: [
          {
            id: input.agentId,
            memorySearch: {
              enabled: true,
              provider: input.provider ?? "openai",
              model: input.model ?? "text-embedding-3-small",
              extraPaths: input.extraPaths,
              store: {
                vector: {
                  enabled: true,
                },
              },
              sync: {
                onSearch: true,
                watch: true,
              },
            },
          },
        ],
      },
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async applyModelGovernance(input: {
    defaultModel: string;
    approvedModels: Array<{ id: string; label?: string }>;
  }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const models = buildOpenClawModelAllowlist(
      input.approvedModels.map((entry) => ({
        id: entry.id,
        label: entry.label ?? entry.id,
        provider: "openrouter",
        source: "policy",
      })),
    );
    const raw = JSON.stringify({
      agent: {
        model: input.defaultModel,
      },
      agents: {
        defaults: {
          model: { primary: input.defaultModel },
          models,
        },
      },
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async connectTelegram(input: { agentId: string; botToken: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      channels: { telegram: { botToken: input.botToken } },
      bindings: [{ agentId: input.agentId, match: { channel: "telegram", accountId: "default" } }],
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async connectSlack(input: { agentId: string; teamId: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("OpenClaw gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      bindings: [{ agentId: input.agentId, match: { channel: "slack", accountId: input.teamId } }],
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async listModels() {
    return this.call<{ models: OpenClawGatewayModel[] }>("models.list", {});
  }

  async patchSession(input: { key: string; model: string }) {
    return this.call<{
      ok: true;
      key: string;
      resolved?: { modelProvider?: string; model?: string };
    }>("sessions.patch", input);
  }

  async getSessionsUsage(input: {
    days?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    key?: string;
    includeContextWeight?: boolean;
  }) {
    const params: Record<string, unknown> = {
      limit: input.limit,
      key: input.key,
      includeContextWeight: input.includeContextWeight,
    };

    if (input.startDate || input.endDate) {
      params.startDate = input.startDate;
      params.endDate = input.endDate;
    } else if (typeof input.days === "number" && Number.isFinite(input.days)) {
      const endDate = new Date();
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      params.startDate = formatUsageDate(startDate);
      params.endDate = formatUsageDate(endDate);
    }

    return this.call<{
      updatedAt: number;
      sessions: OpenClawSessionUsageEntry[];
      totals?: { totalCost?: number; totalTokens?: number };
    }>("sessions.usage", params);
  }

  async getSessionUsageLogs(input: { key: string; limit?: number }) {
    return this.call<{ logs: OpenClawSessionUsageLogEntry[] }>("sessions.usage.logs", input);
  }

  async getSessionUsageTimeSeries(input: { key: string }) {
    return this.call<OpenClawSessionUsageTimeSeries>("sessions.usage.timeseries", input);
  }

  async call<T = unknown>(method: string, params: Record<string, unknown>) {
    const gatewayUrl = this.runtime?.gatewayUrl || env.openClawGatewayUrl;
    const token = this.runtime?.gatewayToken || env.openClawGatewayToken;

    if (!gatewayUrl) {
      throw new Error("OpenClaw gateway URL is not configured.");
    }

    const requestId = randomId();
    const startedAt = Date.now();

    return new Promise<T>((resolve, reject) => {
      const socket = new WebSocket(gatewayUrl);
      const timeout = setTimeout(() => {
        socket.close();
        this.observeGatewayCall({
          requestId,
          method,
          params,
          status: "failed",
          latencyMs: Date.now() - startedAt,
          errorMessage: "OpenClaw gateway timeout",
        });
        reject(new Error("OpenClaw gateway timeout"));
      }, 10000);

      let connected = false;

      socket.on("open", () => {
        const connectFrame: OpenClawFrame = {
          type: "req",
          id: randomId(),
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: "gateway-client", version: "0.1.0", platform: "macos", mode: "backend" },
            role: "operator",
            scopes: ["operator.read", "operator.write", "operator.admin"],
            auth: token ? { token } : undefined,
          },
        };

        socket.send(JSON.stringify(connectFrame));
      });

      socket.on("message", (rawMessage) => {
        const frame = JSON.parse(rawMessage.toString()) as OpenClawFrame<T>;

        if (frame.type === "event") {
          return;
        }

        if (!connected && frame.type === "res") {
          if (!frame.ok) {
            clearTimeout(timeout);
            socket.close();
            const message =
              (frame as OpenClawFrame & { error?: { message: string } }).error?.message || "OpenClaw connect failed";
            this.observeGatewayCall({
              requestId,
              method,
              params,
              status: "failed",
              latencyMs: Date.now() - startedAt,
              errorMessage: message,
            });
            reject(new Error(message));
            return;
          }
          connected = true;
          const requestFrame: OpenClawFrame = {
            type: "req",
            id: requestId,
            method,
            params,
          };
          socket.send(JSON.stringify(requestFrame));
          return;
        }

        if (frame.type === "res" && frame.id === requestId) {
          clearTimeout(timeout);
          socket.close();
          if (frame.ok) {
            this.observeGatewayCall({
              requestId,
              method,
              params,
              status: "completed",
              latencyMs: Date.now() - startedAt,
            });
            resolve((frame.payload ?? {}) as T);
          } else {
            const message = frame.error?.message || "OpenClaw request failed.";
            this.observeGatewayCall({
              requestId,
              method,
              params,
              status: "failed",
              latencyMs: Date.now() - startedAt,
              errorMessage: message,
            });
            reject(new Error(message));
          }
        }
      });

      socket.on("error", (error) => {
        clearTimeout(timeout);
        this.observeGatewayCall({
          requestId,
          method,
          params,
          status: "failed",
          latencyMs: Date.now() - startedAt,
          errorMessage: error.message,
        });
        reject(error);
      });
    });
  }
}
