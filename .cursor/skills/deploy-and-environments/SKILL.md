---
name: deploy-and-environments
description: Work within SaintClaw's split deployment model across local dev, Vercel, Supabase, and Railway-hosted OpenClaw. Use when changing environment variables, startup assumptions, deployment behavior, or infrastructure-sensitive code paths.
---

# Deploy And Environments

## Quick Start

Use this skill when a task touches runtime deployment or environment-driven behavior.

1. Keep the split deployment model intact unless the user explicitly wants to redesign it.
2. Treat app hosting and gateway hosting as separate concerns.
3. Document any new environment variable clearly and place it in the correct environment.
4. Preserve the bootstrap assumptions in local dev and Railway startup.

## Deployment Model

- SaintClaw app: Next.js app, typically on Vercel.
- Data and auth: Supabase.
- Persistent OpenClaw gateway: Railway.
- Local dev: app root plus optional `openclaw-vendored` watch/build loop.

## Key Rules

- Do not collapse SaintClaw app deployment and hosted gateway deployment by accident.
- Keep hosted gateway token handling explicit.
- Preserve origin handling and workspace/state directory setup in Railway bootstrap.
- Prefer configuration changes over hard-coded environment fallbacks.

## Local Dev Defaults

- `npm install`
- `npm run openclaw:install`
- `npm run openclaw:build` when needed
- `npm run dev`
- `npm run openclaw:gateway:watch` for gateway development

## Additional Resources

- See [reference.md](reference.md) for the main environment map and deployment checklist.
