import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const HOSTED_CHANNEL_IDS = [
  "telegram",
  "whatsapp",
  "discord",
  "slack",
  "googlechat",
  "matrix",
  "nostr",
];
// When OPENCLAW_BOOTSTRAP_CHANNELS is unset, enable this allowlist so OpenClaw Control
// UI can expose native channel flows (QR login, status, config) without Railway env
// twiddling. Set OPENCLAW_BOOTSTRAP_CHANNELS=none to keep all bundled chat plugins
// off (previous empty-default behavior). Override with a comma list to widen or
// narrow the set.
const DEFAULT_BOOTSTRAP_CHANNELS = ["whatsapp", "telegram", "slack"];

async function fileExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function removeIfPresent(targetPath) {
  try {
    await rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`[gateway] failed to remove ${targetPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function reclaimGeneratedStateSpace(stateDir) {
  await Promise.all([
    removeIfPresent(path.join(stateDir, "plugin-runtime-deps")),
    removeIfPresent(path.join(stateDir, "logs")),
    removeIfPresent(path.join(stateDir, "tmp")),
  ]);
}

async function writeConfigWithSpaceRetry(configPath, stateDir, config) {
  const payload = `${JSON.stringify(config, null, 2)}\n`;
  try {
    await writeFile(configPath, payload, "utf8");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOSPC")) {
      throw error;
    }
    console.warn("[gateway] config write hit ENOSPC; clearing generated cache and retrying once.");
    await reclaimGeneratedStateSpace(stateDir);
    await writeFile(configPath, payload, "utf8");
  }
}

function parseAllowedOrigins(rawValue) {
  if (!rawValue?.trim()) {
    return [];
  }

  const trimmed = rawValue.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((value) => typeof value === "string" && value.trim().length > 0);
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeOrigin(domainOrUrl) {
  if (!domainOrUrl) return null;
  if (domainOrUrl.startsWith("http://") || domainOrUrl.startsWith("https://")) {
    return domainOrUrl;
  }
  return `https://${domainOrUrl}`;
}

function parseBootstrapChannels(rawValue) {
  if (!rawValue?.trim()) {
    return [...DEFAULT_BOOTSTRAP_CHANNELS];
  }

  const trimmed = rawValue.trim();
  if (trimmed.toLowerCase() === "none") {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
      }
    } catch {
      return [...DEFAULT_BOOTSTRAP_CHANNELS];
    }
  }

  return [
    ...new Set(
      trimmed
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function mergeConfig(existingConfig, options) {
  const config = existingConfig && typeof existingConfig === "object" ? existingConfig : {};
  const gateway =
    config.gateway && typeof config.gateway === "object" && !Array.isArray(config.gateway)
      ? { ...config.gateway }
      : {};
  const controlUi =
    gateway.controlUi && typeof gateway.controlUi === "object" && !Array.isArray(gateway.controlUi)
      ? { ...gateway.controlUi }
      : {};
  const agents =
    config.agents && typeof config.agents === "object" && !Array.isArray(config.agents)
      ? { ...config.agents }
      : {};
  const channels =
    config.channels && typeof config.channels === "object" && !Array.isArray(config.channels)
      ? { ...config.channels }
      : {};
  const plugins =
    config.plugins && typeof config.plugins === "object" && !Array.isArray(config.plugins)
      ? { ...config.plugins }
      : {};
  const pluginEntries =
    plugins.entries && typeof plugins.entries === "object" && !Array.isArray(plugins.entries)
      ? { ...plugins.entries }
      : {};
  const pluginAllow = Array.isArray(plugins.allow) ? [...plugins.allow] : null;
  const existingDefaults =
    agents.defaults && typeof agents.defaults === "object" && !Array.isArray(agents.defaults)
      ? { ...agents.defaults }
      : {};
  const legacyAgent =
    config.agent && typeof config.agent === "object" && !Array.isArray(config.agent)
      ? { ...config.agent }
      : {};
  const defaults = { ...legacyAgent, ...existingDefaults };
  const models =
    defaults.models && typeof defaults.models === "object" && !Array.isArray(defaults.models)
      ? { ...defaults.models }
      : {};

  gateway.mode = gateway.mode || "local";
  defaults.workspace = defaults.workspace || options.workspaceDir;

  // Behind Railway's edge proxy the gateway sees X-Forwarded-* from a private
  // Railway IP. Without trustedProxies the gateway logs
  // `[ws] Proxy headers detected from untrusted address` and refuses to treat
  // the connection as local, which breaks pairing/CORS code paths. We always
  // ensure these CIDRs are present (loopback, RFC1918, RFC 6598 CGNAT, ULA).
  // CGNAT covers Railway's internal proxy network; without it the warning
  // still fires even when trustedProxies is otherwise populated. Operators
  // can add their own entries on top — we merge in, never clobber.
  const requiredTrustedProxyCidrs = [
    "127.0.0.1/32",
    "::1/128",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "100.64.0.0/10",
    "fd00::/8",
  ];
  const existingTrustedProxies = Array.isArray(gateway.trustedProxies)
    ? gateway.trustedProxies.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [];
  const mergedTrustedProxies = [...existingTrustedProxies];
  for (const cidr of requiredTrustedProxyCidrs) {
    if (!mergedTrustedProxies.includes(cidr)) {
      mergedTrustedProxies.push(cidr);
    }
  }
  gateway.trustedProxies = mergedTrustedProxies;

  const currentModel =
    defaults.model && typeof defaults.model === "object" && !Array.isArray(defaults.model)
      ? { ...defaults.model }
      : {};
  if (typeof defaults.model === "string" && !currentModel.primary) {
    currentModel.primary = defaults.model;
  }
  if (options.defaultModel) {
    currentModel.primary = options.defaultModel;
  }
  if (!Array.isArray(currentModel.fallbacks)) {
    currentModel.fallbacks = [];
  }
  if (currentModel.primary && !models[currentModel.primary]) {
    models[currentModel.primary] = {};
  }
  defaults.model = currentModel;
  defaults.models = models;
  // ---- Real Chat Latency profile -----------------------------------------
  // The settings below collectively form the "low-latency text turn" profile
  // for hosted SaintAGI tenants: the gateway never pays for thinking, never
  // pre-runs memory bootstrap, runs the model in fastMode, ships only a small
  // chat history default, and lets multiple WebChat turns run in parallel.
  // No setting here is required for correctness; each one trades a feature
  // we do not need on cold/short text turns for measurable latency.
  // ------------------------------------------------------------------------
  defaults.skipBootstrap = true;
  defaults.thinkingDefault = "off";
  delete defaults.fastModeDefault;
  // Real Chat Latency: keep multiple WebChat turns from serializing behind
  // each other on CommandLane.Main. The lane default is 4; bumping per-tenant
  // defaults to 8 keeps small bursts (e.g. WebChat refresh + send + history
  // fetch) from queueing. Override with OPENCLAW_AGENT_MAX_CONCURRENT if a
  // tenant needs different headroom.
  const agentMaxConcurrentEnv = Number.parseInt(
    process.env.OPENCLAW_AGENT_MAX_CONCURRENT?.trim() ?? "",
    10,
  );
  defaults.maxConcurrent =
    Number.isFinite(agentMaxConcurrentEnv) && agentMaxConcurrentEnv > 0
      ? agentMaxConcurrentEnv
      : 8;
  if (currentModel.primary && models[currentModel.primary]) {
    const primaryModelEntry =
      models[currentModel.primary] &&
      typeof models[currentModel.primary] === "object" &&
      !Array.isArray(models[currentModel.primary])
        ? { ...models[currentModel.primary] }
        : {};
    const primaryModelParams =
      primaryModelEntry.params &&
      typeof primaryModelEntry.params === "object" &&
      !Array.isArray(primaryModelEntry.params)
        ? { ...primaryModelEntry.params }
        : {};
    primaryModelEntry.params = {
      ...primaryModelParams,
      fastMode: true,
    };
    models[currentModel.primary] = primaryModelEntry;
  }
  const memorySearch =
    defaults.memorySearch && typeof defaults.memorySearch === "object" && !Array.isArray(defaults.memorySearch)
      ? { ...defaults.memorySearch }
      : {};
  const memorySearchSync =
    memorySearch.sync && typeof memorySearch.sync === "object" && !Array.isArray(memorySearch.sync)
      ? { ...memorySearch.sync }
      : {};
  memorySearch.enabled = false;
  memorySearch.sync = {
    ...memorySearchSync,
    onSessionStart: false,
    onSearch: false,
    watch: false,
  };
  defaults.memorySearch = memorySearch;

  if (options.allowedOrigins.length > 0) {
    const existingAllowedOrigins = Array.isArray(controlUi.allowedOrigins)
      ? controlUi.allowedOrigins.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [];
    controlUi.allowedOrigins = [...new Set([...existingAllowedOrigins, ...options.allowedOrigins])];
  }

  // For dedicated hosted gateways we keep host-header fallback enabled so the
  // Control UI dashboard works from allowed origins without requiring device
  // pairing on every direct visit. The explicit allowedOrigins list is still
  // enforced as the primary gate; the fallback is a safety net for browser
  // clients that do not send a perfect Origin header.
  if (controlUi.dangerouslyAllowHostHeaderOriginFallback === undefined) {
    controlUi.dangerouslyAllowHostHeaderOriginFallback = true;
  }

  // SaintAGI runs as a hosted multi-tenant control plane: the Next.js backend
  // holds OPENCLAW_GATEWAY_TOKEN and connects to this Railway gateway over the
  // network as a trusted operator (client.id=gateway-client, mode=backend).
  // Tenant data isolation happens at the workspace path layer above gateway
  // auth, so we trust the shared token instead of requiring per-backend device
  // pairing. Operators who want stricter behavior can override the flag in the
  // gateway config.
  if (controlUi.allowSharedTokenBackendOperator === undefined) {
    controlUi.allowSharedTokenBackendOperator = true;
  }

  // For dedicated per-tenant gateways we disable device auth for the Control UI
  // so the dashboard works immediately from allowed origins without requiring
  // manual device pairing on every first visit. The gateway is not shared, so
  // the risk is contained. The SaintAGI backend still uses the shared token path.
  if (controlUi.dangerouslyDisableDeviceAuth === undefined) {
    controlUi.dangerouslyDisableDeviceAuth = true;
  }

  for (const channelId of options.bootstrapChannels) {
    const existingPluginEntry =
      pluginEntries[channelId] &&
      typeof pluginEntries[channelId] === "object" &&
      !Array.isArray(pluginEntries[channelId])
        ? { ...pluginEntries[channelId] }
        : {};
    existingPluginEntry.enabled = true;
    pluginEntries[channelId] = existingPluginEntry;

    if (pluginAllow && !pluginAllow.includes(channelId)) {
      pluginAllow.push(channelId);
    }
  }

  if (options.bootstrapChannels.length === 0) {
    for (const channelId of HOSTED_CHANNEL_IDS) {
      const existingPluginEntry =
        pluginEntries[channelId] &&
        typeof pluginEntries[channelId] === "object" &&
        !Array.isArray(pluginEntries[channelId])
          ? { ...pluginEntries[channelId] }
          : null;
      if (existingPluginEntry?.enabled === true) {
        pluginEntries[channelId] = { ...existingPluginEntry, enabled: false };
      }
    }
  }

  pluginEntries.bonjour = {
    ...(pluginEntries.bonjour && typeof pluginEntries.bonjour === "object" && !Array.isArray(pluginEntries.bonjour)
      ? pluginEntries.bonjour
      : {}),
    enabled: false,
  };

  const nextConfig = {
    ...config,
    agents: {
      ...agents,
      defaults,
      list: Array.isArray(agents.list)
        ? agents.list.map((agent) => {
            if (!agent || typeof agent !== "object" || Array.isArray(agent)) {
              return agent;
            }
            return {
              ...agent,
              fastModeDefault: true,
              memorySearch: {
                enabled: false,
                sync: {
                  onSessionStart: false,
                  onSearch: false,
                  watch: false,
                },
              },
            };
          })
        : [],
    },
    bindings: Array.isArray(config.bindings) ? config.bindings : [],
    gateway: {
      ...gateway,
      controlUi,
    },
    channels,
    plugins: {
      ...plugins,
      ...(pluginAllow ? { allow: pluginAllow } : {}),
      ...(Object.keys(pluginEntries).length > 0 ? { entries: pluginEntries } : {}),
    },
  };
  delete nextConfig.agent;
  return nextConfig;
}

async function main() {
  const port = process.env.PORT?.trim() || "8080";
  const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();

  if (!token) {
    console.error("OPENCLAW_GATEWAY_TOKEN is required for Railway deployment.");
    process.exit(1);
  }

  const stateDir = process.env.OPENCLAW_STATE_DIR?.trim() || "/data/.openclaw";
  const workspaceDir = process.env.OPENCLAW_WORKSPACE_DIR?.trim() || "/data/workspace";
  const configPath = process.env.OPENCLAW_CONFIG_PATH?.trim() || path.join(stateDir, "openclaw.json");
  const pluginStageDir = process.env.OPENCLAW_PLUGIN_STAGE_DIR?.trim() || "/tmp/openclaw-plugin-runtime-deps";
  const defaultModel = process.env.OPENCLAW_DEFAULT_MODEL?.trim();
  const bootstrapChannels = parseBootstrapChannels(process.env.OPENCLAW_BOOTSTRAP_CHANNELS);

  const publicOrigins = new Set(parseAllowedOrigins(process.env.OPENCLAW_ALLOWED_ORIGINS));
  const railwayDomain =
    normalizeOrigin(process.env.RAILWAY_PUBLIC_DOMAIN?.trim() || "") ||
    normalizeOrigin(process.env.RAILWAY_STATIC_URL?.trim() || "");
  if (railwayDomain) {
    publicOrigins.add(railwayDomain);
  }

  await mkdir(stateDir, { recursive: true });
  await mkdir(workspaceDir, { recursive: true });
  await mkdir(pluginStageDir, { recursive: true });
  await mkdir(path.dirname(configPath), { recursive: true });
  await removeIfPresent(path.join(stateDir, "plugin-runtime-deps"));

  let existingConfig = {};
  if (await fileExists(configPath)) {
    try {
      existingConfig = JSON.parse(await readFile(configPath, "utf8"));
    } catch {
      existingConfig = {};
    }
  }

  const nextConfig = mergeConfig(existingConfig, {
    workspaceDir,
    defaultModel,
    allowedOrigins: [...publicOrigins],
    bootstrapChannels,
  });

  await writeConfigWithSpaceRetry(configPath, stateDir, nextConfig);

  const child = spawn(
    process.execPath,
    [
      "openclaw.mjs",
      "gateway",
      "run",
      "--allow-unconfigured",
      "--bind",
      "lan",
      "--auth",
      "token",
      "--port",
      port,
      "--token",
      token,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        OPENCLAW_STATE_DIR: stateDir,
        OPENCLAW_WORKSPACE_DIR: workspaceDir,
        OPENCLAW_CONFIG_PATH: configPath,
        OPENCLAW_PLUGIN_STAGE_DIR: pluginStageDir,
      },
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

await main();
