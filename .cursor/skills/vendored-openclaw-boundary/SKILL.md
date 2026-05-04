---
name: vendored-openclaw-boundary
description: Decide when SaintAGI should wrap or configure the vendored OpenClaw snapshot instead of patching it directly. Use when a task touches `openclaw-vendored`, upstream compatibility, rebuild requirements, or long-term upgrade safety.
---

# Vendored OpenClaw Boundary

## Quick Start

Use this skill before editing `openclaw-vendored`.

1. Ask whether the change is truly runtime-native or just SaintAGI-specific orchestration.
2. Prefer wrappers, config, proxying, or metadata in `src/lib/openclaw` first.
3. Patch the vendor snapshot only when the runtime itself must change.
4. Keep future upstream sync cost in mind.

## Good Reasons To Stay In SaintAGI

- Tenant runtime ownership
- Org-aware governance
- Dashboard or billing behavior
- Gateway targeting and admin console routing
- Repo allowlists and approval workflows

## Good Reasons To Touch The Vendor

- Missing OpenClaw capability that SaintAGI cannot layer on top
- Gateway behavior that must exist inside the runtime itself
- Build-time or Control UI changes that cannot be cleanly wrapped

## If You Patch The Vendor

- Keep the patch narrow and clearly SaintAGI-motivated.
- Re-read `openclaw-vendored/README.md` for current patch-area intent.
- Avoid scattering SaintAGI product assumptions deep across unrelated upstream modules.
- Rebuild with the repo's existing OpenClaw build commands when required.

## Avoid

- Using the vendor snapshot as a dumping ground for app-side feature work.
- Making broad refactors that increase future re-vendor pain without a clear payoff.
