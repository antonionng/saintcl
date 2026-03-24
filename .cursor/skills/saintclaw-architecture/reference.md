# SaintClaw Architecture Reference

## Product Shape

SaintClaw is a control plane for managed OpenClaw runtimes.

- `src/app`: product UI, dashboard pages, and API endpoints.
- `src/lib/dal.ts`: authenticated org session bootstrap and data helpers.
- `src/lib/openclaw/*`: runtime lifecycle, tenant paths, console routing, audit, and governance.
- `supabase/migrations/*`: durable schema, RLS, and audit-trigger rules.
- `openclaw-vendored/`: upstream snapshot with narrowly scoped SaintClaw patch areas.

## Ownership Heuristic

Use this routing rule before editing:

- If the change is about UI, billing surfaces, org settings, or product APIs, keep it in SaintClaw app code.
- If the change is about tenant runtime lifecycle or workspace layout, keep it in `src/lib/openclaw`.
- If the change is about durable access rules or data structure, write a new Supabase migration.
- If the change must alter OpenClaw runtime behavior itself, consider `openclaw-vendored`.

## Architecture Checklist

- Is the feature org-scoped end to end?
- Does the route re-check session capabilities?
- Does the schema enforce the same boundary as the app?
- Is the change SaintClaw-specific or truly runtime-native?
- Will this increase future re-vendor pain?
