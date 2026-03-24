---
name: nextjs-supabase-patterns
description: Build SaintClaw features in Next.js App Router using Supabase-backed org-scoped data access, capability checks, and route validation. Use when adding dashboard pages, API routes, server-side data access, or authenticated product features.
---

# Next.js Supabase Patterns

## Quick Start

Use this skill for dashboard features and app-side APIs.

1. Start from the current org session, not from client-supplied org context.
2. Gate sensitive flows with capability checks before doing any data work.
3. Reuse `src/lib/dal.ts` patterns for org-scoped reads and helper composition.
4. Validate API payloads early with `zod`.

## Preferred Patterns

- Use `getCurrentOrg()` at the route or page boundary for authenticated flows.
- Derive `orgId` from the session whenever possible.
- Keep database access in `src/lib` helpers when logic is shared or non-trivial.
- Return consistent `NextResponse.json({ error: { message } }, { status })` responses for failures.
- Upsert org foundation records when introducing new org-owned resources that must exist by default.

## Route Checklist

- Authenticate first.
- Verify the session can perform the action.
- Reject org mismatch between session and payload.
- Parse input with `zod`.
- Use admin/server Supabase clients intentionally.
- Return minimal, explicit response shapes.

## Avoid

- Trusting client-provided `orgId` without session checks.
- Duplicating DAL logic in many route handlers.
- Mixing access control and data mutation in a way that hides the permission boundary.
- Putting complex business rules directly in client components.

## Verification

- Run `npm run typecheck` after substantial feature changes.
- Run `npm run test` when changing shared app logic such as access, billing, or org behavior.
