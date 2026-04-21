"use client";

import { useCallback, useRef, useState } from "react";

import type { ChartPreview, DataFramePreview } from "@/components/training/output-panel";
import type { WorkspaceFileRecord } from "@/components/training/file-explorer";

type PyodideFsStat = {
  mode: number;
  size: number;
};

type PyodideFs = {
  mkdir: (path: string) => void;
  writeFile: (path: string, data: Uint8Array) => void;
  readdir: (path: string) => string[];
  stat: (path: string) => PyodideFsStat;
  readFile: (path: string) => Uint8Array;
  isFile: (mode: number) => boolean;
};

type PyodideGlobals = {
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
};

type PyodideInstance = {
  loadPackage: (packages: string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  FS: PyodideFs;
  globals: PyodideGlobals;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full";

export type PyodideRuntimeState = "idle" | "loading" | "ready" | "error";

export type DatasetResource = {
  label: string;
  href: string;
};

export type RunResult = {
  stdout: string;
  stderr: string;
  failed: boolean;
  dataPreview: DataFramePreview | null;
  charts: ChartPreview[];
  files: WorkspaceFileRecord[];
};

export type ValidationResult = {
  passed: boolean;
  message: string;
  details: string[];
};

export type UsePyodideRuntimeOptions = {
  /** CSV/Parquet/JSON datasets bundled with the module. Pre-mounted at `/workspace/data/<basename>`. */
  datasetResources: DatasetResource[];
  /** Output folders to ensure exist (e.g. `outputs/day1`). */
  notebookOutputFolders: string[];
};

export type PyodideRuntime = {
  state: PyodideRuntimeState;
  message: string;
  files: WorkspaceFileRecord[];
  load: () => Promise<void>;
  /** Reset bootstrap state and re-run `load()`. Use after a failed CDN load. */
  reload: () => Promise<void>;
  run: (code: string) => Promise<RunResult>;
  runValidation: (validationPython: string) => Promise<ValidationResult | null>;
  uploadFiles: (files: FileList | File[]) => Promise<string[]>;
  writeUploadedBytes: (fileName: string, bytes: Uint8Array) => Promise<void>;
  downloadFile: (file: WorkspaceFileRecord) => void;
};

async function ensurePyodideScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.loadPyodide) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Pyodide script.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `${PYODIDE_INDEX_URL}/pyodide.js`;
    script.async = true;
    script.dataset.pyodide = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide script."));
    document.head.appendChild(script);
  });
}

function ensureDir(pyodide: PyodideInstance, path: string) {
  const segments = path.split("/").filter(Boolean);
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    try {
      pyodide.FS.mkdir(current);
    } catch {
      // already exists
    }
  }
}

function listWorkspaceFiles(
  pyodide: PyodideInstance,
  outputFolders: string[],
): WorkspaceFileRecord[] {
  const directoryConfigs = [
    { directory: "/workspace/data", scope: "dataset" as const, prefix: "/workspace/data/" },
    { directory: "/workspace/data/uploads", scope: "upload" as const, prefix: "/workspace/data/uploads/" },
    ...outputFolders.map((folder) => ({
      directory: `/workspace/${folder.replace(/^\/+/, "").replace(/^workspace\//, "")}`,
      scope: "output" as const,
      prefix: "/workspace/outputs/",
    })),
  ];
  const files: WorkspaceFileRecord[] = [];
  for (const { directory, scope, prefix } of directoryConfigs) {
    let entries: string[] = [];
    try {
      entries = pyodide.FS.readdir(directory);
    } catch {
      entries = [];
    }
    for (const entry of entries) {
      if (entry === "." || entry === "..") continue;
      const fullPath = `${directory}/${entry}`;
      const stat = pyodide.FS.stat(fullPath);
      if (pyodide.FS.isFile(stat.mode)) {
        files.push({
          path: fullPath,
          name: fullPath.replace(prefix, ""),
          size: stat.size,
          scope,
        });
      }
    }
  }
  files.sort((left, right) => left.name.localeCompare(right.name));
  return files;
}

