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

## Hosted Gateway Sharding Roadmap

The current hosted setup runs a single shared Railway gateway. Every org talks
to one CPU, so a heavy tenant or a stuck channel can slow chat for everyone
else (see the WhatsApp auto-restart incident in the chat latency plan).

The migration target is shard-based isolation: each org is pinned to one
hosted gateway, and gateways scale horizontally without code changes.

### Phase 1: shard resolver seam (in repo today)

- `OPENCLAW_GATEWAY_URL` remains the single shared gateway when no shard
  config is set. No behavior change for existing tenants.
- `OPENCLAW_GATEWAY_SHARDS` accepts a JSON array of shards:

  ```json
  [
    { "id": "shard-a", "wsUrl": "wss://gw-a.saintagi.app", "token": "..." },
    { "id": "shard-b", "wsUrl": "wss://gw-b.saintagi.app", "token": "...", "orgs": ["org_pinned_id"] }
  ]
  ```

- `resolveOrgGatewayShard(orgId)` (in `src/lib/openclaw/gateway-shards.ts`)
  returns the assigned shard. Pinned orgs use the explicit assignment.
  Otherwise a SHA-256 hash of the org id picks a stable shard.
- `resolveTenantGatewayTarget(orgId)` calls the shard resolver first and
  falls back to the env gateway when sharding is not configured.

### Phase 2: rolling shards

- Stand up a second Railway service from the same image. Smaller plan is fine
  to start; the goal is isolation, not capacity.
- Set `OPENCLAW_GATEWAY_SHARDS` on the SaintAGI Vercel app with both shards.
  New orgs hash into either shard. Existing orgs keep working because the
  fallback returns the env gateway when no shard matches; once you flip them
  into the shard list they migrate.
- Per-shard env: `OPENCLAW_DEFAULT_MODEL`, `OPENCLAW_BOOTSTRAP_CHANNELS`, and
  workspace persistence paths must stay aligned across shards. State is local
  to each shard, so an org should never bounce between shards mid-flight.

### Phase 3: per-tenant runtimes (long-term)

- For high-value or high-load tenants, promote them to a dedicated shard via
  the `orgs` pin list. They keep the same SaintAGI control plane but get
  their own CPU, channel state, and workspace state.
- The local managed-runtime code path (`isOpenClawRuntimeManaged()`) already
  spawns one gateway per tenant on disk. The hosted equivalent is "one
  shard pinned to one org".

### Operational Guardrails

- A shard outage must not silently drop other tenants. Log shard ids in
  observability events and alert when a shard's pressure sample stays
  degraded for multiple consecutive samples.
- Channel state (WhatsApp/Telegram pairings, OAuth tokens) lives on the
  shard that originally connected the channel. Do not move orgs between
  shards without a planned re-pair.
- Workspace files for each agent live on the shard that bootstrapped the
  agent. Rebalancing requires copying `runtime-data/openclaw/<tenantId>/`
  to the new shard before flipping the pin.

## Change Checklist

- Does this preserve deterministic tenant paths?
- Does the metadata shape remain readable by current code?
- Does the change affect token generation, pid handling, or startup ordering?
- Could hosted and local gateway logic diverge unexpectedly?
- Does admin-only console access still hold?
- Does the change preserve the shard-pinning contract (one org, one shard)?
