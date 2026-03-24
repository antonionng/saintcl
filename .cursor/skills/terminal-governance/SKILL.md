---
name: terminal-governance
description: Maintain SaintClaw's governed terminal execution model, including admin-only access, approval flow, command blocking, repo allowlists, and audit logging. Use when changing terminal APIs, command approval logic, or runtime command execution.
---

# Terminal Governance

## Quick Start

Use this skill when working on terminal request or approval flows.

1. Keep terminal access restricted to tenant admins.
2. Validate payloads and reject org mismatches.
3. Enforce command and repo restrictions before execution.
4. Preserve approval records, run records, and runtime audit events.

## Core Flow

- `request`: store a pending approval and audit the request.
- `approve`: start the runtime if needed, execute in the agent workspace, persist approval and run records, and audit execution.

## Guardrails

- Reuse `assertAdminRole()`, `assertCommandAllowed()`, and `assertRepoAllowed()`.
- Treat command-block patterns as a safety boundary, not a convenience layer.
- Keep execution cwd scoped through `getAgentWorkspacePath()`.
- Store short stdout and stderr excerpts for history, but return full command output only where intended.

## Review Checklist

- Can a non-admin reach this path?
- Can a caller spoof another org?
- Can a blocked command slip through?
- Can an unapproved repo bypass allowlists?
- Is every request or execution reflected in audit data?

## Avoid

- Broadening command allowlists casually.
- Running commands outside the agent workspace boundary.
- Skipping approval persistence because the execution path already succeeded.
