---
name: testing-and-verification
description: Verify SaintClaw changes with targeted tests and practical validation steps that match the current repo baseline. Use when changing shared logic, access control, billing, runtime behavior, or when deciding what to test before handoff.
---

# Testing And Verification

## Quick Start

Use this skill before handoff or when a task changes shared logic.

1. Match the verification depth to the risk of the change.
2. Favor focused tests around control-plane logic over broad low-signal churn.
3. Validate org isolation, role capability rules, and billing behavior when relevant.
4. Run the lightest command set that gives confidence.

## Current Baseline

- Root tests are currently lightweight and centered on control-plane logic.
- `npm run test` targets `src/lib/control-plane.test.ts`.
- `npm run typecheck` and `npm run lint` are useful guards for app work.

## What To Test

- Access or role changes: capability checks and assignment visibility.
- Billing changes: balance math, insufficient funds, ledger alignment, idempotency.
- API route changes: auth boundary, org mismatch rejection, validation behavior.
- Runtime changes: lifecycle state, token persistence, path layout, and startup assumptions.

## Practical Rule

- If logic can be extracted to `src/lib`, do that and test there.
- If a route stays thin and mostly delegates, prefer testing the shared helper it calls.
- If no automated test is practical, document the exact manual checks performed.

## Handoff Standard

- Say what you ran.
- Say what you did not run.
- Call out any residual risk where coverage is still thin.
