# Saint AGI

Saint AGI is an enterprise-focused SaaS control plane for managed OpenClaw runtimes. It combines a Next.js dashboard, Supabase backend, tenant-scoped OpenClaw process management, governed terminal access, channel configuration, knowledge upload, and billing surfaces.

## Stack

- `Next.js 16` for the application shell and dashboard
- `Supabase` for auth, data, RLS, and edge functions
- `Vendored OpenClaw` under `openclaw-vendored`
- `Tailwind CSS` and lightweight UI primitives for the black-and-white design system

## Local Development

1. Install app dependencies:

```bash
npm install
```

2. Install vendored OpenClaw dependencies:

```bash
npm run openclaw:install
```

3. Build vendored OpenClaw when needed:

```bash
npm run openclaw:build
```

4. Start the Saint AGI app:

```bash
npm run dev
```

5. For OpenClaw runtime development, use:

```bash
npm run openclaw:gateway:watch
```

## Environment

Copy `.env.local.example` to `.env.local` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_ANNUAL`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_BUSINESS_MONTHLY`
- `STRIPE_PRICE_BUSINESS_ANNUAL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_TOKEN_SECRET`
- `EMAIL_CRON_SECRET`
- `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` when the app should talk to a hosted Railway gateway
- `OPENROUTER_API_KEY` if you want Saint AGI-managed OpenClaw runtimes to use OpenRouter
- optional OpenClaw runtime overrides like `OPENCLAW_VENDOR_DIR`, `OPENCLAW_RUNTIME_ROOT`, and `OPENCLAW_BASE_PORT`

By default, Saint AGI now points tenant runtimes at `OPENCLAW_DEFAULT_MODEL=openrouter/auto`. To force a specific OpenRouter model, set `OPENCLAW_DEFAULT_MODEL` explicitly, for example:

```text
OPENCLAW_DEFAULT_MODEL=openrouter/meta-llama/llama-3.3-70b:free
```

OpenClaw already has native OpenRouter support, so you do not need a separate OpenRouter CLI bridge inside Saint AGI. Under the hood, the vendored runtime can also be onboarded directly with:

```bash
cd openclaw-vendored
pnpm openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

OpenRouter does offer many free models, usually marked with a `:free` suffix. Availability and rate limits change over time, so `openrouter/auto` is the safer default for general use, while a specific `:free` model is better if you want to constrain cost.

## Batch Prerequisites

Use these prerequisites when turning the current working tree into staged deployments instead of one broad rollout.

- Batch 1. Runtime stabilization and chat fix:
  Railway needs the variables in `railway-openclaw.env.example`. Vercel needs `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` when the app points at the hosted gateway.
- Batch 2. Auth, account, and org identity:
  Requires Supabase auth plus `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL`. Apply `supabase/migrations/00005_user_profiles_and_account_avatars.sql` and `supabase/migrations/00007_org_company_profile.sql` first.
- Batch 3. Org admin, members, teams, and knowledge:
  Requires `supabase/migrations/00006_scoped_knowledge_and_teams.sql` plus the related storage buckets and policies for avatars, org logos, and knowledge docs.
- Batch 4. Billing, plans, and Stripe:
  Requires `supabase/migrations/00002_wallets_assignments_and_policies.sql` and `supabase/migrations/00008_billing_subscriptions_and_trials.sql`, plus all Stripe variables listed above.
- Batch 5. Invites, email, and lifecycle automation:
  Requires `supabase/migrations/00009_email_invites_and_preferences.sql`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_TOKEN_SECRET`, `EMAIL_CRON_SECRET`, and `NEXT_PUBLIC_APP_URL`.
- Batch 6. Observability, model governance, and runtime ops UI:
  Requires `supabase/migrations/00003_openrouter_model_governance.sql` and `supabase/migrations/00004_request_observability.sql`, plus a healthy OpenClaw gateway/runtime path so sync and telemetry routes can resolve the gateway.
- Batch 7. Marketing, legal, and public site:
  No additional infra is required beyond the app deploy itself, but verify that public assets and copy are publication-ready before shipping.