async function captureRunArtifacts(pyodide: PyodideInstance) {
  await pyodide.runPythonAsync(`
import base64
import io
import json

__cursor_artifacts = json.dumps({
    "charts": [],
    "dataframePreview": None,
})

try:
    import pandas as pd
except Exception:
    pd = None

def _cursor_jsonable(cell):
    if cell is None:
        return None
    if pd is not None:
        try:
            if pd.isna(cell):
                return None
        except Exception:
            pass
        if isinstance(cell, (pd.Timestamp, pd.Period)):
            try:
                return cell.isoformat()
            except Exception:
                return str(cell)
        if isinstance(cell, pd.Timedelta):
            return str(cell)
    if isinstance(cell, (bool, int, float, str)):
        return cell
    try:
        import datetime as _dt
        if isinstance(cell, (_dt.datetime, _dt.date, _dt.time)):
            return cell.isoformat()
    except Exception:
        pass
    return str(cell)


dataframe_preview = None
if pd is not None:
    user_ns = globals().get("__cursor_user_ns", {})
    user_items = list(user_ns.items())
    for name, value in user_items:
        if isinstance(value, pd.DataFrame):
            try:
                preview = value.head(8).copy()
                preview = preview.where(pd.notnull(preview), None)
                rows = [
                    {str(column): _cursor_jsonable(row[column]) for column in preview.columns}
                    for _, row in preview.iterrows()
                ]
                dataframe_preview = {
                    "name": str(name),
                    "rowCount": int(value.shape[0]),
                    "columnCount": int(value.shape[1]),
                    "columns": [str(column) for column in value.columns.tolist()],
                    "rows": rows,
                }
            except Exception:
                dataframe_preview = None
            break

charts = []
try:
    import matplotlib.pyplot as plt

    for figure_number in plt.get_fignums():
        figure = plt.figure(figure_number)
        buffer = io.BytesIO()
        figure.savefig(buffer, format="png", bbox_inches="tight")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        charts.append({
            "id": f"figure-{figure_number}",
            "dataUrl": f"data:image/png;base64,{encoded}",
        })
    plt.close("all")
except Exception:
    charts = []

try:
    __cursor_artifacts = json.dumps({
        "charts": charts,
        "dataframePreview": dataframe_preview,
    }, default=str)
except Exception:
    __cursor_artifacts = json.dumps({
        "charts": charts,
        "dataframePreview": None,
    }, default=str)
`);

  const rawArtifacts = String(pyodide.globals.get("__cursor_artifacts") ?? "{}");
  const parsed = JSON.parse(rawArtifacts) as {
    charts?: ChartPreview[];
    dataframePreview?: DataFramePreview | null;
  };
  return {
    charts: parsed.charts ?? [],
    dataframePreview: parsed.dataframePreview ?? null,
  };
}

