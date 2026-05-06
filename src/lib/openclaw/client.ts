import WebSocket from "ws";

import { env, isOpenClawConfigured } from "@/lib/env";
import { getAgentAvatarDataUri, type AgentAvatarConfig } from "@/lib/agent-identity";
import { recordRequestEvent } from "@/lib/observability";
import { buildOpenClawModelAllowlist } from "@/lib/openclaw/model-catalog";
import type { OpenClawGatewaySource, OpenClawRuntimeDescriptor } from "@/lib/openclaw/runtime-types";

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

export type OpenClawConfigSnapshot = {
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

/**
 * The vendored gateway hard-caps control-plane writes (`config.apply`,
 * `config.patch`, `update.run`) at 3 per 60 seconds per actor. When that
 * budget is blown the gateway returns a structured error message with a
 * retry-after hint. We parse it into a typed error so callers can:
 *   1. show a friendly "you've made too many setup changes; try again in Xs"
 *      message instead of a raw RPC name; and
 *   2. respond with HTTP 429 + Retry-After at the API boundary.
 *
 * The real fix is to avoid spending the budget at all (see the idempotency
 * checks in applyModelGovernance and provisionAgent below); this class makes
 * the residual case observable instead of cryptic.
 */
export class RuntimeRateLimitError extends Error {
  readonly method: string;
  readonly retryAfterMs: number;

  constructor(method: string, retryAfterMs: number, message?: string) {
    super(
      message ??
        `Runtime is rate-limited (${method}); please retry in ${Math.ceil(retryAfterMs / 1000)}s`,
    );
    this.name = "RuntimeRateLimitError";
    this.method = method;
    this.retryAfterMs = retryAfterMs;
  }
}

const RATE_LIMIT_MESSAGE_PATTERN = /^rate limit exceeded for ([^;]+);\s*retry after\s+(\d+)s\s*$/i;

export function parseRateLimitError(message: string): RuntimeRateLimitError | null {
  const match = RATE_LIMIT_MESSAGE_PATTERN.exec(message.trim());
  if (!match) return null;
  const method = match[1].trim();
  const retryAfterMs = Number.parseInt(match[2], 10) * 1000;
  if (!Number.isFinite(retryAfterMs) || retryAfterMs < 0) return null;
  return new RuntimeRateLimitError(method, retryAfterMs);
}

function plainObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readAgentsList(snapshot: OpenClawConfigSnapshot | undefined) {
  const agents = plainObject(snapshot?.config?.agents);
  const list = agents?.list;
  return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : [];
}

function readBindingsList(snapshot: OpenClawConfigSnapshot | undefined) {
  const bindings = snapshot?.config?.bindings;
  return Array.isArray(bindings) ? (bindings as Array<Record<string, unknown>>) : [];
}

function buildAgentIdentity(input: { agentId: string; name?: string; avatar?: AgentAvatarConfig }) {
  if (!input.name || (input.avatar?.imagePath && !input.avatar.imageDataUrl)) {
    return undefined;
  }
  return {
    name: input.name,
    avatar: getAgentAvatarDataUri(input.agentId, input.name, input.avatar),
  };
}

function upsertAgentListEntry(
  snapshot: OpenClawConfigSnapshot | undefined,
  input: { agentId: string; workspace?: string; model?: string; name?: string; avatar?: AgentAvatarConfig },
  options?: { fastModeDefault?: boolean; memorySearch?: unknown },
) {
  const identity = buildAgentIdentity(input);
  const nextEntry = {
    ...(readAgentsList(snapshot).find((candidate) => candidate.id === input.agentId) ?? {}),
    id: input.agentId,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(options?.fastModeDefault === undefined ? {} : { fastModeDefault: options.fastModeDefault }),
    ...(options?.memorySearch === undefined ? {} : { memorySearch: options.memorySearch }),
    ...(identity ? { identity } : {}),
  };
  const list = readAgentsList(snapshot).map((entry) => {
    if (entry.id !== input.agentId) return entry;
    return nextEntry;
  });
  return list.some((entry) => entry.id === input.agentId) ? list : [...list, nextEntry];
}

function readAgentDefaults(snapshot: OpenClawConfigSnapshot | undefined) {
  const agents = plainObject(snapshot?.config?.agents);
  return plainObject(agents?.defaults);
}

function readSessionConfig(snapshot: OpenClawConfigSnapshot | undefined) {
  return plainObject(snapshot?.config?.session);
}

function buildDormantMemorySearchConfig() {
  return {
    enabled: false,
    sync: {
      onSessionStart: false,
      onSearch: false,
      watch: false,
    },
  };
}

function memorySearchDormant(config: unknown, options?: { requireExplicit?: boolean }) {
  const memorySearch = plainObject(config);
  if (!memorySearch) {
    return options?.requireExplicit ? false : true;
  }
  if (memorySearch.enabled !== false) return false;
  const sync = plainObject(memorySearch.sync);
  if (!sync) return true;
  return sync.onSessionStart !== true && sync.onSearch !== true && sync.watch !== true;
}

/**
 * Returns true when the snapshot already encodes the desired governance state.
 * We compare the primary model id and the set of approved model ids; the
 * gateway expands `models` into a richer entry list, so an exact deep-equal
 * is too strict and would force a patch on every bootstrap.
 */
export function governanceMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  desired: { defaultModel: string; approvedModels: Array<{ id: string }> },
): boolean {
  const defaults = readAgentDefaults(snapshot);
  if (!defaults) return false;
  if (defaults.skipBootstrap !== true) return false;
  if (defaults.thinkingDefault !== "off") return false;
  if (!memorySearchDormant(defaults.memorySearch, { requireExplicit: true })) return false;
  const model = plainObject(defaults.model);
  if (!model || model.primary !== desired.defaultModel) return false;
  const currentModels = Array.isArray(defaults.models) ? defaults.models : [];
  const currentIds = new Set(
    currentModels
      .map((entry) => {
        const obj = plainObject(entry);
        const id = obj?.id;
        return typeof id === "string" ? id : null;
      })
      .filter((id): id is string => Boolean(id)),
  );
  if (currentIds.size !== desired.approvedModels.length) return false;
  for (const entry of desired.approvedModels) {
    if (!currentIds.has(entry.id)) return false;
  }
  return true;
}

