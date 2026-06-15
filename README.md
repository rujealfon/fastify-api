# Fastify API

A production-ready REST API built with **Fastify 5**, **TypeScript**, **PostgreSQL**, and **Drizzle ORM**, following a domain-driven architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Fastify 5](https://fastify.dev) |
| Language | TypeScript (NodeNext modules) |
| Database | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) |
| Validation | [Zod](https://zod.dev) + [fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod) |
| Auth | JWT via [@fastify/jwt](https://github.com/fastify/fastify-jwt) |
| API Docs | [Scalar](https://scalar.com) + [@fastify/swagger](https://github.com/fastify/fastify-swagger) (OpenAPI spec) |
| Testing | [Vitest](https://vitest.dev) |
| Package Manager | pnpm |

## Project Structure

```
src/
├── app.ts                        # Fastify application factory
├── server.ts                     # Entry point
├── config/
│   ├── schema.ts                 # Environment variable schema
│   └── index.ts                  # FastifyInstance type augmentation
├── db/
│   ├── index.ts                  # Drizzle client + postgres connection pool
│   └── schema/
│       ├── users.ts              # Users table definition
│       ├── products.ts           # Products table definition
│       └── index.ts
├── plugins/
│   ├── cors.ts                   # @fastify/cors
│   ├── swagger.ts                # @fastify/swagger (spec) + Scalar (UI at /)
│   ├── db.ts                     # Decorates fastify.db
│   ├── jwt.ts                    # @fastify/jwt
│   ├── helmet.ts                 # @fastify/helmet
│   └── rate-limit.ts             # @fastify/rate-limit
├── common/
│   ├── decorators/
│   │   └── auth.ts               # fastify.authenticate decorator
│   ├── errors/
│   │   ├── AppError.ts           # Base error class
│   │   ├── NotFoundError.ts      # 404
│   │   ├── UnauthorizedError.ts  # 401
│   │   ├── ConflictError.ts      # 409
│   │   └── ValidationError.ts    # 422
│   ├── hooks/
│   │   └── request-id.ts         # x-request-id header propagation
│   └── schemas/
│       └── index.ts              # Shared Zod schemas (pagination, uuid, error)
├── modules/
│   ├── auth/                     # Register + Login
│   ├── users/                    # User CRUD (JWT protected)
│   ├── products/                 # Product CRUD (JWT protected)
│   └── health/                   # Liveness + readiness probes
└── tests/
    ├── fixtures/                 # Test helpers (createTestApp, registerAndLogin)
    └── modules/                  # Integration tests per module
```

Each module follows the same internal structure:

```
modules/<domain>/
├── schemas/index.ts      # Zod schemas → types via z.infer<>
├── services/             # Business logic + DB queries (no Fastify imports)
├── controllers/          # Route handlers (calls services)
└── routes/index.ts       # Fastify plugin: schema + handler wiring
```

## Getting Started

### Prerequisites

- Docker
- pnpm 11+ (for generating migrations locally)

See [DOCKER.md](DOCKER.md) for the full step-by-step setup.

## API Documentation

The [Scalar API reference](https://scalar.com) is served at `http://localhost:3000/` when the server is running. The raw OpenAPI spec (JSON) is available at `http://localhost:3000/openapi.json` for import into Postman, Insomnia, or other tooling.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm build` | Compile TypeScript to `dist/` (used by Dockerfile) |
| `pnpm db:generate` | Generate a migration file after schema changes |
| `pnpm db:migrate:docker` | Apply pending migrations inside the Docker container |
| `pnpm lint` | Lint source files with ESLint |
| `pnpm format` | Format source files with Prettier |

## API Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and receive a JWT |

### Users *(JWT required)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/:id` | Get user by ID |
| POST | `/api/v1/users` | Create a user |
| PATCH | `/api/v1/users/:id` | Update a user |
| DELETE | `/api/v1/users/:id` | Delete a user |

### Products *(JWT required)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/products` | List products (paginated) |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create a product |
| PATCH | `/api/v1/products/:id` | Update a product |
| DELETE | `/api/v1/products/:id` | Delete a product |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health/live` | Liveness probe (always 200 if process is up) |
| GET | `/health/ready` | Readiness probe (checks DB connectivity) |

### Pagination

All list endpoints accept `?page=1&limit=10` query parameters.

### Authentication

Include the JWT from the login response as a Bearer token:

```
Authorization: Bearer <token>
```

## Example Usage

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret1234"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret1234"}'
# → {"data":{"token":"<jwt>"}}

# List users (authenticated)
curl http://localhost:3000/api/v1/users \
  -H 'Authorization: Bearer <token>'
```

## Database

Drizzle ORM is used for all database access. Schema definitions live in `src/db/schema/`. Migrations are stored in `migrations/` and committed to version control.

```bash
# After editing a schema file, generate a new migration:
pnpm db:generate

# Apply migrations inside the running Docker container:
pnpm db:migrate:docker
```

## Architecture Notes

- **Plugin registration order** in `app.ts` is intentional: `env` must be first since all other plugins read `fastify.config`.
- **Zod is the single source of truth** for types — no manual interfaces. All types are derived via `z.infer<>` from schemas defined in each module's `schemas/index.ts`.
- **Services have no Fastify imports** — they receive `db` as a parameter, making them independently unit-testable.
- **Error handling** is centralized in `app.ts` via `setErrorHandler`. All domain errors extend `AppError`.
