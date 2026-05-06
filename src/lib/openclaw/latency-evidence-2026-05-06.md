# Latency Evidence, 2026-05-06

Scope: production Railway OpenClaw gateway `saintcl` and Supabase telemetry project `AIOS`.

## Findings

- Production is still one Railway service and one `/data` volume. The latest successful deployment is `43fb3210-cb91-4a5b-a3b9-e3829691e542`, running one replica in `asia-southeast1`.
- The slowest runtime evidence is gateway pressure, not browser UI. Railway logs show liveness warnings with event-loop delay and CPU pressure while agent work is active.
- Recent embedded runner traces show `system-prompt` generation at about 1.8 to 2.0 seconds on slow paths. `core-plugin-tools` is about 480 to 550 ms, and `bundle-tools` can add up to about 770 ms. That creates a real pre-model latency floor before the LLM streams.
- The most severe recent slow sample was `agent:2e03508e-my-agent:main` on `openrouter/auto`: prep took 2.46 seconds, `reply.run-agent-turn` took 12.05 seconds, then the LLM timed out.
- The Saint tenant (`client-alpha-423603`, agent `antonio-giugno-agent-4500bde7`) had recent healthy pressure samples and lower request telemetry. Its recorded gateway request p95 was about 938 ms over 58 events.
- A follow-up split by request status shows the same shape more sharply: Saint completed app gateway requests had p95 about 668 ms, while Saint AGI completed app gateway requests had p95 about 8.13 seconds and Shallom had p95 about 7.36 seconds. Failed gateway HTTP paths across tenants commonly sat around 15 seconds.
- The Saint AGI tenant (`my-organization-905564f1`) had much more control-plane traffic: 802 request events with p95 about 2.66 seconds, plus 219 runtime pressure samples.
- Other tenants had worse gateway request p95 values, notably Andy Lop around 10.96 seconds and Shallom around 7.19 seconds.
- Control-plane write rate limits occurred around 15:20 to 15:21 UTC for `config.patch`, with retries of about 12 to 35 seconds. The managed config upsert changes reduce repeated patches and avoid replacing whole agent or binding lists.

## Interpretation

The Saint tenant appears fast because it had lower measured gateway pressure and fewer recent control-plane calls during the measured window. This matches the observed user experience: Saint can feel like a 3-second agent while other tenants sit in 8 to 20-second territory. The slow tenant evidence points to three separate causes:

- Shared gateway pressure: event-loop and CPU warnings show one tenant can affect all tenants on the current single Railway process.
- Pre-model overhead: prompt and tool assembly takes multiple seconds before the provider call starts.
- Provider/model behavior: `openrouter/auto` timed out in the Previsico sample, while several other tenants are on explicit Haiku models.

## Follow-up Validation

- After deployment, compare `request_events` p95 by org and watch for fewer `rpc.config.patch` rate-limit events.
- Enable or keep `OPENCLAW_LOG_SLOW_DIAGNOSTIC_PHASE_MS` in production so prompt assembly and model-call delays are visible without guessing.
- Move one slow tenant to a shard and compare pressure samples against the shared Railway service.
