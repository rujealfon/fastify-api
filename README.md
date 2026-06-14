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
| API Docs | Swagger UI via [@fastify/swagger](https://github.com/fastify/fastify-swagger) |
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
│   ├── swagger.ts                # @fastify/swagger + swagger-ui
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

- Node.js 20+
- pnpm 11+
- PostgreSQL 16+ (or Docker)

### Local Development

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` and `JWT_SECRET`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/fastify_dev
JWT_SECRET=your_random_secret_at_least_32_characters_long
LOG_LEVEL=info
```

**3. Start PostgreSQL**

With Docker:
```bash
docker-compose up -d postgres
```

Or use an existing PostgreSQL instance and update `DATABASE_URL` accordingly.

**4. Run migrations**

```bash
pnpm db:migrate
```

**5. Start the dev server**

```bash
pnpm dev
```

The server starts at `http://localhost:3000`.

## API Documentation

Swagger UI is available at `http://localhost:3000/documentation` when the server is running.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload (`tsx watch`) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:generate` | Generate Drizzle migration files from schema |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |
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

## Running with Docker

Start the full stack (app + PostgreSQL):

```bash
docker-compose up
```

The app runs at `http://localhost:3000`. The `docker-compose.yml` automatically wires the database connection.

## Running Tests

Tests use `app.inject()` — no real HTTP port is bound, and each test spins up and tears down its own app instance.

```bash
pnpm test
```

Tests require a running PostgreSQL instance. Set `DATABASE_URL` in your environment or `.env` before running.

## Database

Drizzle ORM is used for all database access. Schema definitions live in `src/db/schema/`.

```bash
# After changing a schema file, generate a new migration:
pnpm db:generate

# Apply all pending migrations:
pnpm db:migrate

# Inspect the database visually:
pnpm db:studio
```

Migrations are stored in `migrations/` and committed to version control.

## Architecture Notes

- **Plugin registration order** in `app.ts` is intentional: `env` must be first since all other plugins read `fastify.config`.
- **Zod is the single source of truth** for types — no manual interfaces. All types are derived via `z.infer<>` from schemas defined in each module's `schemas/index.ts`.
- **Services have no Fastify imports** — they receive `db` as a parameter, making them independently unit-testable.
- **Error handling** is centralized in `app.ts` via `setErrorHandler`. All domain errors extend `AppError`.
