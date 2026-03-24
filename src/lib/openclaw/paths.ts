import path from "node:path";

import { env } from "../env";
import type { OpenClawRuntimeDescriptor, OpenClawRuntimePaths } from "./runtime-types";

export function slugifyPathSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashToPort(value: string, basePort: number) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return basePort + (hash % 1000);
}

export function getRepoRoot() {
  return process.cwd();
}

export function getOpenClawVendorPath() {
  if (env.openClawVendorDir) {
    return path.isAbsolute(env.openClawVendorDir)
      ? env.openClawVendorDir
      : path.resolve(env.openClawVendorDir);
  }

  return path.join(getRepoRoot(), "openclaw-vendored");
}

export function getOpenClawRuntimeBasePath() {
  if (env.openClawRuntimeRoot) {
    return path.isAbsolute(env.openClawRuntimeRoot)
      ? env.openClawRuntimeRoot
      : path.resolve(env.openClawRuntimeRoot);
  }

  return path.join(getRepoRoot(), "runtime-data", "openclaw");
}

export function getTenantRuntimePaths(orgId: string): OpenClawRuntimePaths {
  const tenantSlug = slugifyPathSegment(orgId);
  const root = path.join(getOpenClawRuntimeBasePath(), tenantSlug);

  return {
    root,
    stateRoot: path.join(root, "state"),
    configDir: path.join(root, "config"),
    configPath: path.join(root, "config", "openclaw.json"),
    workspaceRoot: path.join(root, "workspaces"),
    logsDir: path.join(root, "logs"),
    gatewayLogPath: path.join(root, "logs", "gateway.log"),
    metadataPath: path.join(root, "runtime.json"),
  };
}

export function getHostedWorkspaceBasePath() {
  if (env.openClawWorkspaceDir) {
    return path.isAbsolute(env.openClawWorkspaceDir)
      ? env.openClawWorkspaceDir
      : path.resolve(env.openClawWorkspaceDir);
  }

  return "/data/workspace";
}

export function getGatewayWorkspaceRoot(
  orgId: string,
  options?: { source?: "runtime" | "env" },
) {
  if (options?.source === "env") {
    return path.join(getHostedWorkspaceBasePath(), slugifyPathSegment(orgId));
  }

  return getTenantRuntimePaths(orgId).workspaceRoot;
}

export function getAgentWorkspacePath(
  orgId: string,
  agentId: string,
  options?: { source?: "runtime" | "env" },
) {
  return path.join(getGatewayWorkspaceRoot(orgId, options), slugifyPathSegment(agentId));
}

export function buildRuntimeDescriptor(
  orgId: string,
  overrides?: Partial<OpenClawRuntimeDescriptor>,
): OpenClawRuntimeDescriptor {
  const paths = getTenantRuntimePaths(orgId);
  const gatewayPort = overrides?.gatewayPort ?? hashToPort(orgId, env.openClawBasePort);

  return {
    id: `rt_${slugifyPathSegment(orgId)}`,
    orgId,
    gatewayPort,
    gatewayUrl: `ws://127.0.0.1:${gatewayPort}`,
    vendorPath: getOpenClawVendorPath(),
    status: overrides?.status ?? "stopped",
    gatewayToken: overrides?.gatewayToken,
    pid: overrides?.pid,
    lastHeartbeatAt: overrides?.lastHeartbeatAt,
    paths,
  };
}
