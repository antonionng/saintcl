import { loadWorkspaceBootstrapFiles, type WorkspaceBootstrapFile } from "./workspace.js";

type BootstrapSnapshot = {
  workspaceDir: string;
  files: WorkspaceBootstrapFile[];
  loadedAt: number;
};

const cache = new Map<string, BootstrapSnapshot>();
// Real Chat Latency: in addition to the per-session cache above we also keep a
// workspace-keyed lookup so brand-new sessions for an already-loaded workspace
// (e.g. the first WebChat turn for an agent that the gateway has handled
// before, or a sibling subagent session) reuse the loaded files instead of
// paying the cold disk hit again. This is what lets a startup pre-warm pay
// off across every future first turn for that agent.
const workspaceCache = new Map<string, BootstrapSnapshot>();

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

function isFresh(snapshot: BootstrapSnapshot, now: number): boolean {
  return BOOTSTRAP_CACHE_TTL_MS > 0 && now - snapshot.loadedAt < BOOTSTRAP_CACHE_TTL_MS;
}

function recordSnapshot(
  sessionKey: string | null,
  workspaceDir: string,
  files: WorkspaceBootstrapFile[],
  loadedAt: number,
): BootstrapSnapshot {
  const snapshot: BootstrapSnapshot = { workspaceDir, files, loadedAt };
  if (sessionKey) {
    cache.set(sessionKey, snapshot);
  }
  workspaceCache.set(workspaceDir, snapshot);
  return snapshot;
}

export async function getOrLoadBootstrapFiles(params: {
  workspaceDir: string;
  sessionKey: string;
}): Promise<WorkspaceBootstrapFile[]> {
  const now = Date.now();
  const existing = cache.get(params.sessionKey);
  if (existing && existing.workspaceDir === params.workspaceDir && isFresh(existing, now)) {
    return existing.files;
  }
  const sharedByWorkspace = workspaceCache.get(params.workspaceDir);
  if (sharedByWorkspace && isFresh(sharedByWorkspace, now)) {
    cache.set(params.sessionKey, sharedByWorkspace);
    return sharedByWorkspace.files;
  }
  const files = await loadWorkspaceBootstrapFiles(params.workspaceDir);
  if (
    existing &&
    existing.workspaceDir === params.workspaceDir &&
    bootstrapFilesEqual(existing.files, files)
  ) {
    existing.loadedAt = now;
    workspaceCache.set(params.workspaceDir, existing);
    return existing.files;
  }
  recordSnapshot(params.sessionKey, params.workspaceDir, files, now);
  return files;
}

// Pre-warm the workspace-keyed cache for a known workspace dir. Used by the
// gateway startup hook to eliminate cold-start latency for the first turn of
// every known agent. Returns the loaded file count or null on failure.
export async function preloadWorkspaceBootstrapFiles(
  workspaceDir: string,
): Promise<number | null> {
  try {
    const files = await loadWorkspaceBootstrapFiles(workspaceDir);
    recordSnapshot(null, workspaceDir, files, Date.now());
    return files.length;
  } catch {
    return null;
  }
}

export function clearBootstrapSnapshot(sessionKey: string): void {
  const existing = cache.get(sessionKey);
  cache.delete(sessionKey);
  // Also evict from workspaceCache when the evicted entry was the shared one,
  // so the next caller forces a fresh disk read instead of returning a stale
  // entry that the explicit invalidation was trying to flush.
  if (existing && workspaceCache.get(existing.workspaceDir) === existing) {
    workspaceCache.delete(existing.workspaceDir);
  }
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
  workspaceCache.clear();
}
