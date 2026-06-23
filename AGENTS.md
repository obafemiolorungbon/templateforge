# AGENTS.md - TemplateForge

You are working on TemplateForge, a self-hosted developer workbench for AI-generated transactional email templates.

## Product Intent

Build a private tool that helps developers generate, inspect, preview, version, and deploy transactional email templates through provider adapters. The first adapter is SendByte; future adapters should support providers such as Amazon SES.

## Technical Direction

- Nx + pnpm monorepo.
- Next.js App Router in `apps/web`.
- Thin NestJS facade in `apps/backend`.
- Prisma + Postgres in `libs/db`.
- Domain services in `libs/domain`.
- Shared Zod contracts in `libs/shared-types`.

## Agent Rules

- Do not use unsafe Handlebars triple braces.
- Every template must include MJML, text fallback, variable contract, and sample variables.
- Never claim deployment success unless the selected provider returns a successful response.
- Prefer sandbox/test provider modes unless live mode is explicitly requested.
- Do not store OpenRouter or provider secrets in the database in V1.
- Log meaningful generation and deployment actions.

## Build Order

1. Database schema and seed workspace.
2. Template contracts and domain services.
3. OpenRouter generation.
4. Provider preview/deploy integration.
5. Template dashboard and library.
6. Editor/detail workflow.
7. Focused tests for guardrails.

## Quality Bar

- Add focused tests for guardrails.
- Keep UI developer-focused, clean, and inspectable.
- Do not run long UI production builds unless explicitly requested.
