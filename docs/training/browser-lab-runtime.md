# Browser Lab Runtime Specification

## Goal

Provide each named participant with a managed browser workspace that supports AJB training labs across Python, machine learning, and neural networks without forcing local setup.

## Design Principles

- One workspace per participant per lab session
- Save progress centrally so participants can resume
- Keep datasets, notebooks, and outputs scoped to the participant
- Support higher-compute modules later without changing the portal shell
- Surface runtime health to facilitators

## Runtime Tiers

### Tier 1. Python Foundations

Use a lightweight notebook-ready Python image for:
- Python for Data
- early machine learning exercises
- visualisation notebooks

Default stack:
- Python
- Jupyter-compatible notebook runtime
- pandas
- numpy
- matplotlib
- seaborn
- scikit-learn

### Tier 2. Machine Learning

Extend the Python image with:
- scikit-learn
- xgboost or lightgbm if required later
- model evaluation utilities
- larger memory allocation for training and cross-validation

### Tier 3. Neural Networks

Add a stronger runtime profile for:
- tensorflow or pytorch workloads
- transfer learning exercises
- heavier notebook execution

This tier should be configurable so the portal can route only the relevant labs to the stronger runtime.

## Workspace Lifecycle

1. Participant opens a lab from the module route
2. Portal creates or resumes a `training_lab_workspaces` record
3. Runtime is provisioned with module image, datasets, and notebook assets
4. Portal stores launch URL, heartbeat, and status
5. Progress events are emitted during launch, save, complete, and submit actions
6. Facilitators can inspect and restart failed workspaces

## Required Events

- `lab_launched`
- `workspace_ready`
- `checkpoint_saved`
- `lab_completed`
- `assessment_submitted`
- `workspace_error`

## Data Attachments

Each workspace should mount:
- module datasets
- participant notebook copy
- optional reference notebook for facilitators only
- writable output folder

## Recovery Rules

- Resume the most recent active workspace if available
- If workspace health checks fail, create a replacement and preserve output artifacts if possible
- Show facilitators which participants are blocked by runtime issues

## Security and Governance

- Training data should remain synthetic or explicitly approved
- Participant workspaces should be isolated from one another
- Facilitator access to participant workspaces should be auditable
- Runtime images should be versioned per module

## MVP Recommendation

Start with a Python-first managed notebook runtime for:
- Python for Data
- Machine Learning Training
- Neural Networks

Design the workspace abstraction so later modules can swap runtime profiles without changing the participant route structure or progress model.
