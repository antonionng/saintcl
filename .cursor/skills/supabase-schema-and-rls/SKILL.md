---
name: supabase-schema-and-rls
description: Add or modify SaintClaw Supabase schema, row-level security, org-scoped policies, and audit-friendly persistence. Use when writing migrations, introducing new tables, or changing tenant data access rules.
---

# Supabase Schema And RLS

## Quick Start

Use this skill for migrations and tenant data model changes.

1. Add schema in a new migration under `supabase/migrations/`.
2. Make org ownership explicit with `org_id` where the data is tenant-scoped.
3. Enable RLS and add policies that mirror SaintClaw session rules.
4. Add update timestamps and audit hooks for important records.

## Default Schema Rules

- Tenant-owned tables should usually reference `public.orgs(id)` with `on delete cascade`.
- Admin-only writes should usually rely on `public.is_org_admin()`.
- Org reads should usually scope through `public.current_org_id()`.
- Use `created_at` and `updated_at` on mutable business records.
- Keep metadata extensible with `jsonb` only when the shape is genuinely flexible.

## Policy Rules

- Add `select` policies for org visibility.
- Add `insert` and `update` policies explicitly. Do not rely on implicit behavior.
- Use `with check` for inserts and `using` for updates where appropriate.
- Keep policy names clear and table-specific.

## High-Risk Areas

- Billing tables
- Policy and guardrail tables
- Runtime metadata
- Approval and audit records

## Verification

- Review policy parity with app-side capability checks.
- Confirm the migration initializes any required foundation records.
- See [reference.md](reference.md) for a migration checklist and SQL skeleton.
