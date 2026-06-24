# Fastify API

A production-ready REST API built with **Fastify 5**, **TypeScript**, **PostgreSQL**, **Redis**, and **Drizzle ORM**, following a domain-driven architecture designed to scale from medium to large applications.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Fastify 5](https://fastify.dev) |
| Language | TypeScript 5.9 (NodeNext modules) |
| Database | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) |
| Cache / Rate-limit store | Redis via [@fastify/redis](https://github.com/fastify/fastify-redis) + [ioredis](https://github.com/redis/ioredis) |
| Validation | [Zod](https://zod.dev) + [fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod) |
| Auth | JWT via [@fastify/jwt](https://github.com/fastify/fastify-jwt) |
| API Docs | [Scalar](https://scalar.com) + [@fastify/swagger](https://github.com/fastify/fastify-swagger) (OpenAPI 3.0) |
| Metrics | [prom-client](https://github.com/siimon/prom-client) — Prometheus endpoint at `/metrics` |
| Tracing | [OpenTelemetry](https://opentelemetry.io/) (OTLP HTTP, optional via `OTEL_ENDPOINT`) |
| RPC | Contract-first RPC — shared schemas, `createFastifyRpcPlugin`, type-safe `createApiClient` |
| Testing | [Vitest](https://vitest.dev) |
| Package Manager | [nub](https://nub.sh) (pnpm under the hood) |

## Project Structure

```
src/
├── app.ts                        # Fastify application factory (plugin registration order)
├── server.ts                     # Entry point — init telemetry + graceful shutdown
├── telemetry.ts                  # OpenTelemetry SDK setup
├── config/                       # Environment config schema + type augmentation
├── db/                           # Drizzle client, connection pool, table schemas
├── plugins/                      # One file per Fastify plugin
│   ├── sensible.ts               # @fastify/sensible — httpErrors, reply helpers
│   ├── compress.ts               # @fastify/compress — brotli/gzip/deflate responses
│   ├── helmet.ts                 # @fastify/helmet — security headers
│   ├── cors.ts                   # @fastify/cors
│   ├── cookie.ts                 # @fastify/cookie — signed cookie support
│   ├── redis.ts                  # @fastify/redis — shared ioredis connection
│   ├── rate-limit.ts             # @fastify/rate-limit (Redis-backed, multi-instance safe)
│   ├── under-pressure.ts         # @fastify/under-pressure — auto-503 under load
│   ├── multipart.ts              # @fastify/multipart — file upload support
│   ├── request-context.ts        # @fastify/request-context — AsyncLocalStorage per request
│   ├── jwt.ts                    # @fastify/jwt
│   ├── db.ts                     # Decorates fastify.db
│   ├── metrics.ts                # prom-client — /metrics endpoint
│   ├── scalar.ts                 # @fastify/swagger + Scalar UI
│   └── rpc.ts                    # createFastifyRpcPlugin — registers RouteMap as Fastify routes
├── contract/                     # RPC contract layer (shared between server and client)
│   ├── types.ts                  # RouteSchema<> (generic typed) + RouteMap (plain record)
│   ├── client.ts                 # createApiClient — type-safe fetch client + RpcError
│   ├── index.ts
│   └── schemas/                  # Per-domain route schemas (auth, users, products)
├── common/                       # Cross-cutting concerns shared across all modules
│   ├── constants/                # Shared constants & enums (ROLES, Postgres error codes)
│   ├── decorators/               # fastify.authenticate, fastify.requireAdmin
│   ├── errors/                   # AppError hierarchy (401, 403, 404, 409, 422)
│   ├── hooks/                    # request-id propagation + request context wiring
│   └── schemas/                  # Shared Zod schemas (pagination, uuid, apiError)
├── modules/                      # Domain modules (auth, users, products, health)
│   └── <domain>/
│       ├── schemas/index.ts      # Zod schemas → types via z.infer<>
│       ├── services/             # Business logic + DB queries (no Fastify imports)
│       └── routes/index.ts       # Fastify plugin: schema + handler wiring (controllers/ optional)
└── tests/
    ├── fixtures/                 # createTestApp(), registerAndLogin() helpers
    └── modules/                  # Integration tests per module
```

## Getting Started

### Prerequisites

- Docker
- [nub CLI](https://nub.sh) (`npm i -g nub`)

See [DOCKER.md](DOCKER.md) for the full step-by-step setup.

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs (min 32 chars) |
| `REDIS_URL` | ✅ | — | Redis connection string (e.g. `redis://localhost:6379`) |
| `PORT` | | `3000` | Server port |
| `HOST` | | `0.0.0.0` | Server host |
| `NODE_ENV` | | `development` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | | `info` | Pino log level |
| `COOKIE_SECRET` | | *(JWT_SECRET)* | Secret for signed cookies — falls back to `JWT_SECRET` if empty |
| `OTEL_ENDPOINT` | | *(disabled)* | OTLP HTTP endpoint (e.g. `http://localhost:4318/v1/traces`). Leave empty to disable tracing. |

## API Documentation

The [Scalar API reference](https://scalar.com) is served at `http://localhost:3000/` when the server is running. The raw OpenAPI spec (JSON) is at `/openapi.json` for import into Postman, Insomnia, or other tooling.

## Available Scripts

All scripts run via `nub` (or `nubx` inside containers). See [package.json](package.json) for the full list.

| Script | Description |
|---|---|
| `nub build` | Compile TypeScript to `dist/` |
| `nub db:generate` | Generate a migration file after schema changes (runs inside the `drizzle-studio` container via `nubx`) |
| `nub db:migrate` | Apply pending migrations inside the Docker container |
| `nub lint` | Lint with ESLint (runs inside the `app` container via `nubx`) |
| `nub lint:fix` | Auto-fix lint issues |
| `nub test:unit` | Run unit tests inside the `app` container |

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register a new user |
| POST | `/api/v1/auth/login` | — | Login — sets a `token` httpOnly cookie (web) |
| POST | `/api/v1/auth/mobile/login` | — | Login for mobile — returns `token` in body, no cookie |
| POST | `/api/v1/auth/logout` | — | Logout — clears the `token` cookie |

### Users *(cookie or Bearer token required)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/:id` | Get user by ID |
| POST | `/api/v1/users` | Create a user |
| PATCH | `/api/v1/users/:id` | Update a user |
| DELETE | `/api/v1/users/:id` | Soft-delete a user |

### Products *(cookie or Bearer token required)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/products` | List products (paginated) |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create a product |
| PATCH | `/api/v1/products/:id` | Update a product |
| DELETE | `/api/v1/products/:id` | Soft-delete a product |

### Activity Logs *(cookie or Bearer token required)*

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/activity-logs` | Admin | List all activity logs (paginated) |
| GET | `/api/v1/users/:id/activity-logs` | Self or Admin | List logs for a specific user |

Each log entry records `action`, `resource_type`, `resource_id`, `metadata`, and `created_at`. Logged actions: `auth.registered`, `auth.logged_in`, `auth.logged_out`, `auth.account_restored`, `user.created`, `user.updated`, `user.deleted`, `product.created`, `product.updated`, `product.deleted`.

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health/live` | Liveness probe — always 200 if process is up |
| GET | `/health/ready` | Readiness probe — checks DB + Redis connectivity |
| GET | `/health/details` | System details — heap, RSS, event loop lag, pressure status |

### Observability

| Method | Path | Description |
|---|---|---|
| GET | `/metrics` | Prometheus metrics (prom-client default + Node.js metrics) |

> **Production note:** `/metrics` should be restricted at the network/gateway level and not exposed publicly.

### Pagination

All list endpoints accept `?page=1&limit=10` query parameters.

### Authentication

Two login endpoints cover the two client types:

| Client | Endpoint | Strategy |
|---|---|---|
| Web browser | `POST /api/v1/auth/login` | Sets an httpOnly cookie (`SameSite=Strict`, `Secure` in production) — sent automatically on every request |
| Mobile app (Ionic/Capacitor, React Native) | `POST /api/v1/auth/mobile/login` | Returns `data.token` in the response body, no cookie — store in secure storage and send as `Authorization: Bearer <token>` |
| Server-to-server / tests | Either | Bearer token is simpler |

```
Authorization: Bearer <token>
```

## Example Usage

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret1234"}'

# Login — cookie is saved to jar.txt
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret1234"}' \
  -c jar.txt
# → {"success":true,"data":{"id":"...","email":"alice@example.com"}}

# List users — cookie sent automatically from jar.txt
curl http://localhost:3000/api/v1/users -b jar.txt

# Logout — clears the cookie
curl -X POST http://localhost:3000/api/v1/auth/logout -b jar.txt -c jar.txt

# Prometheus metrics
curl http://localhost:3000/metrics
```

## RPC Layer

Routes are defined once in `src/contract/schemas/` as a `RouteMap` — a plain object mapping route names to their method, path, Zod schemas, and auth flag. This contract is shared between the server and any client.

**Server** — `createFastifyRpcPlugin(schema, handlers)` registers all routes on a Fastify instance. Handlers receive fully-typed `{ query, params, body, request, reply }` and must return a typed `{ status, body }` union. Each route schema accepts an optional `tags` array for OpenAPI grouping in the Scalar UI.

**Client** — `createApiClient(baseUrl, { getToken })` returns a namespaced client (`client.users.list(...)`, `client.auth.login(...)`) backed by native `fetch`. All inputs and return types are inferred from the same contract schemas, so a schema change surfaces as a type error on both sides.

```ts
// Server
const plugin = createFastifyRpcPlugin(usersSchema, {
  list: async ({ query }) => ({ status: 200, body: await userService.list(query) }),
})

// Client (e.g. frontend or test)
const api = createApiClient('http://localhost:3000', { getToken: () => token })
const users = await api.users.list({ query: { page: 1, limit: 10 } })
```

Errors from the server surface as `RpcError` (with `.status` and `.data`) on the client.

## Architecture Notes

- **Contract-first RPC** — `src/contract/` is the single source of truth for route shapes. `createFastifyRpcPlugin` wires the server; `createApiClient` wires the client. A schema change is a type error on both sides simultaneously.
- **Plugin registration order** in `app.ts` is intentional: `env` must be first (all plugins read `fastify.config`), `redis` must precede `rate-limit` (Redis store), `request-context` must precede `auth-decorator` and `request-id` hook (context must exist before being written to).
- **Zod is the single source of truth** for types — no manual interfaces. All types are derived via `z.infer<>` from schemas in each module's `schemas/index.ts`.
- **Services have no Fastify imports** — they receive `db` as a parameter, making them independently testable.
- **Error handling** is centralized in `app.ts` via `setErrorHandler`. All domain errors extend `AppError`.
- **Rate limiting** uses Redis as the store — safe for multi-instance / horizontally scaled deployments.
- **Request context** (`@fastify/request-context`) stores `requestId` and `userId` via AsyncLocalStorage, accessible anywhere in the call stack without passing them explicitly.
- **Activity logging** is fire-and-forget (`logActivity` in `src/modules/activity-logs/helpers/`) — inserts never block the request path. Failures are silently swallowed so a logging error never surfaces to the caller.
- **Graceful shutdown** is handled in `server.ts` — `SIGINT`/`SIGTERM` closes Fastify (draining connections) and flushes OpenTelemetry spans before exiting.
