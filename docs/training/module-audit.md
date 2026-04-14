# Training Module Audit

## Summary

This audit checks all seven training modules across deck assets, workbooks, facilitator materials, notebook and dataset references, checkpoint wiring, delivery registry entries, and participant route support.

## Overall Status

| Module | Status | Result | Notes |
| --- | --- | --- | --- |
| `python-for-data` | `ready` | Needs follow-up | Slug and asset route mismatch. Guide missing from delivery resources. |
| `machine-learning-training` | `scheduled` | Pass | Assets and checkpoint wiring are present. |
| `neural-networks` | `scheduled` | Pass | Assets and checkpoint wiring are present. |
| `business-applications-in-ai` | `draft` | Pass with follow-up | Delivery registry and tests are out of sync. |
| `automation-in-ai` | `draft` | Pass with follow-up | Delivery registry and tests are out of sync. |
| `advanced-data-visualization` | `draft` | Pass with follow-up | Delivery registry and tests are out of sync. |
| `ai-in-banking-and-finance` | `draft` | Pass with follow-up | Delivery registry and tests are out of sync. |

## Audit Checklist

Each module was checked for:

1. Root `index.html`
2. `participant-workbook.md`
3. `facilitator-guide.md`
4. All notebooks referenced in `src/lib/training.ts`
5. All datasets referenced in `src/lib/training.ts`
6. `solutions.ipynb` when referenced
7. Lab checkpoints in `src/lib/training-lab-checkpoints.ts`
8. Task checks in `src/lib/python-task-checks.ts` when applicable
9. Facilitator console and module-specific facilitator kit
10. `trainingModuleDeliveryMap` coverage
11. Static routes and participant or facilitator pages
12. Participant experience wiring

## Module Findings

### `python-for-data`

| Check | Result | Evidence |
| --- | --- | --- |
| Deck route and root asset | Follow-up | Content lives in `python-training/index.html`, not `python-for-data/index.html` |
| Workbook | Pass | `python-training/participant-workbook.md` |
| Facilitator guide | Pass | `python-training/facilitator-guide.md` |
| Notebook references | Pass | `python-training/notebooks/*.ipynb` |
| Dataset references | Pass | `python-training/data/*.csv` |
| Solution notebook | Pass | `python-training/notebooks/solutions.ipynb` |
| Checkpoints | Pass | `src/lib/training-lab-checkpoints.ts` |
| Task checks | Pass | `src/lib/python-task-checks.ts` |
| Facilitator console and notes | Pass | `src/components/training/python-facilitator-console.tsx`, `src/lib/python-training-facilitator.ts` |
| Delivery map | Pass with follow-up | `src/lib/training.ts` points to `/python-training/...` assets |
| Static and facilitator routes | Follow-up | `src/app/python-training/[[...path]]/route.ts` exists, but no slug-aligned `src/app/python-for-data/[[...path]]/route.ts` |
| Participant experience | Pass | `python-workspace` is wired through `PythonParticipantModuleExperience` |

Follow-up items:

- Align `python-for-data` slug with the on-disk `python-training` route, or add a compatibility route.
- Add the facilitator guide to `trainingModuleDeliveryMap.resources`.
- Reconcile `labCount: 8` with the four coded interactive checkpoints.

### `machine-learning-training`

All twelve checks pass. Assets, checkpoints, facilitator console, static route, and checkpoint participant flow are all present and aligned.

### `neural-networks`

All twelve checks pass. Assets, checkpoints, facilitator console, static route, and checkpoint participant flow are all present and aligned.

### `business-applications-in-ai`

All twelve checks pass functionally. Follow-up items:

- `src/lib/training.test.ts` still expects the participant experience to be `deck`, while `src/lib/training.ts` sets it to `checkpoint`.
- `facilitator-guide.md` and `solution-guide.md` exist on disk but are not fully surfaced in `trainingModuleDeliveryMap.resources`.

### `automation-in-ai`

All twelve checks pass functionally. Follow-up items:

- `src/lib/training.test.ts` still expects the participant experience to be `deck`, while `src/lib/training.ts` sets it to `checkpoint`.
- `facilitator-guide.md` and `solution-guide.md` exist on disk but are not fully surfaced in `trainingModuleDeliveryMap.resources`.

### `advanced-data-visualization`

All twelve checks pass functionally. Follow-up items:

- `src/lib/training.test.ts` still expects the participant experience to be `deck`, while `src/lib/training.ts` sets it to `checkpoint`.
- `facilitator-guide.md` and `solution-guide.md` exist on disk but are not fully surfaced in `trainingModuleDeliveryMap.resources`.

### `ai-in-banking-and-finance`

All twelve checks pass functionally. Follow-up items:

- `src/lib/training.test.ts` still expects the participant experience to be `deck`, while `src/lib/training.ts` sets it to `checkpoint`.
- `facilitator-guide.md` and `solution-guide.md` exist on disk but are not fully surfaced in `trainingModuleDeliveryMap.resources`.
- Blueprint metadata still suggests four labs while the blueprint `labs` array only lists one named lab.

## Recommended Fixes

1. Fix the module delivery registry drift:
   - Update `src/lib/training.test.ts` to match the current checkpoint-based participant experience.
   - Add missing facilitator guide links to `trainingModuleDeliveryMap.resources`.
2. Fix the Python module naming drift:
   - Either rename `python-training` assets to `python-for-data`, or add a slug-aligned public route.
3. Leave the draft modules on the checkpoint flow for now:
   - They already have the assets and wiring needed for the current participant portal.
   - The IDE work should focus first on the Python workspace and later expand to modules that truly need executable notebooks.
