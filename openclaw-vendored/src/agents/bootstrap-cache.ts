import { loadWorkspaceBootstrapFiles, type WorkspaceBootstrapFile } from "./workspace.js";

type BootstrapSnapshot = {
  workspaceDir: string;
  files: WorkspaceBootstrapFile[];
  loadedAt: number;
};

const cache = new Map<string, BootstrapSnapshot>();

// Real Chat Latency: bootstrap files (AGENTS.md, SOUL.md, IDENTITY.md, USER.md,
// TOOLS.md, BOOTSTRAP.md, MEMORY.md, HEARTBEAT.md) almost never change between
// adjacent turns. On Railway-hosted persistent volumes the per-turn reload
// (8 stat+open+close+read syscalls) shows up as ~8s of synchronous IO inside
// the bootstrap-context prep stage. We trust the cache for a short window
// (default 30s, override with OPENCLAW_BOOTSTRAP_CACHE_TTL_MS) so warm chat
// turns skip disk entirely. Edits are still picked up shortly via TTL expiry,
// and explicit invalidations (`clearBootstrapSnapshot`) still flush the entry
// immediately.
const DEFAULT_BOOTSTRAP_CACHE_TTL_MS = 30_000;
const ttlOverrideEnv = Number.parseInt(
  process.env.OPENCLAW_BOOTSTRAP_CACHE_TTL_MS?.trim() ?? "",
  10,
);
const BOOTSTRAP_CACHE_TTL_MS =
  Number.isFinite(ttlOverrideEnv) && ttlOverrideEnv >= 0
    ? ttlOverrideEnv
    : DEFAULT_BOOTSTRAP_CACHE_TTL_MS;

function bootstrapFilesEqual(
  previous: WorkspaceBootstrapFile[],
  next: WorkspaceBootstrapFile[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((file, index) => {
    const updated = next[index];
    return (
      updated !== undefined &&
      file.name === updated.name &&
      file.path === updated.path &&
      file.content === updated.content &&
      file.missing === updated.missing
    );
  });
}

export async function getOrLoadBootstrapFiles(params: {
  workspaceDir: string;
  sessionKey: string;
}): Promise<WorkspaceBootstrapFile[]> {
  const existing = cache.get(params.sessionKey);
  const now = Date.now();
  if (
    existing &&
    existing.workspaceDir === params.workspaceDir &&
    BOOTSTRAP_CACHE_TTL_MS > 0 &&
    now - existing.loadedAt < BOOTSTRAP_CACHE_TTL_MS
  ) {
    return existing.files;
  }
  const files = await loadWorkspaceBootstrapFiles(params.workspaceDir);
  if (
    existing &&
    existing.workspaceDir === params.workspaceDir &&
    bootstrapFilesEqual(existing.files, files)
  ) {
    existing.loadedAt = now;
    return existing.files;
  }

  cache.set(params.sessionKey, {
    workspaceDir: params.workspaceDir,
    files,
    loadedAt: now,
  });
  return files;
}

export function clearBootstrapSnapshot(sessionKey: string): void {
  cache.delete(sessionKey);
}

export function clearBootstrapSnapshotOnSessionRollover(params: {
  sessionKey?: string;
  previousSessionId?: string;
}): void {
  if (!params.sessionKey || !params.previousSessionId) {
    return;
  }

  clearBootstrapSnapshot(params.sessionKey);
}

export function clearAllBootstrapSnapshots(): void {
  cache.clear();
}
