import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function fileExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
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
  const defaults =
    agents.defaults && typeof agents.defaults === "object" && !Array.isArray(agents.defaults)
      ? { ...agents.defaults }
      : {};
  const agent =
    config.agent && typeof config.agent === "object" && !Array.isArray(config.agent)
      ? { ...config.agent }
      : {};

  gateway.mode = gateway.mode || "local";
  defaults.workspace = defaults.workspace || options.workspaceDir;

  if ((!agent.model || typeof agent.model !== "string") && options.defaultModel) {
    agent.model = options.defaultModel;
  }

  if (
    (!Array.isArray(controlUi.allowedOrigins) || controlUi.allowedOrigins.length === 0) &&
    options.allowedOrigins.length > 0
  ) {
    controlUi.allowedOrigins = options.allowedOrigins;
  }

  if (
    (!Array.isArray(controlUi.allowedOrigins) || controlUi.allowedOrigins.length === 0) &&
    controlUi.dangerouslyAllowHostHeaderOriginFallback === undefined
  ) {
    controlUi.dangerouslyAllowHostHeaderOriginFallback = true;
  }

  if (Array.isArray(controlUi.allowedOrigins) && controlUi.allowedOrigins.length > 0) {
    delete controlUi.dangerouslyAllowHostHeaderOriginFallback;
  }

  return {
    ...config,
    agent,
    agents: {
      ...agents,
      defaults,
      list: Array.isArray(agents.list) ? agents.list : [],
    },
    bindings: Array.isArray(config.bindings) ? config.bindings : [],
    gateway: {
      ...gateway,
      controlUi,
    },
  };
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
  const defaultModel = process.env.OPENCLAW_DEFAULT_MODEL?.trim();

  const publicOrigins = new Set(parseAllowedOrigins(process.env.OPENCLAW_ALLOWED_ORIGINS));
  const railwayDomain =
    normalizeOrigin(process.env.RAILWAY_PUBLIC_DOMAIN?.trim() || "") ||
    normalizeOrigin(process.env.RAILWAY_STATIC_URL?.trim() || "");
  if (railwayDomain) {
    publicOrigins.add(railwayDomain);
  }

  await mkdir(stateDir, { recursive: true });
  await mkdir(workspaceDir, { recursive: true });
  await mkdir(path.dirname(configPath), { recursive: true });

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
  });

  await writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

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
