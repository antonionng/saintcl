# Tenant Shard Rollout Runbook

Goal: move one tenant from the shared Railway OpenClaw gateway to a dedicated hosted gateway, then compare response latency and runtime pressure.

## Candidate

Start with a tenant that has clear slow-path evidence and active users. From the 2026-05-06 telemetry pass, good candidates are:

- Andy Lop: gateway request p95 around 10.96 seconds over the last 24 hours.
- Shallom: gateway request p95 around 7.19 seconds over the last 24 hours.
- Previsico: recent `openrouter/auto` timeout on `agent:2e03508e-my-agent:main`.

Do not use the Saint tenant as the first shard proof because it is already the fast baseline.

## Preconditions

- Keep the existing shared `saintcl` Railway service untouched until the shard passes validation.
- Create the shard with its own persistent volume, state directory, config path, workspace directory, gateway token, and allowed origins.
- Set the same diagnostic variables as the shared service, including `OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS`.
- Configure model/provider secrets by reference to the same approved provider set. Rotate secrets separately if they were exposed outside trusted tooling.

## Rollout Steps

1. Create the shard service from the same `Dockerfile.railway-openclaw`.
2. Attach a new volume at `/data`.
3. Set shard environment values for state, config, workspace, gateway URL, token, origins, diagnostics, and provider access.
4. Add the gateway to `OPENCLAW_GATEWAY_SHARDS` or store its `ws_url` plus a `token_env_key` in `openclaw_gateway_assignments`.
5. Insert or update `openclaw_gateway_assignments` for the candidate org with `status = 'active'`, `dedicated = true`, and `assignment_reason = 'performance'`.
6. Open the workspace for the candidate tenant and trigger managed runtime repair. Verify the config has:
   - `session.routeFallback = "deny"`
   - one agent entry per managed agent
   - agent-scoped WhatsApp and Telegram account ids
   - preserved existing bindings
7. Send one workspace chat message and one channel message, then confirm both route to the same agent-owned session namespace.
8. Watch Railway logs for liveness warnings, provider timeouts, and slow diagnostic phases.
9. Compare Supabase `request_events` p50 and p95 for the candidate before and after the shard cutover.

## Rollback

Remove the candidate org from the shard mapping and let it resolve back to the shared gateway. Do not delete the shard volume until session routing and channel state have been reviewed.

## Success Criteria

- No unmatched channel message falls back to `main`.
- Candidate p95 improves materially or the remaining delay is clearly provider-side.
- Shared gateway pressure samples drop or stop correlating with the candidate tenant traffic.
- No increase in `config.patch` rate-limit events after managed repair.