/**
 * Returns true when the snapshot already provisions an agent with the given
 * id, workspace, and model. We deliberately do NOT include identity (name +
 * avatar) in the comparison: identity changes are handled by the dedicated
 * updateAgentIdentity flow, and skipping a same-identity-different-name patch
 * here would silently lose user edits. For the bootstrap flow specifically,
 * if id+workspace+model match, the patch is a no-op against the gateway and
 * not worth burning a control-plane write token on.
 */
export function agentMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  desired: { agentId: string; workspace: string; model: string },
): boolean {
  const list = readAgentsList(snapshot);
  const entry = list.find((candidate) => candidate.id === desired.agentId);
  if (!entry) return false;
  if (entry.workspace !== desired.workspace) return false;
  if (entry.model !== desired.model) return false;
  return true;
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
        skipBootstrap: true,
        thinkingDefault: "off",
        memorySearch: buildDormantMemorySearchConfig(),
      },
    },
  };
}

export function managedBootstrapDefaultsMatchSnapshot(snapshot: OpenClawConfigSnapshot | undefined) {
  const defaults = readAgentDefaults(snapshot);
  const session = readSessionConfig(snapshot);
  return (
    defaults?.skipBootstrap === true &&
    defaults.thinkingDefault === "off" &&
    memorySearchDormant(defaults.memorySearch, { requireExplicit: true }) &&
    session?.routeFallback === "deny"
  );
}

export function agentKnowledgeSearchDormantMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  agentId: string,
) {
  const entry = readAgentsList(snapshot).find((candidate) => candidate.id === agentId);
  return memorySearchDormant(entry?.memorySearch);
}

export function agentFastModeDefaultMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  agentId: string,
) {
  const entry = readAgentsList(snapshot).find((candidate) => candidate.id === agentId);
  return entry?.fastModeDefault === true;
}

