# Runtime And Gateway Operations Reference

## Tenant Runtime Layout

SaintClaw expects one runtime root per org under:

```text
runtime-data/openclaw/<tenantId>/
```

Important subpaths:

- `state/`
- `config/openclaw.json`
- `workspaces/<agentId>/`
- `logs/gateway.log`
- metadata JSON persisted by the runtime manager

## Lifecycle Notes

- `ensureTenantRuntime()` bootstraps the runtime layout and returns the current descriptor.
- `startTenantRuntime()` spawns the gateway, pipes output to logs, and writes runtime state.
- `stopTenantRuntime()` kills the pid if present and rewrites state as stopped.
- `restartTenantRuntime()` composes stop then start.

## Hosted Gateway Notes

- The persistent shared gateway path is bootstrapped by `scripts/railway-openclaw-start.mjs`.
- Railway startup seeds local gateway mode, persistent workspace paths, and Control UI origin behavior.
- SaintClaw app hosting and hosted gateway hosting are intentionally split.

## Change Checklist

- Does this preserve deterministic tenant paths?
- Does the metadata shape remain readable by current code?
- Does the change affect token generation, pid handling, or startup ordering?
- Could hosted and local gateway logic diverge unexpectedly?
- Does admin-only console access still hold?
