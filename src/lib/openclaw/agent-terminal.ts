import path from "node:path";

import { getAgentWorkspacePath } from "./paths";

type ConfigRecord = Record<string, unknown>;

export type AgentTerminalPolicyInput = {
  enabled: boolean;
  repoPaths: string[];
};

function asConfigRecord(value: unknown): ConfigRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ConfigRecord)
    : {};
}

function normalizeRelativeRepoPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Repo allowlist paths cannot be empty.");
  }

  const normalized = path.posix.normalize(trimmed.replace(/\\/g, "/"));
  if (!normalized || normalized === "/") {
    throw new Error("Repo allowlist paths cannot be empty.");
  }
  if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../")) {
    throw new Error("Repo allowlist paths must stay inside the agent workspace.");
  }
  if (normalized.includes("/../") || normalized === ".") {
    return normalized === "." ? "." : normalized;
  }

  return normalized.replace(/^\.\/+/, "") || ".";
}

export function isPathWithinRoot(candidatePath: string, rootPath: string) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function normalizeAgentTerminalRepoPaths(values: string[]) {
  const unique = new Set<string>();
  for (const value of values) {
    const normalized = normalizeRelativeRepoPath(value);
    unique.add(normalized);
  }

  return [...unique];
}

export function getAgentTerminalConfig(config: unknown) {
  const record = asConfigRecord(config);
  const terminal = asConfigRecord(record.terminal);
  return {
    enabled: terminal.enabled === true,
  };
}

export function mergeAgentTerminalConfig(config: unknown, input: AgentTerminalPolicyInput) {
  const record = asConfigRecord(config);
  const terminal = asConfigRecord(record.terminal);

  return {
    ...record,
    terminal: {
      ...terminal,
      enabled: input.enabled,
    },
  };
}

export function resolveAgentWorkspaceFromConfig(input: {
  orgId: string;
  openClawAgentId: string;
  config?: unknown;
  source?: "runtime" | "env";
}) {
  const record = asConfigRecord(input.config);
  const configuredWorkspace = typeof record.workspace === "string" ? record.workspace.trim() : "";
  if (configuredWorkspace && path.isAbsolute(configuredWorkspace)) {
    return path.resolve(configuredWorkspace);
  }

  return getAgentWorkspacePath(input.orgId, input.openClawAgentId, {
    source: input.source,
  });
}

export function resolveAllowedGitRepoRoots(workspacePath: string, repoPaths: string[]) {
  const normalizedRepoPaths = normalizeAgentTerminalRepoPaths(repoPaths);
  return normalizedRepoPaths.map((repoPath) =>
    repoPath === "."
      ? path.resolve(workspacePath)
      : path.resolve(workspacePath, repoPath),
  );
}