export function whatsappAgentBindingMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  input: { agentId: string; accountId: string },
) {
  return channelAgentBindingMatchesSnapshot(snapshot, { ...input, channel: "whatsapp" });
}

export function channelAgentBindingMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  input: { channel: string; agentId: string; accountId: string },
) {
  return readBindingsList(snapshot).some((binding) => {
    if (binding.agentId !== input.agentId) return false;
    const match = plainObject(binding.match);
    return match?.channel === input.channel && match.accountId === input.accountId;
  });
}

function appendAgentChannelBinding(
  snapshot: OpenClawConfigSnapshot | undefined,
  input: { channel: string; agentId: string; accountId: string },
) {
  if (channelAgentBindingMatchesSnapshot(snapshot, input)) {
    return readBindingsList(snapshot);
  }
  return [
    ...readBindingsList(snapshot),
    { agentId: input.agentId, match: { channel: input.channel, accountId: input.accountId } },
  ];
}

export function managedWhatsAppAccountMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  input: { accountId: string },
) {
  const channels = plainObject(snapshot?.config?.channels);
  const whatsapp = plainObject(channels?.whatsapp);
  const accounts = plainObject(whatsapp?.accounts);
  const account = plainObject(accounts?.[input.accountId]);
  return account?.enabled === true && account.dmPolicy === "allowlist";
}

export function buildManagedAgentRuntimeConfigPatch(
  input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig; accountId?: string },
  snapshot?: OpenClawConfigSnapshot,
) {
  const accountId = input.accountId?.trim() || input.agentId;
  const bindings = appendAgentChannelBinding(snapshot, {
    channel: "whatsapp",
    agentId: input.agentId,
    accountId,
  });

  return {
    agents: {
      defaults: {
        skipBootstrap: true,
        thinkingDefault: "off",
        memorySearch: buildDormantMemorySearchConfig(),
      },
      list: upsertAgentListEntry(snapshot, input, {
        fastModeDefault: true,
        memorySearch: buildDormantMemorySearchConfig(),
      }),
    },
    plugins: { entries: { whatsapp: { enabled: true } } },
    channels: { whatsapp: { accounts: { [accountId]: { enabled: true, dmPolicy: "allowlist" } } } },
    session: { routeFallback: "deny" },
    bindings,
  };
}

export function managedAgentRuntimeConfigMatchesSnapshot(
  snapshot: OpenClawConfigSnapshot | undefined,
  desired: { agentId: string; workspace: string; model: string; accountId?: string },
) {
  const accountId = desired.accountId?.trim() || desired.agentId;
  return (
    managedBootstrapDefaultsMatchSnapshot(snapshot) &&
    agentMatchesSnapshot(snapshot, desired) &&
    agentFastModeDefaultMatchesSnapshot(snapshot, desired.agentId) &&
    agentKnowledgeSearchDormantMatchesSnapshot(snapshot, desired.agentId) &&
    whatsappAgentBindingMatchesSnapshot(snapshot, { agentId: desired.agentId, accountId }) &&
    managedWhatsAppAccountMatchesSnapshot(snapshot, { accountId })
  );
}

