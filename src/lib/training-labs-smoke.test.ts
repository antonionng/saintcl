import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { pythonTaskChecksByCheckpoint } from "@/lib/python-task-checks";
import {
  isWorkbenchTask,
  resolveTrainingLabCheckpoints,
  type TrainingLabCheckpoint,
} from "@/lib/training-lab-checkpoints";
import { getLabCoachPersona } from "@/lib/training-lab-personas";

// End-to-end self-serve smoke test for the four python-for-data labs. The
// goal is to fail loudly the moment any wiring drifts so a participant
// could end up unable to complete a lab without a facilitator. Each lab is
// audited along the same dimensions covered by the manual audit:
//
//   1. Four-step loop tasks all present (brief, engage auto, note, defend)
//   2. leadership question + at least one challenge question
//   3. Per-lab persona resolves
//   4. At least one PythonTaskCheck exists for the checkpoint slug
//   5. The notebook file exists and has a code cell at blockIndex
//   6. Validation snippets reference files the engage block writes
//      (avoids the "verify cannot pass without facilitator help" bug)

const MODULE_SLUG = "python-for-data";

const NOTEBOOK_FILES: Record<string, string> = {
  day1: "python-training/notebooks/day1_python_foundations.ipynb",
  day2: "python-training/notebooks/day2_numpy_pandas_core.ipynb",
  day3: "python-training/notebooks/day3_reporting_and_handoff.ipynb",
};

type NotebookCell = {
  cell_type: string;
  source: string | string[];
};

function loadCodeCells(notebookSlug: string): string[] {
  const file = NOTEBOOK_FILES[notebookSlug];
  if (!file) {
    throw new Error(`Unknown notebookSlug ${notebookSlug}`);
  }
  const path = join(process.cwd(), file);
  if (!existsSync(path)) {
    throw new Error(`Notebook missing on disk: ${path}`);
  }
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as { cells?: NotebookCell[] };
  const cells = parsed.cells ?? [];
  return cells
    .filter((cell) => cell.cell_type === "code")
    .map((cell) =>
      Array.isArray(cell.source) ? cell.source.join("") : cell.source,
    );
}

function findBriefTask(checkpoint: TrainingLabCheckpoint) {
  return (checkpoint.tasks ?? []).find(
    (task) => isWorkbenchTask(task) && task.id.endsWith("-brief"),
  );
}

function findNoteTask(checkpoint: TrainingLabCheckpoint) {
  return (checkpoint.tasks ?? []).find(
    (task) => isWorkbenchTask(task) && task.id.endsWith("-note-issue"),
  );
}

function findDefendTask(checkpoint: TrainingLabCheckpoint) {
  return (checkpoint.tasks ?? []).find(
    (task) => isWorkbenchTask(task) && task.id.endsWith("-defend"),
  );
}

function findEngageTask(checkpoint: TrainingLabCheckpoint) {
  return (checkpoint.tasks ?? []).find(
    (task) => !isWorkbenchTask(task) && task.mode === "auto",
  );
}

describe("python-for-data labs are wired for self-serve completion", () => {
  const checkpoints = resolveTrainingLabCheckpoints(MODULE_SLUG);

  it("exposes exactly four python labs with the lab- prefix", () => {
    const labCheckpoints = checkpoints.filter((c) => c.slug.startsWith("lab-"));
    expect(labCheckpoints).toHaveLength(4);
    expect(labCheckpoints.map((c) => c.slug)).toEqual([
      "lab-a-triage",
      "lab-b-kpi",
      "lab-c-pack",
      "lab-d-handoff",
    ]);
  });

  for (const slug of ["lab-a-triage", "lab-b-kpi", "lab-c-pack", "lab-d-handoff"]) {
    describe(`${slug}`, () => {
      const checkpoint = checkpoints.find((c) => c.slug === slug);

      it("is registered under python-for-data", () => {
        expect(checkpoint, `Expected ${slug} in python-for-data`).toBeDefined();
      });

      if (!checkpoint) return;

      it("has a leadership question and at least one challenge question", () => {
        expect(checkpoint.leadershipQuestion?.trim().length ?? 0).toBeGreaterThan(0);
        expect(checkpoint.challengeQuestions?.length ?? 0).toBeGreaterThan(0);
      });

      it("has all four loop tasks (brief, engage auto, note, defend) with non-empty prompts", () => {
        const brief = findBriefTask(checkpoint);
        const note = findNoteTask(checkpoint);
        const defend = findDefendTask(checkpoint);
        const engage = findEngageTask(checkpoint);

        expect(brief, "missing brief workbench task").toBeDefined();
        expect(note, "missing note-issue workbench task").toBeDefined();
        expect(defend, "missing defend workbench task").toBeDefined();
        expect(engage, "missing engage auto python task").toBeDefined();

        for (const task of [brief, note, defend]) {
          if (!task || !isWorkbenchTask(task)) continue;
          expect(task.prompt.trim().length).toBeGreaterThan(0);
          expect(task.successCriteria.length).toBeGreaterThan(0);
        }
      });

      it("resolves a coach persona", () => {
        const persona = getLabCoachPersona(MODULE_SLUG, slug);
        expect(persona, `no persona registered for ${slug}`).not.toBeNull();
      });

      it("has at least one PythonTaskCheck for the checkpoint slug", () => {
        const checks = pythonTaskChecksByCheckpoint[slug] ?? [];
        expect(checks.length).toBeGreaterThan(0);
      });

      it("notebook file exists and has a code cell at blockIndex", () => {
        const cells = loadCodeCells(checkpoint.notebookSlug);
        expect(cells.length).toBeGreaterThan(checkpoint.blockIndex);
        expect(cells[checkpoint.blockIndex].trim().length).toBeGreaterThan(0);
      });

      it("validation snippet expectations are satisfied by the engage notebook block", () => {
        // Pull the auto-validated python check for this lab and confirm
        // every output file it asserts on is actually written by the engage
        // code path. The engage path is codeBlocks[0] (setup, prepended at
        // run time) plus codeBlocks[blockIndex]. This catches the class of
        // bug the audit found in Lab A and Lab D where the verify step
        // demanded a file no notebook block produced.
        const checks = pythonTaskChecksByCheckpoint[slug] ?? [];
        const autoCheck = checks[0];
        expect(autoCheck).toBeDefined();
        if (!autoCheck) return;

        const validation = autoCheck.validationPython ?? "";
        const expectedFiles = Array.from(
          validation.matchAll(/"([\w./-]+\.csv|[\w./-]+\.png)"/g),
        )
          .map((match) => match[1])
          .filter((name) => !name.includes("/")); // basenames only
        if (expectedFiles.length === 0) return;

        const cells = loadCodeCells(checkpoint.notebookSlug);
        const setup = cells[0] ?? "";
        const engage = cells[checkpoint.blockIndex] ?? "";
        const combined = `${setup}\n${engage}`;

        for (const filename of expectedFiles) {
          expect(
            combined.includes(filename),
            `Engage block for ${slug} never writes ${filename}; participant cannot pass auto-check unaided.`,
          ).toBe(true);
        }
      });
    });
  }
});
