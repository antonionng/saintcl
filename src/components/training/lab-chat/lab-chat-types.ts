import type { ChartPreview, DataFramePreview } from "@/components/training/output-panel";
import type { WorkspaceFileRecord } from "@/components/training/file-explorer";

export type LabChatRunStatus = "running" | "ok" | "failed";

export type LabChatVerdictStatus = "passed" | "retry" | "started" | "completed";

export type LabChatMessage =
  | {
      id: string;
      kind: "system_brief";
      title: string;
      description: string;
      successCriteria: string[];
      facilitatorPrompt: string | null;
      createdAt: string;
    }
  | {
      id: string;
      kind: "system_note";
      tone: "info" | "warn" | "success";
      text: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: "system_dataset";
      datasetLabel: string;
      datasetSource: "module" | "uploaded";
      pathHint: string | null;
      createdAt: string;
    }
  | {
      id: string;
      kind: "user_text";
      text: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: "assistant_reply";
      text: string;
      createdAt: string;
      isPending?: boolean;
    }
  | {
      id: string;
      kind: "assistant_error";
      text: string;
      // Original prompt + intent that produced this error so the UI can
      // re-send it without the learner having to retype anything.
      retryPrompt?: string | null;
      retryExtraSystem?: string | null;
      // Raw upstream message (Zod, OpenRouter, network) — only shown
      // behind a "Show details" toggle.
      detail?: string | null;
      createdAt: string;
    }
  | {
      id: string;
      kind: "code_run";
      label: string | null;
      code: string;
      status: LabChatRunStatus;
      stdout: string;
      stderr: string;
      dataPreview: DataFramePreview | null;
      charts: ChartPreview[];
      files: WorkspaceFileRecord[];
      createdAt: string;
    }
  | {
      id: string;
      kind: "checkpoint_event";
      status: LabChatVerdictStatus;
      title: string;
      detail: string | null;
      details: string[];
      createdAt: string;
    };

export type AttachedDataset = {
  id: string;
  label: string;
  source: "module" | "uploaded";
  /** Best-guess Python path inside the in-browser workspace, e.g. `/workspace/data/transactions.csv`. */
  workspacePath: string | null;
};
