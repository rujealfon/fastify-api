# Repository Guidelines

## Project Structure & Module Organization

This is a Fastify TypeScript API. Source code lives in `src/`, with startup in `server.ts` and app assembly in `app.ts`. Domain modules are under `src/modules/<domain>/` and usually contain `routes/`, `services/`, and `schemas/`. Shared errors, hooks, decorators, and schemas live in `src/common/`; plugins in `src/plugins/`; database schema in `src/db/schema/`; and portable RPC contracts in `src/contract/schemas/`. Tests live in `src/tests/`, with fixtures in `src/tests/fixtures/`.

## Build, Test, and Development Commands

Run project scripts with `nub`; Docker services are required for most tasks.

- `docker-compose up -d` starts Postgres, Redis, the app, Drizzle Studio, and pgAdmin.
- `nub build` compiles TypeScript and resolves path aliases with `tsc-alias`.
- `nub test:unit` runs Vitest integration tests inside the app container.
- `docker exec -e NODE_ENV=test fastify_app nubx vitest run src/tests/modules/users.test.ts` runs one test file.
- `nub lint` checks `src/` with ESLint; `nub lint:fix` applies automatic fixes.
- `nub db:generate` creates Drizzle migrations after schema edits; `nub db:migrate` applies them.

## Coding Style & Naming Conventions

Use TypeScript ES modules and the `@/` alias for imports from `src/`. Follow the ESLint setup based on `@antfu/eslint-config`; run `nub lint` before submitting changes. Prefer Zod for validation and derive types with `z.infer<>` instead of hand-written interfaces. Keep services free of Fastify imports and inject `db` explicitly. Contract schema files in `src/contract/schemas/` must only import from `zod` and `@/contract/types.js`.

## Testing Guidelines

Tests use Vitest and exercise the real database and Redis; do not mock these dependencies. Create apps with `createTestApp()` and authenticate with `registerAndLogin()` from `src/tests/fixtures/index.ts`. Use `app.inject()` for HTTP requests. Name module tests with the pattern `src/tests/modules/<domain>.test.ts`.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative summaries such as `Add profile module with API endpoint for user data retrieval` and `Refactor API response structure for consistency and clarity`. Keep commits focused and describe the behavior changed. Pull requests should include a short summary, relevant issue links, migration notes when database schema changes, and the commands run for validation.

## Database Schema Conventions

All `timestamp` columns use `{ withTimezone: true }` (maps to Postgres `TIMESTAMPTZ`). Postgres stores these internally as UTC and converts on read, so values are always timezone-safe regardless of the DB session timezone. Never use bare `timestamp()` for new columns.

## Architecture & Configuration Notes

Preserve the plugin registration order in `app.ts`: `env` first, Redis before rate limiting, and request context before auth and request ID hooks. Domain errors should extend `AppError` and use existing subclasses such as `NotFoundError`, `UnauthorizedError`, `ConflictError`, and `ValidationError`. Copy `.env.example` to `.env`; required variables include `DATABASE_URL`, `JWT_SECRET`, and `REDIS_URL`.
