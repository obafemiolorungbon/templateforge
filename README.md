# TemplateForge

TemplateForge is a self-hosted workbench for AI-generated transactional email templates. It helps developers generate, edit, preview, version, and deploy provider-ready email templates using MJML, Handlebars variables, and plain-text fallbacks.

TemplateForge V1 is a fresh-install public release. Future releases will include upgrade notes when schema changes require action.

## What It Does

- Generates transactional templates with OpenRouter.
- Stores MJML, text fallback, subject, variables, sample payloads, versions, and deploy history.
- Lets you configure brand assets once and reuse shared headers/footers across templates.
- Provides a CodeMirror editor for MJML/text source editing.
- Renders previews and deploys templates through configured email providers.
- Keeps provider secrets in environment variables only.

## Stack

- Nx + pnpm monorepo
- Next.js App Router in `apps/web`
- NestJS API in `apps/backend`
- Prisma + Postgres in `libs/db`
- Domain services in `libs/domain`
- Shared Zod contracts in `libs/shared-types`

## Requirements

- Node.js 20+
- pnpm 10+
- Docker, for local Postgres
- OpenRouter API key
- At least one provider API key for deployment

## Local Setup

For detailed setup and troubleshooting, see [HELP.md](./HELP.md).

```bash
pnpm install
cp .env.example .env
```

Set the required env vars:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/templateforge?schema=public"
BACKEND_PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="openrouter/auto"
DEMO_MODE=false
TEMPLATEFORGE_SENDBYTE_API_KEY="sk_test_..."
TEMPLATEFORGE_SENDBYTE_BASE_URL="https://api.sendbyte.africa"
TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL="https://cdn.jsdelivr.net/gh/obafemiolorungbon/templateforge-marketplace@main/manifest.json"
```

Prepare a fresh database:

```bash
pnpm db:up
pnpm db:generate
pnpm db:reset
```

Start the app:

```bash
pnpm dev
```

Local URLs:

- Web UI: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Dashboard API: `http://localhost:4000/dashboard`
- Templates API: `http://localhost:4000/templates`
- Marketplace API: `http://localhost:4000/marketplace/templates`
- Brand API: `http://localhost:4000/brand`
- Providers API: `http://localhost:4000/providers`

## Self-Deployment Notes

TemplateForge is designed to run as two app processes plus Postgres:

- `apps/web`: Next.js UI
- `apps/backend`: NestJS API
- Postgres database

Recommended deployment shape:

1. Provision Postgres and set `DATABASE_URL`.
2. Deploy the backend with `BACKEND_PORT`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and provider-specific environment variables.
3. Deploy the web app with `NEXT_PUBLIC_API_URL` pointing at the backend.
4. Run `pnpm db:push` against the production database during initial setup.
5. Run `pnpm db:seed` once to create the default workspace, brand profile, header, footer, and seed template.

Use sandbox/test provider credentials first where the selected provider supports them.

### Demo Mode

Set `DEMO_MODE=true` on both the web and backend deployments to run a hosted
trial without storing user secrets in the database. In demo mode:

- `/` shows a brand-agnostic onboarding page instead of redirecting straight to
  the dashboard.
- Users provide a SendByte sandbox key and optionally an OpenRouter key.
- Keys are kept in browser session storage and sent as request headers only.
- The backend accepts those headers only when `DEMO_MODE=true`; normal
  deployments continue using environment variables.
- No Prisma schema or database secret storage is used for demo keys.

## Scripts

- `pnpm dev` - Start Postgres, prepare the workspace, and run backend + web.
- `pnpm dev:web` - Start only the Next.js UI.
- `pnpm dev:backend` - Start only the NestJS API.
- `pnpm dev:apps` - Start backend + web without starting Docker.
- `pnpm setup:local` - Start Postgres, push the Prisma schema, and seed data.
- `pnpm db:up` - Start local Postgres with Docker Compose.
- `pnpm db:down` - Stop local Docker services.
- `pnpm db:push` - Sync the current Prisma schema to a fresh database.
- `pnpm db:reset` - Force-reset the local database and seed TemplateForge data.
- `pnpm db:seed` - Seed the local TemplateForge workspace.
- `pnpm db:studio` - Open Prisma Studio.
- `pnpm test` - Run focused backend/domain tests.

## Provider Adapters

TemplateForge uses an in-repo provider adapter registry. Provider metadata is stored in the database, while secret values stay in environment variables. The first adapter is `sendbyte`, which supports:

- MJML template source
- Plain-text fallback
- Handlebars variables
- Remote preview
- Template create/update deployment

Brand variables such as `{{brand_primary_color}}` are resolved before a provider receives template source, so provider-specific HTML or MJML remains valid. Send-time variables such as `{{amount}}` and `{{first_name}}` remain part of the template contract.

Amazon SES is the next planned adapter. SES v2 expects stored template content as subject, HTML, and text, so the adapter will convert TemplateForge source into that provider shape.

## Marketplace Catalog

TemplateForge can import public template packages from a jsDelivr-backed GitHub repository. The public V1 marketplace can be configured with:

```env
TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL="https://cdn.jsdelivr.net/gh/obafemiolorungbon/templateforge-marketplace@main/manifest.json"
```

If this environment variable is not set, the Marketplace navigation item and pages are disabled.

Marketplace imports are local copies. Imported templates are validated with the same guardrails as generated templates and are not deployed automatically.

## Current Limitations

- Single-workspace/self-hosted mode.
- No built-in auth or multi-tenant secret management in V1.
- Secrets are env-only and are never stored through the UI.
- Template deploy is implemented, but outbound email sending and webhook tracking are not part of V1.
- V1 expects a fresh database. Future releases will include upgrade notes when schema changes require action.
