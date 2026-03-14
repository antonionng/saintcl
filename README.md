# SaintClaw

SaintClaw is an enterprise-focused SaaS control plane for managed OpenClaw runtimes. It combines a Next.js dashboard, Supabase backend, tenant-scoped OpenClaw process management, governed terminal access, channel configuration, knowledge upload, and billing surfaces.

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

4. Start the SaintClaw app:

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
- optional OpenClaw runtime overrides like `OPENCLAW_VENDOR_DIR` and `OPENCLAW_RUNTIME_ROOT`

## Railway Gateway Deployment

Use Railway only for the persistent OpenClaw gateway. Keep the SaintClaw app on Vercel and Supabase.

This repo now includes:

- `Dockerfile.railway-openclaw`
- `railway.json`
- `scripts/railway-openclaw-start.mjs`
- `railway-openclaw.env.example`

Recommended flow:

1. In Railway, create a new service from this repo.
2. Add a volume mounted at `/data`.
3. Set variables from `railway-openclaw.env.example`.
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
- SaintClaw launches the advanced admin console against the hosted gateway directly, while the main product experience remains inside the SaintClaw UI.

## Vendored OpenClaw

The OpenClaw snapshot is stored in `openclaw-vendored`. It is pinned to upstream commit `3ada30e6707e117ceb394a934e2d8be424a0ea59` from upstream version `2026.3.8`.

SaintClaw-specific runtime ownership includes:

- one OpenClaw runtime per tenant
- tenant-scoped state/config/workspace roots
- admin-only terminal governance
- runtime metadata persisted through the SaintClaw control plane

## Runtime Layout

SaintClaw manages tenant runtime state beneath:

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
