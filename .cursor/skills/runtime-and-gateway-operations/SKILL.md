---
name: runtime-and-gateway-operations
description: Work safely on SaintClaw tenant runtime lifecycle, gateway configuration, state layout, and hosted OpenClaw integration. Use when changing runtime bootstrapping, process management, gateway tokens, workspace layout, logs, or tenant gateway behavior.
---

# Runtime And Gateway Operations

## Quick Start

Use this skill when a change touches tenant runtime ownership or the hosted gateway.

1. Preserve the one-runtime-per-org model.
2. Keep runtime state deterministic and tenant-scoped.
3. Treat gateway tokens, ports, and metadata persistence as compatibility boundaries.
4. Distinguish between local tenant runtimes and the hosted Railway gateway path.

## Key Boundaries

- `src/lib/openclaw/runtime-manager.ts`: boot, stop, restart, pid tracking, metadata.
- `src/lib/openclaw/paths.ts`: runtime layout and deterministic paths.
- `src/lib/openclaw/runtime-store.ts`: persisted runtime metadata and governance records.
- `scripts/railway-openclaw-start.mjs`: hosted gateway bootstrap behavior.

## Rules

- Do not break existing metadata file expectations.
- Keep logs, config, state, and workspaces under the runtime root.
- Prefer wrapping vendor functionality from `src/lib/openclaw` before patching the vendor snapshot.
- Be careful with detached processes, pid lifecycles, and token generation.
- Preserve admin-only console access and runtime governance assumptions.

## When To Slow Down

- Changing runtime path layout
- Altering gateway auth or token handling
- Changing how hosted and local runtimes are resolved
- Touching startup scripts that seed config or origins

## Additional Resources

- See [reference.md](reference.md) for lifecycle flow, file layout, and deployment notes.