## Batch Verification

- Batch 1. Runtime stabilization and chat fix:
  Run `pnpm vitest run src/agents/workspace.fallback.test.ts` in `openclaw-vendored`, rebuild the vendored runtime with `npm run openclaw:build`, then smoke-test agent chat against the deployed gateway.
- Batch 2. Auth, account, and org identity:
  Verify signup, login, auth callback, account profile updates, avatar upload, org profile updates, logo upload, and workspace switching.
- Batch 3. Org admin, members, teams, and knowledge:
  Verify role-gated access, team creation, member visibility, and scoped knowledge upload for org, team, and user flows.
- Batch 4. Billing, plans, and Stripe:
  Verify checkout, portal access, webhook replay handling, wallet and ledger consistency, and trial state transitions.
- Batch 5. Invites, email, and lifecycle automation:
  Verify invite send, resend, revoke, accept, unsubscribe, and both email cron routes with the bearer secret.
- Batch 6. Observability, model governance, and runtime ops UI:
  Verify request log filtering, session activity views, model-catalog access, session overrides, and that observability reads do not trigger unwanted billing side effects by default.
- Batch 7. Marketing, legal, and public site:
  Verify static page rendering, content links, public asset loading, and removal of placeholder copy before deployment.

## Suggested Rollout Order

1. Ship Batch 1 by itself to restore chat reliability.
2. Roll out Batches 2 and 3 only after the related schema is applied and storage policies are ready.
3. Roll out Batch 4 before Batch 5 so invite charging and billing state share the same baseline.
4. Roll out Batch 6 after the runtime and billing paths are stable enough to trust observability output.
5. Roll out Batch 7 separately as a low-risk content deploy.

## Railway Gateway Deployment

Use Railway only for the persistent OpenClaw gateway. Keep the Saint AGI app on Vercel and Supabase.

This repo now includes:

- `Dockerfile.railway-openclaw`
- `railway.json`
- `scripts/railway-openclaw-start.mjs`
- `railway-openclaw.env.example`

Recommended flow:

1. In Railway, create a new service from this repo.
2. Add a volume mounted at `/data`.
3. Set variables from `railway-openclaw.env.example`, including `OPENROUTER_API_KEY` if you want the hosted gateway to route through OpenRouter.
4. Let Railway deploy the OpenClaw service on port `8080`.
5. Copy the public Railway domain into `OPENCLAW_ALLOWED_ORIGINS` if you want an explicit origin allowlist.
6. In Vercel, set:

```text
OPENCLAW_GATEWAY_URL=wss://<your-railway-domain>
OPENCLAW_GATEWAY_TOKEN=<the-same-token-you-set-in-railway>
```

Notes:

- The Railway startup script seeds `gateway.mode=local`, a persistent workspace path, and Control UI origin handling automatically.
- If `OPENCLAW_ALLOWED_ORIGINS` is not set yet, the service falls back to host-header origin mode so you can bootstrap the first deploy, then tighten origins afterward.
- Saint AGI launches the advanced admin console against the hosted gateway directly, while the main product experience remains inside the Saint AGI UI.

## Vendored OpenClaw

The OpenClaw snapshot is stored in `openclaw-vendored`. It is pinned to upstream commit `3ada30e6707e117ceb394a934e2d8be424a0ea59` from upstream version `2026.3.8`.

Saint AGI-specific runtime ownership includes:

- one OpenClaw runtime per tenant
- tenant-scoped state/config/workspace roots
- admin-only terminal governance
- runtime metadata persisted through the Saint AGI control plane

## Runtime Layout

Saint AGI manages tenant runtime state beneath:

```text
runtime-data/openclaw/<tenantId>/
```

with separate:

- `state/`
- `config/openclaw.json`
- `workspaces/<agentId>/`
- `logs/gateway.log`

## Notes

- `openclaw-vendored` is excluded from the app TypeScript and ESLint passes.
- `runtime-data/` is ignored and intended for local runtime state only.
- Antfarm is intentionally deferred until the tenant-scoped OpenClaw layer is stable.
