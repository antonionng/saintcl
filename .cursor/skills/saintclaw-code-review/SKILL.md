---
name: saintclaw-code-review
description: Review SaintClaw changes for correctness, tenant isolation, auth safety, billing integrity, runtime governance, and missing verification. Use when the user asks for a review or when examining risky app, schema, or runtime changes.
---

# SaintClaw Code Review

## Review Priorities

Order findings by severity and focus on defects before summaries.

1. Tenant isolation and org mismatch bugs
2. Missing auth or capability checks
3. RLS and app-side access-control drift
4. Billing correctness and duplicate-charge risk
5. Runtime lifecycle, token, or command-governance regressions
6. Missing tests for risky logic

## Project-Specific Checks

- Does the change preserve org scoping end to end?
- Do app routes and Supabase policies still agree?
- Could a non-admin reach billing, admin tools, or console operations?
- Could terminal execution bypass blocked commands or repo allowlists?
- Could runtime state or gateway config drift across tenants?
- Could ledger and wallet balance become inconsistent?

## Review Output

- Findings first, with file references.
- Open questions or assumptions second.
- Brief summary last, only if useful.

## Residual Risk

Call out thin coverage explicitly when a change affects:

- billing
- auth or role logic
- tenant runtime lifecycle
- terminal approval or execution
- schema and RLS
