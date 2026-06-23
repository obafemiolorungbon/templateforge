# TemplateForge Help

TemplateForge V1 is a fresh-install public release. Start with a new database, follow the setup steps below, and use future release notes when schema changes require upgrade action.

## Fresh Install

1. Install dependencies:

```bash
pnpm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Start Postgres:

```bash
pnpm db:up
```

4. Generate the Prisma client:

```bash
pnpm db:generate
```

5. Reset and seed the fresh database:

```bash
pnpm db:reset
```

6. Start the app:

```bash
pnpm dev
```

Web UI runs on `http://localhost:3000`. The backend runs on `http://localhost:4000`.

## Required Environment Variables

Core app:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/templateforge?schema=public"
BACKEND_PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="openrouter/auto"
```

First provider adapter:

```env
TEMPLATEFORGE_SENDBYTE_API_KEY="sk_test_..."
TEMPLATEFORGE_SENDBYTE_BASE_URL="https://api.sendbyte.africa"
```

Optional marketplace:

```env
TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL="https://cdn.jsdelivr.net/gh/obafemiolorungbon/templateforge-marketplace@main/manifest.json"
```

If the marketplace URL is missing, the Marketplace nav item and pages are disabled.

## Providers

Provider metadata is stored in the database, but provider secrets stay in environment variables. V1 includes the `sendbyte` adapter. Settings shows provider readiness and missing secret warnings.

If deploy is disabled, check:

- The selected provider is enabled.
- The expected provider API key env var is set.
- The app was restarted after editing `.env`.
- You are using a sandbox/test key when running in sandbox mode.

## Marketplace

The marketplace is optional. When `TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL` is configured, TemplateForge fetches the manifest and imports selected template packages into the local library.

Imported templates are local copies. Editing them does not update the marketplace source, and imports are not deployed automatically.

## Common Issues

### Prisma generate fails on Windows with `EPERM`

This usually means a running Node process has Prisma's query engine DLL locked. Stop dev servers, background Node processes, and editor helper processes if needed, then run:

```bash
pnpm db:generate
```

After generation succeeds, run:

```bash
pnpm db:reset
```

### Postgres connection fails

Start Docker and run:

```bash
pnpm db:up
```

Then confirm `DATABASE_URL` matches the local Docker Compose database.

### AI generation is disabled

Set `OPENROUTER_API_KEY` and restart the backend.

### Provider preview falls back to local render

TemplateForge falls back to local rendering when a remote preview provider is missing or not configured. This is expected for incomplete provider setup.

### Marketplace does not show in the sidebar

Set `TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL` and restart the web app.

## Release Checks

Before tagging a public release:

```bash
pnpm db:generate
pnpm db:reset
pnpm test
pnpm exec tsc -b libs/shared-types libs/domain libs/api-client apps/backend --force
pnpm lint
```

Future releases will include upgrade notes when schema changes require action.
