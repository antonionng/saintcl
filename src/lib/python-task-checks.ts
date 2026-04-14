export type PythonTaskCheckMode = "auto" | "guided";

export type PythonTaskCheck = {
  id: string;
  checkpointSlug: string;
  title: string;
  prompt: string;
  inputHint: string;
  successCriteria: string;
  mode: PythonTaskCheckMode;
  notebookSlug: string;
  blockIndex: number;
  validationPython?: string;
};

const pythonTaskChecks: PythonTaskCheck[] = [
  {
    id: "setup-paths",
    checkpointSlug: "setup-sprint",
    title: "Confirm the setup paths",
    prompt: "Run the setup cell and make sure the notebook can see both the data folder and the output folder.",
    inputHint: "Use the Day 1 setup block. Keep `DATA_DIR` and `OUTPUT_DIR` available in the notebook state.",
    successCriteria: "The data folder exists, the output folder exists, and `transactions.csv` is visible through `DATA_DIR`.",
    mode: "auto",
    notebookSlug: "day1",
    blockIndex: 0,
    validationPython: `
from pathlib import Path

data_dir = globals().get("DATA_DIR")
output_dir = globals().get("OUTPUT_DIR")
transactions_path = None
if data_dir is not None:
    transactions_path = Path(data_dir) / "transactions.csv"

path_ok = data_dir is not None and output_dir is not None
file_ok = transactions_path is not None and transactions_path.exists()
output_ok = output_dir is not None and Path(output_dir).exists()

__cursor_task_passed = bool(path_ok and file_ok and output_ok)
__cursor_task_message = (
    "Setup is working. The notebook can see the training data and output folder."
    if __cursor_task_passed
    else "The setup cell has not prepared the data or output paths yet. Rerun the setup block and check the path variables."
)
__cursor_task_details = [
    f"DATA_DIR present: {data_dir is not None}",
    f"OUTPUT_DIR present: {output_dir is not None}",
    f"transactions.csv visible: {file_ok}",
]
`,
  },
  {
    id: "setup-triage-view",
    checkpointSlug: "setup-sprint",
    title: "Produce the first triage view",
    prompt: "Load the transaction extract and create the first triage output so you can inspect the shape, duplicates, and null profile.",
    inputHint: "Use the Day 1 analysis block and keep the `txns` and `triage` objects available.",
    successCriteria: "A transactions DataFrame is loaded and a non-empty triage summary is visible.",
    mode: "auto",
    notebookSlug: "day1",
    blockIndex: 1,
    validationPython: `
import pandas as pd

txns = globals().get("txns")
triage = globals().get("triage")

triage_ok = isinstance(triage, pd.DataFrame) and not triage.empty
txns_ok = isinstance(txns, pd.DataFrame) and not txns.empty and "txn_id" in txns.columns

__cursor_task_passed = bool(txns_ok and triage_ok)
__cursor_task_message = (
    "The first inspection outputs are in place."
    if __cursor_task_passed
    else "Load the transactions extract and create the triage summary before moving on."
)
__cursor_task_details = [
    f"Transactions loaded: {txns_ok}",
    f"Triage summary available: {triage_ok}",
]
`,
  },
  {
    id: "triage-judgement",
    checkpointSlug: "data-triage",
    title: "State the fitness judgement",
    prompt: "Write a short judgement on whether the extract is fit, partly fit, or not yet fit for first-pass analysis.",
    inputHint: "Use your notebook evidence, but make the judgement in your own words.",
    successCriteria: "You have a defensible judgement ready to explain to the facilitator.",
    mode: "guided",
    notebookSlug: "day1",
    blockIndex: 1,
  },
  {
    id: "triage-export",
    checkpointSlug: "data-triage",
    title: "Export the Day 1 triage output",
    prompt: "Export a Day 1 triage artefact so the output can be reviewed later.",
    inputHint: "The easiest path is to save `triage_summary.csv` or `rejects.csv` into `../outputs/day1`.",
    successCriteria: "At least one Day 1 triage output file exists in the output folder.",
    mode: "auto",
    notebookSlug: "day1",
    blockIndex: 1,
    validationPython: `
from pathlib import Path

output_dir = Path("/workspace/outputs/day1")
expected_files = ["triage_summary.csv", "rejects.csv"]
present_files = [name for name in expected_files if (output_dir / name).exists()]

__cursor_task_passed = bool(present_files)
__cursor_task_message = (
    "The Day 1 triage output has been exported."
    if __cursor_task_passed
    else "Save a Day 1 triage output into the output folder before completing this task."
)
__cursor_task_details = [f"Present files: {', '.join(present_files) if present_files else 'none'}"]
`,
  },
  {
    id: "kpi-join-build",
    checkpointSlug: "kpi-build",
    title: "Build the branch KPI table",
    prompt: "Join the core tables and produce a branch KPI output that is business-readable.",
    inputHint: "Use the Day 2 analysis block and keep `branch_kpi` available.",
    successCriteria: "A non-empty `branch_kpi` table exists with the main KPI columns.",
    mode: "auto",
    notebookSlug: "day2",
    blockIndex: 1,
    validationPython: `
import pandas as pd

branch_kpi = globals().get("branch_kpi")
expected_columns = {"region", "branch_id", "txn_count", "total_fee_sar", "avg_ticket_sar"}

table_ok = isinstance(branch_kpi, pd.DataFrame) and not branch_kpi.empty
columns_ok = table_ok and expected_columns.issubset(set(branch_kpi.columns))

__cursor_task_passed = bool(table_ok and columns_ok)
__cursor_task_message = (
    "The branch KPI table is ready for review."
    if __cursor_task_passed
    else "Build a non-empty branch_kpi table with the expected KPI columns."
)
__cursor_task_details = [
    f"Table exists: {table_ok}",
    f"Expected columns present: {columns_ok}",
]
`,
  },
  {
    id: "kpi-export-pack",
    checkpointSlug: "kpi-build",
    title: "Export the Day 2 KPI pack",
    prompt: "Save the KPI, monthly metrics, and data-quality outputs for the Day 2 checkpoint.",
    inputHint: "The participant notebook already points to `../outputs/day2`.",
    successCriteria: "The Day 2 output folder contains `branch_kpi.csv`, `monthly_metrics.csv`, and `dq_report.csv`.",
    mode: "auto",
    notebookSlug: "day2",
    blockIndex: 1,
    validationPython: `
from pathlib import Path

output_dir = Path("/workspace/outputs/day2")
expected_files = ["branch_kpi.csv", "monthly_metrics.csv", "dq_report.csv"]
present_files = [name for name in expected_files if (output_dir / name).exists()]

__cursor_task_passed = len(present_files) == len(expected_files)
__cursor_task_message = (
    "The Day 2 KPI pack has been exported."
    if __cursor_task_passed
    else "Export the KPI, monthly metrics, and data-quality files before completing this task."
)
__cursor_task_details = [f"Present files: {', '.join(present_files) if present_files else 'none'}"]
`,
  },
  {
    id: "kpi-quality-story",
    checkpointSlug: "kpi-build",
    title: "Explain the quality story",
    prompt: "Summarize the main quality caveat or assumption that should travel with the KPI pack.",
    inputHint: "Base this on duplicates, invalid regions, or any transformation assumption from the notebook.",
    successCriteria: "You can explain one material quality caveat in business language.",
    mode: "guided",
    notebookSlug: "day2",
    blockIndex: 1,
  },
  {
    id: "report-chart-pack",
    checkpointSlug: "reporting-pack",
    title: "Generate the reporting chart pack",
    prompt: "Create the main Day 3 reporting outputs and save the chart pack.",
    inputHint: "Use the Day 3 reporting block and check the output folder after the run.",
    successCriteria: "The chart pack file exists and is non-empty.",
    mode: "auto",
    notebookSlug: "day3",
    blockIndex: 1,
    validationPython: `
from pathlib import Path

chart_file = Path("/workspace/outputs/day3_pack/pack_charts.png")
__cursor_task_passed = chart_file.exists() and chart_file.stat().st_size > 0
__cursor_task_message = (
    "The chart pack is ready."
    if __cursor_task_passed
    else "Generate and save pack_charts.png before completing this task."
)
__cursor_task_details = [f"Chart file present: {chart_file.exists()}"]
`,
  },
  {
    id: "report-exception-log",
    checkpointSlug: "reporting-pack",
    title: "Export the exception log",
    prompt: "Create a transparent exception view and save it with reason codes.",
    inputHint: "Use the Day 3 notebook path that produces `exceptions.csv`.",
    successCriteria: "An `exceptions.csv` file exists with a `reason_code` column and at least one row.",
    mode: "auto",
    notebookSlug: "day3",
    blockIndex: 1,
    validationPython: `
from pathlib import Path
import pandas as pd

exception_file = Path("/workspace/outputs/day3_pack/exceptions.csv")
if exception_file.exists():
    exceptions_df = pd.read_csv(exception_file)
else:
    exceptions_df = None

has_rows = exceptions_df is not None and not exceptions_df.empty
has_reason_code = has_rows and "reason_code" in exceptions_df.columns

__cursor_task_passed = bool(has_rows and has_reason_code)
__cursor_task_message = (
    "The exception log is ready for review."
    if __cursor_task_passed
    else "Export exceptions.csv with at least one flagged record and a reason_code column."
)
__cursor_task_details = [
    f"File present: {exception_file.exists()}",
    f"Rows present: {has_rows}",
    f"reason_code present: {has_reason_code}",
]
`,
  },
  {
    id: "report-handoff-features",
    checkpointSlug: "reporting-pack",
    title: "Prepare the ML handoff file",
    prompt: "Save the Day 3 feature output that could be used in a downstream modelling handoff.",
    inputHint: "Use the Day 3 output folder and keep the exported handoff artefact reviewable.",
    successCriteria: "A non-empty `features.csv` file exists in the Day 3 output folder.",
    mode: "auto",
    notebookSlug: "day3",
    blockIndex: 1,
    validationPython: `
from pathlib import Path
import pandas as pd

features_file = Path("/workspace/outputs/day3_pack/features.csv")
if features_file.exists():
    features_df = pd.read_csv(features_file)
else:
    features_df = None

__cursor_task_passed = features_df is not None and not features_df.empty
__cursor_task_message = (
    "The ML handoff file is ready."
    if __cursor_task_passed
    else "Export a non-empty features.csv file before completing this task."
)
__cursor_task_details = [
    f"File present: {features_file.exists()}",
    f"Rows present: {features_df is not None and not features_df.empty}",
]
`,
  },
  {
    id: "report-leadership-takeaway",
    checkpointSlug: "reporting-pack",
    title: "Prepare the leadership takeaway",
    prompt: "Summarize the one decision-ready insight you would carry into a leadership readout.",
    inputHint: "Use the charts, exception log, and feature handoff as evidence.",
    successCriteria: "You can explain the takeaway, the evidence, and the caveat clearly.",
    mode: "guided",
    notebookSlug: "day3",
    blockIndex: 1,
  },
];

export const pythonTaskChecksByCheckpoint = pythonTaskChecks.reduce<Record<string, PythonTaskCheck[]>>((accumulator, task) => {
  if (!accumulator[task.checkpointSlug]) {
    accumulator[task.checkpointSlug] = [];
  }
  accumulator[task.checkpointSlug].push(task);
  return accumulator;
}, {});

export function resolvePythonTaskChecksForCheckpoint(checkpointSlug: string) {
  return pythonTaskChecksByCheckpoint[checkpointSlug] ?? [];
}
