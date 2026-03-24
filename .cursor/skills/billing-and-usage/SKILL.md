---
name: billing-and-usage
description: Change SaintClaw wallet billing, usage charging, ledger writes, and Stripe-backed top-up flows safely. Use when editing wallet balance logic, usage events, low-balance behavior, pricing, or Stripe webhook processing.
---

# Billing And Usage

## Quick Start

Use this skill for wallet, ledger, and usage changes.

1. Keep wallet balance and ledger writes consistent.
2. Record usage events and monetary effects as separate but aligned facts.
3. Use idempotency for Stripe event handling.
4. Preserve org scoping and admin access around billing operations.

## Core Rules

- Call `ensureWallet()` before relying on wallet state.
- Use `assertCanSpend()` before debit-driven product actions.
- Do not mutate wallet balances without also writing a ledger record.
- Keep `sourceType`, `description`, and `metadata` coherent across related records.
- Use `reserveStripeEvent()` to prevent duplicate webhook effects.

## Data Model Expectations

- `org_wallets`: current balance and thresholds.
- `wallet_ledger`: immutable monetary history.
- `usage_events`: product usage facts and spend attribution.
- `stripe_events`: webhook idempotency fence.

## High-Risk Changes

- Pricing changes
- Debit and credit math
- Stripe webhook retries
- Low-balance logic
- Any change that could create double charges or silent balance drift

## Verification

- Re-test balance math.
- Review duplicate-event handling.
- Check that insufficient-balance failures still short-circuit correctly.
