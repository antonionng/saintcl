import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getAgentWorkspacePath } from "@/lib/openclaw/paths";
import { renderAgentBootstrapFiles, renderTenantAgentsMd, renderTenantOpenClawConfig, renderTenantToolsMd } from "@/lib/openclaw/templates";
import type {
  BootstrapAgentOptions,
  BootstrapTenantOptions,
  OpenClawRuntimeDescriptor,
} from "@/lib/openclaw/runtime-types";

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function bootstrapTenantRuntime(
  runtime: OpenClawRuntimeDescriptor,
  options: BootstrapTenantOptions,
) {
  await Promise.all([
    ensureDir(runtime.paths.root),
    ensureDir(runtime.paths.stateRoot),
    ensureDir(runtime.paths.configDir),
    ensureDir(runtime.paths.workspaceRoot),
    ensureDir(runtime.paths.logsDir),
  ]);

  await Promise.all([
    writeFile(runtime.paths.configPath, renderTenantOpenClawConfig(runtime, options), "utf8"),
    writeFile(path.join(runtime.paths.workspaceRoot, "AGENTS.md"), renderTenantAgentsMd(runtime), "utf8"),
    writeFile(path.join(runtime.paths.workspaceRoot, "TOOLS.md"), renderTenantToolsMd(), "utf8"),
  ]);
}

export async function bootstrapAgentWorkspace(
  runtime: OpenClawRuntimeDescriptor,
  options: BootstrapAgentOptions,
) {
  const workspacePath = getAgentWorkspacePath(runtime.orgId, options.agentId);
  const files = renderAgentBootstrapFiles(options);

  await ensureDir(workspacePath);
  await Promise.all([
    writeFile(path.join(workspacePath, "AGENTS.md"), files.agents, "utf8"),
    writeFile(path.join(workspacePath, "TOOLS.md"), files.tools, "utf8"),
  ]);

  return workspacePath;
}
