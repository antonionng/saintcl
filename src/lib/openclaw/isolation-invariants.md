# SaintAGI Runtime Isolation Invariants

These invariants describe the managed SaintAGI contract over OpenClaw. If one changes, update the control-plane helpers and tests in the same change.

## Ownership Map

- Org owns the tenant gateway target. `getTenantOpenClawClient()` must resolve the gateway by the authenticated org, not by request payload alone.
- Agent owns its runtime workspace. Managed paths must be derived from `orgId` plus `openclaw_agent_id` unless an existing absolute runtime workspace path is intentionally preserved.
- Agent owns its primary session namespace. User-supplied session keys must parse as `agent:<openclaw_agent_id>:<session>`.
- Agent owns its channel account. Managed WhatsApp and Telegram accounts use the OpenClaw agent id as `accountId`; Slack bindings must preserve all existing bindings and include an explicit account id match.
- Managed channel traffic must have an explicit binding. `session.routeFallback = "deny"` prevents unmatched inbound messages from falling through to `main` or another default agent.
- Managed WhatsApp accounts are direct-message allowlist accounts. This blocks a scanned QR from becoming a broad cross-workspace inbox.

## Guard Rails

- Config patches must upsert into `agents.list` and `bindings`; never replace either collection with a single managed agent.
- Managed repair must run even when the model already matches, because workspace, binding, fast mode, memory search, and route fallback are separate invariants.
- Gateway health and workspace URLs may be computed in parallel, but routing inputs passed to the embedded UI must include the current agent session and WhatsApp account id.
- Future tenant shards must preserve the same account and session invariants. A separate gateway improves resource isolation, but it is not a replacement for explicit bindings.
