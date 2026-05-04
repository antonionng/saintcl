# Runtime And Gateway Operations Reference

## Tenant Runtime Layout

SaintAGI expects one runtime root per org under:

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
- SaintAGI app hosting and hosted gateway hosting are intentionally split.

## Hosted Gateway Image Requirements

The vendored OpenClaw gateway uses a Python helper subprocess for pinned/atomic
workspace writes (see `openclaw-vendored/src/infra/fs-pinned-write-helper.ts`).
Any failure in that subprocess, including spawn-failed because the binary is
missing, is normalized to `SafeOpenError("invalid-path", ...)` and surfaces as
`unsafe workspace file "<name>"` from `agents.files.set`. That breaks every
agent bootstrap flow (`AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`).

Required runtime packages that must stay installed in the hosted gateway image:

- `python3` (used by the pinned-write helper). Default lookup is
  `/usr/bin/python3`; override with `OPENCLAW_PINNED_WRITE_PYTHON` only if
  the binary lives elsewhere.
- `procps`, `hostname`, `curl`, `git`, `openssh-client`, `openssl` for the
  startup script and gateway runtime.

`Dockerfile.railway-openclaw` installs these explicitly. Removing any of them
will not fail the build but will break workspace writes at request time.

## Change Checklist

- Does this preserve deterministic tenant paths?
- Does the metadata shape remain readable by current code?
- Does the change affect token generation, pid handling, or startup ordering?
- Could hosted and local gateway logic diverge unexpectedly?
- Does admin-only console access still hold?
