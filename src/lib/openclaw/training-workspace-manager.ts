import { randomBytes } from "node:crypto";
import { existsSync, createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { env } from "@/lib/env";
import { recordSessionActivityEvent } from "@/lib/observability";
import { getTenantRuntimePaths, slugifyPathSegment } from "@/lib/openclaw/paths";
import { getTrainingModuleResources } from "@/lib/training";

type ManagedTrainingWorkspaceStatus = "provisioning" | "active" | "paused" | "stopped" | "error";

type ManagedTrainingWorkspacePaths = {
  root: string;
  notebooksDir: string;
  dataDir: string;
  outputsDir: string;
  venvDir: string;
  metadataPath: string;
  logPath: string;
};

export type ManagedTrainingWorkspaceState = {
  workspaceId: string;
  orgId: string;
  participantId: string;
  moduleSlug: string;
  port: number;
  token: string;
  pid?: number;
  status: ManagedTrainingWorkspaceStatus;
  rootDir: string;
  notebooksDir: string;
  dataDir: string;
  outputsDir: string;
  logPath: string;
  startedAt?: string;
  lastHeartbeatAt?: string;
  updatedAt: string;
};

function hashToTrainingPort(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return env.openClawBasePort + 2000 + (hash % 1000);
}

function buildTrainingWorkspacePaths(orgId: string, participantId: string, moduleSlug: string): ManagedTrainingWorkspacePaths {
  const runtimePaths = getTenantRuntimePaths(orgId);
  const root = path.join(
    runtimePaths.workspaceRoot,
    "training",
    slugifyPathSegment(participantId),
    slugifyPathSegment(moduleSlug),
  );

  return {
    root,
    notebooksDir: path.join(root, "notebooks"),
    dataDir: path.join(root, "data"),
    outputsDir: path.join(root, "outputs"),
    venvDir: path.join(root, ".venv"),
    metadataPath: path.join(root, "workspace.json"),
    logPath: path.join(root, "jupyter.log"),
  };
}

function makeWorkspaceToken() {
  return randomBytes(24).toString("hex");
}

function isProcessAlive(pid?: number) {
  if (!pid) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function writeWorkspaceState(state: ManagedTrainingWorkspaceState) {
  await mkdir(state.rootDir, { recursive: true });
  await writeFile(state.rootDir ? path.join(state.rootDir, "workspace.json") : "", JSON.stringify(state, null, 2), "utf8");
}

async function readWorkspaceState(orgId: string, participantId: string, moduleSlug: string) {
  const paths = buildTrainingWorkspacePaths(orgId, participantId, moduleSlug);
  if (!existsSync(paths.metadataPath)) {
    return null;
  }

  const raw = await readFile(paths.metadataPath, "utf8");
  return JSON.parse(raw) as ManagedTrainingWorkspaceState;
}

async function recordWorkspaceLifecycleEvent(input: {
  orgId: string;
  participantId: string;
  moduleSlug: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await recordSessionActivityEvent({
    orgId: input.orgId,
    source: "runtime_lifecycle",
    eventType: input.eventType,
    message: input.message,
    metadata: {
      participantId: input.participantId,
      moduleSlug: input.moduleSlug,
      ...(input.metadata ?? {}),
    },
  });
}

function resolveModuleContentPath(href: string) {
  return path.resolve(process.cwd(), href.replace(/^\/+/, ""));
}

async function ensureWorkspaceContent(moduleSlug: string, paths: ManagedTrainingWorkspacePaths) {
  await mkdir(paths.notebooksDir, { recursive: true });
  await mkdir(paths.dataDir, { recursive: true });
  await mkdir(paths.outputsDir, { recursive: true });

  const resources = getTrainingModuleResources(moduleSlug);
  const notebookResources = resources.filter((resource) => resource.kind === "notebook");
  const datasetResources = resources.filter((resource) => resource.kind === "dataset");

  await Promise.all(
    notebookResources.map(async (resource) => {
      const sourcePath = resolveModuleContentPath(resource.href);
      const targetPath = path.join(paths.notebooksDir, path.basename(sourcePath));
      if (!existsSync(targetPath)) {
        await copyFile(sourcePath, targetPath);
      }
    }),
  );

  await Promise.all(
    datasetResources.map(async (resource) => {
      const sourcePath = resolveModuleContentPath(resource.href);
      const targetPath = path.join(paths.dataDir, path.basename(sourcePath));
      if (!existsSync(targetPath)) {
        await copyFile(sourcePath, targetPath);
      }
    }),
  );
}

async function checkWorkspaceHealth(state: ManagedTrainingWorkspaceState) {
  const response = await fetch(`http://127.0.0.1:${state.port}/api/status`, {
    headers: {
      Authorization: `token ${state.token}`,
    },
    cache: "no-store",
  });

  return response.ok;
}

function buildWorkspaceLaunchUrl(state: ManagedTrainingWorkspaceState) {
  return `http://127.0.0.1:${state.port}/lab/tree?token=${state.token}`;
}

export async function syncManagedTrainingWorkspace(input: {
  orgId: string;
  participantId: string;
  moduleSlug: string;
}) {
  const state = await readWorkspaceState(input.orgId, input.participantId, input.moduleSlug);
  if (!state) return null;

  if (isProcessAlive(state.pid)) {
    try {
      if (await checkWorkspaceHealth(state)) {
        const nextState: ManagedTrainingWorkspaceState = {
          ...state,
          status: "active",
          lastHeartbeatAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await writeWorkspaceState(nextState);
        return {
          state: nextState,
          launchUrl: buildWorkspaceLaunchUrl(nextState),
        };
      }

      const provisioningState: ManagedTrainingWorkspaceState = {
        ...state,
        status: "provisioning",
        updatedAt: new Date().toISOString(),
      };
      await writeWorkspaceState(provisioningState);
      return {
        state: provisioningState,
        launchUrl: null,
      };
    } catch {
      const provisioningState: ManagedTrainingWorkspaceState = {
        ...state,
        status: "provisioning",
        updatedAt: new Date().toISOString(),
      };
      await writeWorkspaceState(provisioningState);
      return {
        state: provisioningState,
        launchUrl: null,
      };
    }
  }

  const errorState: ManagedTrainingWorkspaceState = {
    ...state,
    status: state.pid ? "error" : "stopped",
    updatedAt: new Date().toISOString(),
  };
  await writeWorkspaceState(errorState);
  return {
    state: errorState,
    launchUrl: null,
  };
}

export async function startManagedTrainingWorkspace(input: {
  workspaceId: string;
  orgId: string;
  participantId: string;
  moduleSlug: string;
}) {
  const existing = await syncManagedTrainingWorkspace(input);
  if (existing?.state.status === "active" || existing?.state.status === "provisioning") {
    return existing;
  }

  const paths = buildTrainingWorkspacePaths(input.orgId, input.participantId, input.moduleSlug);
  await mkdir(paths.root, { recursive: true });
  await ensureWorkspaceContent(input.moduleSlug, paths);

  const currentState = await readWorkspaceState(input.orgId, input.participantId, input.moduleSlug);
  const nextState: ManagedTrainingWorkspaceState = {
    workspaceId: input.workspaceId,
    orgId: input.orgId,
    participantId: input.participantId,
    moduleSlug: input.moduleSlug,
    port: currentState?.port ?? hashToTrainingPort(`${input.orgId}:${input.participantId}:${input.moduleSlug}`),
    token: currentState?.token ?? makeWorkspaceToken(),
    status: "provisioning",
    pid: currentState?.pid,
    rootDir: paths.root,
    notebooksDir: paths.notebooksDir,
    dataDir: paths.dataDir,
    outputsDir: paths.outputsDir,
    logPath: paths.logPath,
    startedAt: currentState?.startedAt,
    lastHeartbeatAt: currentState?.lastHeartbeatAt,
    updatedAt: new Date().toISOString(),
  };

  await writeWorkspaceState(nextState);
  await recordWorkspaceLifecycleEvent({
    orgId: input.orgId,
    participantId: input.participantId,
    moduleSlug: input.moduleSlug,
    eventType: "training_workspace.provisioning",
    message: "Provisioning managed training workspace.",
    metadata: {
      port: nextState.port,
      workspaceRoot: nextState.rootDir,
    },
  });

  const logStream = createWriteStream(paths.logPath, { flags: "a" });
  const bootstrapScript = `
set -e
mkdir -p "$TRAINING_WORKSPACE_ROOT" "$TRAINING_WORKSPACE_NOTEBOOKS" "$TRAINING_WORKSPACE_DATA" "$TRAINING_WORKSPACE_OUTPUTS"
if [ ! -x "$TRAINING_WORKSPACE_VENV/bin/python" ]; then
  python3 -m venv "$TRAINING_WORKSPACE_VENV"
fi
"$TRAINING_WORKSPACE_VENV/bin/python" -m pip install --upgrade pip
"$TRAINING_WORKSPACE_VENV/bin/python" -m pip install jupyterlab notebook ipykernel numpy pandas matplotlib seaborn scikit-learn
exec "$TRAINING_WORKSPACE_VENV/bin/python" -m jupyter lab \
  --no-browser \
  --ip=127.0.0.1 \
  --port="$TRAINING_WORKSPACE_PORT" \
  --IdentityProvider.token="$TRAINING_WORKSPACE_TOKEN" \
  --ServerApp.root_dir="$TRAINING_WORKSPACE_ROOT" \
  --ServerApp.allow_origin="*" \
  --ServerApp.preferred_dir="$TRAINING_WORKSPACE_NOTEBOOKS"
`.trim();

  const child = spawn("bash", ["-lc", bootstrapScript], {
    cwd: paths.root,
    env: {
      ...process.env,
      TRAINING_WORKSPACE_ROOT: paths.root,
      TRAINING_WORKSPACE_NOTEBOOKS: paths.notebooksDir,
      TRAINING_WORKSPACE_DATA: paths.dataDir,
      TRAINING_WORKSPACE_OUTPUTS: paths.outputsDir,
      TRAINING_WORKSPACE_VENV: paths.venvDir,
      TRAINING_WORKSPACE_PORT: String(nextState.port),
      TRAINING_WORKSPACE_TOKEN: nextState.token,
    },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  child.unref();

  const runningState: ManagedTrainingWorkspaceState = {
    ...nextState,
    pid: child.pid,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeWorkspaceState(runningState);

  return {
    state: runningState,
    launchUrl: null,
  };
}