export class OpenClawClient {
  constructor(
    private readonly runtime?: Pick<OpenClawRuntimeDescriptor, "gatewayUrl" | "gatewayToken">,
    private readonly context?: {
      orgId?: string;
      source?: OpenClawGatewaySource;
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
    const snapshot = await this.getConfigSnapshot(runner);
    return snapshot.hash;
  }

  async getConfigSnapshot(runner?: GatewayRpcRunner) {
    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    return exec<OpenClawConfigSnapshot>("config.get", {});
  }

  /**
   * Poll `agents.list` until `agentId` appears in the gateway's effective agent
   * registry. The bootstrap flow needs this between `config.patch` (which
   * upserts `agents.list` on disk) and `agents.files.set` (which validates
   * against the live runtime cfg). Without it, file writes can race the
   * gateway's reload and reject the agent with `unknown agent id` even though
   * the patch reported success.
   */
  async verifyAgentRegistered(
    input: { agentId: string; timeoutMs?: number; intervalMs?: number },
    runner?: GatewayRpcRunner,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const target = input.agentId.trim().toLowerCase();
    if (!target) {
      return { ok: false, reason: "Agent id required for verification." };
    }
    const timeoutMs = input.timeoutMs ?? 10_000;
    const intervalMs = input.intervalMs ?? 500;
    const deadline = Date.now() + timeoutMs;
    let lastError: string | undefined;
    while (Date.now() < deadline) {
      try {
        const result = await exec<{ agents?: Array<{ id?: string }> }>("agents.list", {});
        const agents = Array.isArray(result?.agents) ? result.agents : [];
        const present = agents.some(
          (entry) => typeof entry?.id === "string" && entry.id.trim().toLowerCase() === target,
        );
        if (present) {
          return { ok: true };
        }
        lastError = "agent not yet visible in gateway registry";
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, Math.min(intervalMs, remaining)));
    }
    return {
      ok: false,
      reason: lastError ?? "agent not registered with gateway in time",
    };
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

  async ensureManagedBootstrapDisabled(
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));
    if (managedBootstrapDefaultsMatchSnapshot(snapshot)) {
      return { changed: false };
    }

