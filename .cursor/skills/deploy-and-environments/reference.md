# Deploy And Environments Reference

## Environment Map

- Local app: `npm run dev`
- Local vendor install: `npm run openclaw:install`
- Local vendor build: `npm run openclaw:build`
- Local gateway watch loop: `npm run openclaw:gateway:watch`
- App hosting target: Vercel
- Data and auth: Supabase
- Persistent OpenClaw gateway: Railway

## Important Variables

App-side variables commonly include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENCLAW_DEFAULT_MODEL`
- `OPENCLAW_GATEWAY_URL`
- `OPENCLAW_GATEWAY_TOKEN`

Railway bootstrap variables commonly include:

- `PORT`
- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_STATE_DIR`
- `OPENCLAW_WORKSPACE_DIR`
- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_ALLOWED_ORIGINS`

## Deployment Checklist

- Put app variables in the app environment, not in Railway by default.
- Put hosted gateway token and runtime-path variables in Railway.
- Keep origin handling explicit once the hosted domain is known.
- Avoid adding hidden defaults that make production drift from local behavior.
- If a new variable changes runtime behavior, update the relevant README or env example.
