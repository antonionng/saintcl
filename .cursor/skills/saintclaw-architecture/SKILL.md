---
name: saintclaw-architecture
description: Understand the SaintClaw control plane, including the Next.js app, Supabase org-scoped data layer, tenant OpenClaw runtime management, and the vendored OpenClaw boundary. Use when planning features, tracing ownership, or deciding which layer should change.
---

# SaintClaw Architecture

## Quick Start

Use this skill when a task spans multiple layers or when it is unclear where a change belongs.

1. Identify the owning layer before editing.
2. Preserve org scoping and capability checks.
3. Prefer SaintClaw wrappers over direct `openclaw-vendored` edits.
4. Keep hosted gateway concerns separate from app UI concerns.

## Layer Map

- `src/app`: dashboard pages, App Router routes, and user-facing product flows.
- `src/lib/dal.ts`: org session bootstrap and app-side data access patterns.
- `src/lib/openclaw/*`: tenant runtime ownership, path resolution, gateway targeting, and governance.
- `supabase/migrations/*`: schema, RLS, triggers, and audit-sensitive persistence rules.
- `openclaw-vendored/`: upstream snapshot plus SaintClaw runtime patches.

## Ownership Rules

- Dashboard behavior, billing surfaces, org policy UIs, and API routes usually belong in `src/app` or `src/lib`.
- Tenant runtime state, tokens, logs, and workspace layout belong in `src/lib/openclaw`.
- Supabase schema changes belong in new migrations, not ad hoc app-side workarounds.
- Upstream-gateway behavior belongs in `openclaw-vendored` only if SaintClaw cannot solve it via configuration, wrappers, or proxying.

## Default Safety Checks

- Read `getCurrentOrg()` and role capability usage before changing access-sensitive flows.
- Keep one-runtime-per-org assumptions intact.
- Treat terminal execution, billing, and admin console access as high-risk surfaces.
- Avoid coupling SaintClaw product logic to vendor internals unless the change is clearly runtime-native.

## Additional Resources

- See [reference.md](reference.md) for a concise architecture map and change-routing checklist.