    const raw = JSON.stringify({
      agents: {
        defaults: {
          skipBootstrap: true,
          thinkingDefault: "off",
          memorySearch: buildDormantMemorySearchConfig(),
        },
      },
      session: { routeFallback: "deny" },
    });
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async ensureManagedAgentRuntimeConfig(
    input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot; force?: boolean },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));
    if (!options?.force && managedAgentRuntimeConfigMatchesSnapshot(snapshot, input)) {
      return { changed: false };
    }

    const raw = JSON.stringify(buildManagedAgentRuntimeConfigPatch(input, snapshot));
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async ensureWhatsAppAgentBinding(
    input: { agentId: string; accountId?: string },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const accountId = input.accountId?.trim() || input.agentId;
    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));
    if (
      whatsappAgentBindingMatchesSnapshot(snapshot, { agentId: input.agentId, accountId }) &&
      managedWhatsAppAccountMatchesSnapshot(snapshot, { accountId })
    ) {
      return { changed: false };
    }

    const raw = JSON.stringify({
      plugins: { entries: { whatsapp: { enabled: true } } },
      channels: { whatsapp: { accounts: { [accountId]: { enabled: true, dmPolicy: "allowlist" } } } },
      bindings: appendAgentChannelBinding(snapshot, { channel: "whatsapp", agentId: input.agentId, accountId }),
    });
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async provisionAgent(
    input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot; force?: boolean },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));

    // Skip the control-plane write entirely when the gateway already encodes
    // the requested agent. This prevents bootstrap retries from chewing
    // through the gateway's 3-per-60s `config.patch` budget on no-op patches.
    if (!options?.force && agentMatchesSnapshot(snapshot, input)) {
      return { changed: false };
    }

    const raw = JSON.stringify({
      agents: {
        list: upsertAgentListEntry(snapshot, input),
      },
    });

    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async updateAgentModel(
    input: { agentId: string; workspace: string; model: string; name?: string; avatar?: AgentAvatarConfig },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    return this.provisionAgent(input, runner, options);
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
                onSessionStart: false,
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

  /**
   * Platform-owned safe variant of memorySearch governance. The agent itself
   * is never allowed to call this (the gateway protects the relevant config
   * paths). SaintAGI calls it during context injection so memory search is
   * enabled when there is anything to retrieve, but synchronous sync hooks
   * are kept off so they cannot stretch the user-visible chat turn.
   *
   * Synchronous sync paths (`onSessionStart`, `onSearch`, `watch`) are
   * deliberately disabled here. Document indexing happens via the platform's
   * own background pipelines instead of being attached to the agent's
   * critical chat path.
   */
  async configureAgentSafeKnowledgeSearch(
    input: {
      agentId: string;
      extraPaths: string[];
      provider?: "openai" | "gemini" | "voyage" | "mistral" | "ollama";
      model?: string;
    },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));

    const desired = {
      enabled: true,
      provider: input.provider ?? "openai",
      model: input.model ?? "text-embedding-3-small",
      extraPaths: [...new Set(input.extraPaths.map((path) => path.trim()).filter(Boolean))],
      sync: {
        onSessionStart: false,
        onSearch: false,
        watch: false,
      },
    };

    const entry = readAgentsList(snapshot).find((candidate) => candidate.id === input.agentId);
    const current = plainObject(entry?.memorySearch);
    const currentSync = plainObject(current?.sync);
    const currentExtra = Array.isArray(current?.extraPaths)
      ? (current?.extraPaths as unknown[]).filter((value): value is string => typeof value === "string")
      : [];
    const currentSet = new Set(currentExtra);
    const desiredSet = new Set(desired.extraPaths);
    const sameExtra =
      currentSet.size === desiredSet.size && [...desiredSet].every((value) => currentSet.has(value));

    if (
      current?.enabled === true &&
      current?.provider === desired.provider &&
      current?.model === desired.model &&
      currentSync?.onSessionStart === false &&
      currentSync?.onSearch === false &&
      currentSync?.watch === false &&
      sameExtra
    ) {
      return { changed: false };
    }

    const raw = JSON.stringify({
      agents: {
        list: [
          {
            id: input.agentId,
            memorySearch: {
              enabled: desired.enabled,
              provider: desired.provider,
              model: desired.model,
              extraPaths: desired.extraPaths,
              store: {
                vector: {
                  enabled: true,
                },
              },
              sync: desired.sync,
            },
          },
        ],
      },
    });
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async disableAgentKnowledgeSearch(
    input: { agentId: string },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));
    if (agentKnowledgeSearchDormantMatchesSnapshot(snapshot, input.agentId)) {
      return { changed: false };
    }

    const raw = JSON.stringify({
      agents: {
        list: [
          {
            id: input.agentId,
            memorySearch: buildDormantMemorySearchConfig(),
          },
        ],
      },
    });
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async applyModelGovernance(
    input: {
      defaultModel: string;
      approvedModels: Array<{ id: string; label?: string }>;
    },
    runner?: GatewayRpcRunner,
    options?: { currentSnapshot?: OpenClawConfigSnapshot },
  ): Promise<{ changed: boolean }> {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = options?.currentSnapshot ?? (await this.getConfigSnapshot(exec));

    // Governance is the model allowlist + primary model. It rarely changes
    // between bootstrap attempts, so checking the snapshot first lets us skip
    // a `config.patch` that would otherwise burn one of the gateway's three
    // 60-second control-plane write tokens for nothing.
    if (governanceMatchesSnapshot(snapshot, input)) {
      return { changed: false };
    }

    const raw = JSON.stringify(buildModelGovernancePatch(input));
    await exec("config.patch", { raw, baseHash: snapshot.hash });
    return { changed: true };
  }

  async connectTelegram(input: { agentId: string; botToken: string }, runner?: GatewayRpcRunner) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = await this.getConfigSnapshot(exec);
    const accountId = input.agentId;
    const raw = JSON.stringify({
      plugins: { entries: { telegram: { enabled: true } } },
      channels: { telegram: { accounts: { [accountId]: { enabled: true, botToken: input.botToken } } } },
      bindings: appendAgentChannelBinding(snapshot, { channel: "telegram", agentId: input.agentId, accountId }),
    });

    return exec("config.patch", { raw, baseHash: snapshot.hash });
  }

  async connectSlack(input: { agentId: string; teamId: string }, runner?: GatewayRpcRunner) {
    if (!isOpenClawConfigured()) {
      throw new Error("Runtime gateway is not configured.");
    }

    const exec: GatewayRpcRunner = runner ?? ((method, params) => this.call(method, params));
    const snapshot = await this.getConfigSnapshot(exec);
    const raw = JSON.stringify({
      plugins: { entries: { slack: { enabled: true } } },
      bindings: appendAgentChannelBinding(snapshot, {
        channel: "slack",
        agentId: input.agentId,
        accountId: input.teamId,
      }),
    });

    return exec("config.patch", { raw, baseHash: snapshot.hash });
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
        const rateLimit = parseRateLimitError(message);
        entry.reject(rateLimit ?? new Error(message));
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