export function usePyodideRuntime({
  datasetResources,
  notebookOutputFolders,
}: UsePyodideRuntimeOptions): PyodideRuntime {
  const [state, setState] = useState<PyodideRuntimeState>("idle");
  const [message, setMessage] = useState<string>(
    "Warming up the in-browser Python runtime.",
  );
  const [files, setFiles] = useState<WorkspaceFileRecord[]>([]);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const bootstrappedRef = useRef(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const refreshFiles = useCallback(
    (pyodide: PyodideInstance) => {
      const next = listWorkspaceFiles(pyodide, notebookOutputFolders);
      setFiles(next);
      return next;
    },
    [notebookOutputFolders],
  );

  const load = useCallback(async (): Promise<void> => {
    if (bootstrappedRef.current && pyodideRef.current) {
      setState("ready");
      return;
    }
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }
    const promise = (async () => {
      try {
        setState("loading");
        setMessage("Loading the in-browser Python runtime and datasets. First load can take a moment.");
        await ensurePyodideScript();
        const pyodide =
          pyodideRef.current ??
          (await window.loadPyodide?.({
            indexURL: PYODIDE_INDEX_URL,
          }));
        if (!pyodide) {
          throw new Error("Pyodide did not initialise.");
        }
        pyodideRef.current = pyodide;
        await pyodide.loadPackage(["numpy", "pandas", "matplotlib"]);

        ensureDir(pyodide, "/workspace");
        ensureDir(pyodide, "/workspace/notebooks");
        ensureDir(pyodide, "/workspace/data");
        ensureDir(pyodide, "/workspace/data/uploads");
        for (const folder of notebookOutputFolders) {
          const cleaned = folder.replace(/^\/+/, "").replace(/^workspace\//, "");
          ensureDir(pyodide, `/workspace/${cleaned}`);
        }

        await Promise.all(
          datasetResources.map(async (resource) => {
            try {
              const response = await fetch(resource.href, { cache: "force-cache" });
              if (!response.ok) return;
              const bytes = new Uint8Array(await response.arrayBuffer());
              const filename = resource.href.split("/").pop();
              if (!filename) return;
              pyodide.FS.writeFile(`/workspace/data/${filename}`, bytes);
            } catch {
              // skip a single missing dataset
            }
          }),
        );

        await pyodide.runPythonAsync(`
import os
os.chdir("/workspace/notebooks")
`);

        bootstrappedRef.current = true;
        refreshFiles(pyodide);
        setState("ready");
        setMessage("Python is ready.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "The browser lab failed to start.");
      } finally {
        loadPromiseRef.current = null;
      }
    })();
    loadPromiseRef.current = promise;
    return promise;
  }, [datasetResources, notebookOutputFolders, refreshFiles]);

  const reload = useCallback(async (): Promise<void> => {
    // Discard any half-bootstrapped instance so the next load re-fetches the
    // CDN script and re-runs the package install. Useful when the first
    // attempt failed because of a network blip or the CDN being slow.
    bootstrappedRef.current = false;
    pyodideRef.current = null;
    loadPromiseRef.current = null;
    setState("idle");
    setMessage("Restarting the in-browser Python runtime.");
    await load();
  }, [load]);

  const run = useCallback(
    async (code: string): Promise<RunResult> => {
      if (!pyodideRef.current || !bootstrappedRef.current) {
        await load();
      }
      const pyodide = pyodideRef.current;
      if (!pyodide) {
        return {
          stdout: "",
          stderr: "Python runtime is not ready yet.",
          failed: true,
          dataPreview: null,
          charts: [],
          files,
        };
      }
      try {
        pyodide.globals.set("__user_code", code);
        await pyodide.runPythonAsync(`
import io
import sys
import builtins
import traceback

if "__cursor_user_ns" not in globals() or not isinstance(globals().get("__cursor_user_ns"), dict):
    __cursor_user_ns = {"__name__": "__main__", "__builtins__": builtins}
elif "__builtins__" not in __cursor_user_ns:
    __cursor_user_ns["__builtins__"] = builtins

_cursor_stdout = io.StringIO()
_cursor_stderr = io.StringIO()
_cursor_old_stdout = sys.stdout
_cursor_old_stderr = sys.stderr
sys.stdout = _cursor_stdout
sys.stderr = _cursor_stderr

try:
    _cursor_code_object = compile(__user_code, "<lab>", "exec")
    exec(_cursor_code_object, __cursor_user_ns)
    __cursor_stdout_output = _cursor_stdout.getvalue()
    __cursor_stderr_output = _cursor_stderr.getvalue()
except BaseException:
    __cursor_stdout_output = _cursor_stdout.getvalue()
    __cursor_stderr_output = _cursor_stderr.getvalue() + traceback.format_exc()
finally:
    sys.stdout = _cursor_old_stdout
    sys.stderr = _cursor_old_stderr
`);
        const stdout = String(pyodide.globals.get("__cursor_stdout_output") ?? "").trim();
        const stderr = String(pyodide.globals.get("__cursor_stderr_output") ?? "").trim();
        const failed = stderr.includes("Traceback (most recent call last)");
        let artifacts: { charts: ChartPreview[]; dataframePreview: DataFramePreview | null } = {
          charts: [],
          dataframePreview: null,
        };
        try {
          artifacts = await captureRunArtifacts(pyodide);
        } catch {
          // Artifact capture is best-effort. A failure here (for example a
          // DataFrame containing a value the JSON encoder cannot handle) must
          // never be reported as a user-block error.
          artifacts = { charts: [], dataframePreview: null };
        }
        let nextFiles = files;
        try {
          nextFiles = refreshFiles(pyodide);
        } catch {
          nextFiles = files;
        }
        return {
          stdout,
          stderr,
          failed,
          dataPreview: artifacts.dataframePreview,
          charts: artifacts.charts,
          files: nextFiles,
        };
      } catch (error) {
        return {
          stdout: "",
          stderr: error instanceof Error ? error.message : "Code execution failed.",
          failed: true,
          dataPreview: null,
          charts: [],
          files,
        };
      }
    },
    [files, load, refreshFiles],
  );

  const runValidation = useCallback(
    async (validationPython: string): Promise<ValidationResult | null> => {
      const pyodide = pyodideRef.current;
      if (!pyodide || !bootstrappedRef.current) return null;
      try {
        pyodide.globals.set("__cursor_task_validation_code", validationPython);
        await pyodide.runPythonAsync(`
import json
import builtins

if "__cursor_user_ns" not in globals() or not isinstance(globals().get("__cursor_user_ns"), dict):
    __cursor_user_ns = {"__name__": "__main__", "__builtins__": builtins}
elif "__builtins__" not in __cursor_user_ns:
    __cursor_user_ns["__builtins__"] = builtins

__cursor_user_ns["__cursor_task_passed"] = False
__cursor_user_ns["__cursor_task_message"] = "The check did not run."
__cursor_user_ns["__cursor_task_details"] = []
exec(compile(__cursor_task_validation_code, "<lab-check>", "exec"), __cursor_user_ns)
__cursor_task_result = json.dumps({
    "passed": bool(__cursor_user_ns.get("__cursor_task_passed", False)),
    "message": str(__cursor_user_ns.get("__cursor_task_message", "")),
    "details": [str(item) for item in (__cursor_user_ns.get("__cursor_task_details") or [])],
})
`);
        const raw = String(pyodide.globals.get("__cursor_task_result") ?? "{}");
        return JSON.parse(raw) as ValidationResult;
      } catch (error) {
        return {
          passed: false,
          message: error instanceof Error ? error.message : "Validation failed to run.",
          details: [],
        };
      }
    },
    [],
  );

  const writeUploadedBytes = useCallback(
    async (fileName: string, bytes: Uint8Array) => {
      if (!pyodideRef.current || !bootstrappedRef.current) {
        await load();
      }
      const pyodide = pyodideRef.current;
      if (!pyodide) return;
      ensureDir(pyodide, "/workspace/data/uploads");
      pyodide.FS.writeFile(`/workspace/data/uploads/${fileName}`, bytes);
      refreshFiles(pyodide);
    },
    [load, refreshFiles],
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]): Promise<string[]> => {
      if (!pyodideRef.current || !bootstrappedRef.current) {
        await load();
      }
      const pyodide = pyodideRef.current;
      if (!pyodide) return [];
      ensureDir(pyodide, "/workspace/data/uploads");
      const filesArray = Array.from(fileList);
      const written: string[] = [];
      await Promise.all(
        filesArray.map(async (file) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          pyodide.FS.writeFile(`/workspace/data/uploads/${file.name}`, bytes);
          written.push(file.name);
        }),
      );
      refreshFiles(pyodide);
      return written;
    },
    [load, refreshFiles],
  );

  const downloadFile = useCallback((file: WorkspaceFileRecord) => {
    const pyodide = pyodideRef.current;
    if (!pyodide) return;
    try {
      const bytes = pyodide.FS.readFile(file.path);
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const contentType =
        extension === "csv"
          ? "text/csv;charset=utf-8"
          : extension === "png"
            ? "image/png"
            : "application/octet-stream";
      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name.split("/").pop() ?? "output";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // best effort
    }
  }, []);

  return {
    state,
    message,
    files,
    load,
    reload,
    run,
    runValidation,
    uploadFiles,
    writeUploadedBytes,
    downloadFile,
  };
}
