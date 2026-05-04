import WebSocket from "ws";

import { env, isOpenClawConfigured } from "@/lib/env";
import { getAgentAvatarDataUri, type AgentAvatarConfig } from "@/lib/agent-identity";
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

const OPERATOR_SCOPES = ["operator.read", "operator.write", "operator.admin"] as const;
const LEGACY_OPERATOR_SCOPES = ["operator:read", "operator:write", "operator:admin"] as const;

// Connect handshake: WSS handshake plus connect frame round-trip. Hosted gateways
// (e.g. Railway) can take several seconds when the dyno is cold.
const GATEWAY_CONNECT_TIMEOUT_MS = 20_000;
// Per-RPC response timeout once the session is established. The previous 10s
// budget covered the entire socket lifecycle, which made bootstrap (4 sequential
// RPCs each opening their own socket) easy to push past the limit.
const GATEWAY_RPC_TIMEOUT_MS = 25_000;

export type GatewayRpcRunner = <T = unknown>(
  method: string,
  params: Record<string, unknown>,
) => Promise<T>;

export function shouldRetryWithLegacyOperatorScopes(errorMessage: string) {
  return /\bmissing scope:\s*operator:/i.test(errorMessage);
}

export function buildModelGovernancePatch(input: {
  defaultModel: string;
  approvedModels: Array<{ id: string; label?: string }>;
}) {
  const models = buildOpenClawModelAllowlist(
    input.approvedModels.map((entry) => ({
      id: entry.id,
      label: entry.label ?? entry.id,
      provider: "openrouter",
      source: "policy",
    })),
  );

  return {
    agents: {
      defaults: {
        model: { primary: input.defaultModel },
        models,
      },
    },
  };
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

  private async getConfigHash(runner?: GatewayRpcRunner): Promise<string> {
    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const result = await exec<{ hash: string }>("config.get", {});
    return result.hash;
  }

  async getConfigSnapshot() {
    return this.call<OpenClawConfigSnapshot>("config.get", {});
  }

  async ensureControlUiAllowedOrigins(origins: string[]) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
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

  async provisionAgent(
    input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig },
    runner?: GatewayRpcRunner,
  ) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const baseHash = await this.getConfigHash(exec);
    const raw = JSON.stringify({
      agents: {
        list: [
          {
            id: input.agentId,
            workspace: input.workspace,
            model: input.model,
            identity: input.name && (!input.avatar?.imagePath || input.avatar.imageDataUrl)
              ? {
                  name: input.name,
                  avatar: getAgentAvatarDataUri(input.agentId, input.name, input.avatar),
                }
              : undefined,
          },
        ],
      },
    });

    return exec("config.patch", { raw, baseHash });
  }

  async updateAgentModel(
    input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig },
    runner?: GatewayRpcRunner,
  ) {
    return this.provisionAgent(input, runner);
  }

  async updateAgentIdentity(input: { agentId: string; name: string; avatar?: AgentAvatarConfig }) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const baseHash = await this.getConfigHash();
    const raw = JSON.stringify({
      agents: {
        list: [
          {
            id: input.agentId,
            identity: {
              name: input.name,
              avatar: getAgentAvatarDataUri(input.agentId, input.name, input.avatar),
            },
          },
        ],
      },
    });

    return this.call("config.patch", { raw, baseHash });
  }

  async deleteAgent(input: { agentId: string; deleteFiles?: boolean }) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    return this.call<{ ok: true; agentId: string; removedBindings?: number }>("agents.delete", {
      agentId: input.agentId,
      deleteFiles: input.deleteFiles ?? true,
    });
  }

  async setAgentFile(input: { agentId: string; name: string; content: string }) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
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
      throw new Error("Runtime gateway is not configured.");
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

  async applyModelGovernance(
    input: {
      defaultModel: string;
      approvedModels: Array<{ id: string; label?: string }>;
    },
    runner?: GatewayRpcRunner,
  ) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const baseHash = await this.getConfigHash(exec);
    const raw = JSON.stringify(buildModelGovernancePatch(input));

    return exec("config.patch", { raw, baseHash });
  }

  async connectTelegram(input: { agentId: string; botToken: string }, runner?: GatewayRpcRunner) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const baseHash = await this.getConfigHash(exec);
    const raw = JSON.stringify({
      channels: { telegram: { botToken: input.botToken } },
      bindings: [{ agentId: input.agentId, match: { channel: "telegram", accountId: "default" } }],
    });

    return exec("config.patch", { raw, baseHash });
  }

  async connectSlack(input: { agentId: string; teamId: string }, runner?: GatewayRpcRunner) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const baseHash = await this.getConfigHash(exec);
    const raw = JSON.stringify({
      bindings: [{ agentId: input.agentId, match: { channel: "slack", accountId: input.teamId } }],
    });

    return exec("config.patch", { raw, baseHash });
  }

  async listModels() {
    return this.call<{ models: OpenClawGatewayModel[] }>("models.list", {});
  }

  async patchSession(input: { key: string; model: string }, runner?: GatewayRpcRunner) {
    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    return exec<{
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
    return this.withSession((rpc) => rpc<T>(method, params));
  }

  /**
   * Open a single WebSocket session to the runtime gateway and run the supplied
   * callback against it. All RPC calls made through the provided `call` runner
   * share the same socket, which avoids the per-call TLS + connect handshake
   * overhead that otherwise turns a 4-step bootstrap into 4 cold WSS
   * round-trips against hosted gateways like Railway.
   *
   * The session also handles the operator scope fallback: if the gateway
   * rejects the modern dot-namespaced scopes, we transparently retry the entire
   * session with the legacy colon-namespaced scopes. Callers should write the
   * session body so it can run twice safely (config.patch is idempotent on
   * unchanged payloads, which covers the common provisioning flows).
   */
  async withSession<T>(fn: (call: GatewayRpcRunner) => Promise<T>): Promise<T> {
    try {
      return await this.openSession(OPERATOR_SCOPES, fn);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!shouldRetryWithLegacyOperatorScopes(message)) {
        throw error;
      }
      return this.openSession(LEGACY_OPERATOR_SCOPES, fn);
    }
  }

  private async openSession<T>(
    scopes: readonly string[],
    fn: (call: GatewayRpcRunner) => Promise<T>,
  ): Promise<T> {
    const gatewayUrl = this.runtime?.gatewayUrl || env.openClawGatewayUrl;
    const token = this.runtime?.gatewayToken || env.openClawGatewayToken;

    if (!gatewayUrl) {
      throw new Error("Runtime gateway URL is not configured.");
    }

    type Pending = {
      method: string;
      params: Record<string, unknown>;
      requestId: string;
      startedAt: number;
      timer: ReturnType<typeof setTimeout>;
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    };

    const socket = new WebSocket(gatewayUrl);
    const pending = new Map<string, Pending>();
    let connected = false;
    let connectResolve: (() => void) | null = null;
    let connectReject: ((error: Error) => void) | null = null;
    let sessionError: Error | null = null;
    let socketClosed = false;

    const closeSocket = () => {
      if (socketClosed) return;
      socketClosed = true;
      try {
        socket.close();
      } catch {
        // Closing an already-closed socket is fine; the close handler covers cleanup.
      }
    };

    const failSession = (error: Error) => {
      if (!sessionError) {
        sessionError = error;
      }
      const reason = sessionError;
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        this.observeGatewayCall({
          requestId: entry.requestId,
          method: entry.method,
          params: entry.params,
          status: "failed",
          latencyMs: Date.now() - entry.startedAt,
          errorMessage: reason.message,
        });
        entry.reject(reason);
      }
      pending.clear();
      if (connectReject) {
        const reject = connectReject;
        connectReject = null;
        connectResolve = null;
        reject(reason);
      }
      closeSocket();
    };

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
          scopes,
          auth: token ? { token } : undefined,
        },
      };

      try {
        socket.send(JSON.stringify(connectFrame));
      } catch (sendError) {
        failSession(sendError instanceof Error ? sendError : new Error(String(sendError)));
      }
    });

    socket.on("message", (rawMessage) => {
      let frame: OpenClawFrame;
      try {
        frame = JSON.parse(rawMessage.toString()) as OpenClawFrame;
      } catch (parseError) {
        failSession(parseError instanceof Error ? parseError : new Error("Invalid gateway frame"));
        return;
      }

      if (frame.type === "event") {
        return;
      }

      if (!connected) {
        if (frame.type !== "res") return;
        if (!frame.ok) {
          const message =
            (frame as OpenClawFrame & { error?: { message: string } }).error?.message ||
            "Runtime connect failed";
          failSession(new Error(message));
          return;
        }
        connected = true;
        if (connectResolve) {
          const resolve = connectResolve;
          connectResolve = null;
          connectReject = null;
          resolve();
        }
        return;
      }

      if (frame.type !== "res") return;
      const entry = pending.get(frame.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(frame.id);

      if (frame.ok) {
        this.observeGatewayCall({
          requestId: entry.requestId,
          method: entry.method,
          params: entry.params,
          status: "completed",
          latencyMs: Date.now() - entry.startedAt,
        });
        entry.resolve(frame.payload ?? {});
      } else {
        const message = frame.error?.message || "Runtime request failed.";
        this.observeGatewayCall({
          requestId: entry.requestId,
          method: entry.method,
          params: entry.params,
          status: "failed",
          latencyMs: Date.now() - entry.startedAt,
          errorMessage: message,
        });
        entry.reject(new Error(message));
      }
    });

    socket.on("error", (error) => {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      failSession(wrapped);
    });

    socket.on("close", () => {
      socketClosed = true;
      if (sessionError) return;
      if (!connected || pending.size > 0) {
        failSession(new Error("Runtime gateway connection closed unexpectedly."));
      }
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const connectTimer = setTimeout(() => {
          failSession(new Error("Runtime gateway timeout"));
        }, GATEWAY_CONNECT_TIMEOUT_MS);

        connectResolve = () => {
          clearTimeout(connectTimer);
          resolve();
        };
        connectReject = (error) => {
          clearTimeout(connectTimer);
          reject(error);
        };
      });

      const call: GatewayRpcRunner = <TPayload = unknown>(
        method: string,
        params: Record<string, unknown>,
      ) => {
        if (sessionError) {
          return Promise.reject(sessionError);
        }

        return new Promise<TPayload>((resolve, reject) => {
          const requestId = randomId();
          const startedAt = Date.now();
          const timer = setTimeout(() => {
            const entry = pending.get(requestId);
            if (!entry) return;
            pending.delete(requestId);
            this.observeGatewayCall({
              requestId,
              method,
              params,
              status: "failed",
              latencyMs: Date.now() - startedAt,
              errorMessage: "Runtime gateway timeout",
            });
            entry.reject(new Error("Runtime gateway timeout"));
          }, GATEWAY_RPC_TIMEOUT_MS);

          pending.set(requestId, {
            method,
            params,
            requestId,
            startedAt,
            timer,
            resolve: resolve as (value: unknown) => void,
            reject,
          });

          try {
            socket.send(
              JSON.stringify({ type: "req", id: requestId, method, params } satisfies OpenClawFrame),
            );
          } catch (sendError) {
            clearTimeout(timer);
            pending.delete(requestId);
            const wrapped = sendError instanceof Error ? sendError : new Error(String(sendError));
            this.observeGatewayCall({
              requestId,
              method,
              params,
              status: "failed",
              latencyMs: Date.now() - startedAt,
              errorMessage: wrapped.message,
            });
            reject(wrapped);
          }
        });
      };

      return await fn(call);
    } finally {
      closeSocket();
    }
  }
}
