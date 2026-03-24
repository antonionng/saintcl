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

async function writeFileIfMissing(filePath: string, content: string) {
  try {
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
    return true;
  } catch (error) {
    const nextError = error as { code?: string };
    if (nextError.code === "EEXIST") {
      return false;
    }
    throw error;
  }
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
    writeFileIfMissing(runtime.paths.configPath, renderTenantOpenClawConfig(runtime, options)),
    writeFileIfMissing(path.join(runtime.paths.workspaceRoot, "AGENTS.md"), renderTenantAgentsMd(runtime)),
    writeFileIfMissing(path.join(runtime.paths.workspaceRoot, "TOOLS.md"), renderTenantToolsMd()),
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
    writeFileIfMissing(path.join(workspacePath, "AGENTS.md"), files.agents),
    writeFileIfMissing(path.join(workspacePath, "TOOLS.md"), files.tools),
  ]);

  return workspacePath;
}
