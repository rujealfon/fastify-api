# Docker Guide

This project ships two Compose files:

| File | Purpose |
|---|---|
| `docker-compose.yml` | **Production** — compiled build, `NODE_ENV=production`, only the API port (3000) is exposed to the host |
| `docker-compose.dev.yml` | **Development** — `tsx watch` hot reload, `NODE_ENV=development`, all ports exposed for local tooling |

**Port exposure summary:**

| Service | Production (`docker-compose.yml`) | Development (`docker-compose.dev.yml`) |
|---|---|---|
| `app` | ✅ `3000` exposed | ✅ `3000` exposed |
| `postgres` | 🔒 internal only | ✅ `5432` exposed |
| `drizzle-studio` | 🔒 internal only | ✅ `4983` exposed |
| `pgadmin` | 🔒 internal only | ✅ `5050` exposed |

---

## Services

| Service | Container | Port | Description |
|---|---|---|---|
| `postgres` | `fastify_postgres` | `5432` | PostgreSQL 16 database |
| `app` | `fastify_app` / `fastify_app_dev` | `3000` | Fastify API |
| `drizzle-studio` | `fastify_drizzle_studio` | `4983` | Drizzle Studio backend — UI at `https://local.drizzle.studio` |
| `pgadmin` | `fastify_pgadmin` | `5050` | pgAdmin 4 — full-featured Postgres GUI |

---

## Development Mode (hot reload)

Use `docker-compose.dev.yml` when you want your source changes to be picked up automatically without rebuilding the image.

```bash
# First-time setup: build the image
docker-compose -f docker-compose.dev.yml build

# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Background mode
docker-compose -f docker-compose.dev.yml up -d
```

**How it works:**

- The `app` service uses the `deps` Dockerfile stage, which installs all dependencies including `tsx`
- `./src` and `./tsconfig.json` are bind-mounted into the container
- The container runs `pnpm dev` (`tsx watch src/server.ts`) — any change to a file in `src/` restarts the server automatically
- Logs are colorized via pino-pretty

```
app | [INFO] Server listening at http://0.0.0.0:3000   ← colored output
app | [INFO] incoming request ...
```

**Run migrations once before starting:**

```bash
# While dev services are up
docker-compose -f docker-compose.dev.yml run --rm drizzle-studio \
  node_modules/.bin/drizzle-kit migrate
```

---

## Production Mode

Use `docker-compose.yml` when you want to run the compiled build exactly as it runs in production.

```bash
# Build and start all services
docker-compose up -d

# Rebuild app after source changes
docker-compose up -d --build app
```

The `app` service runs `node dist/server.js` with `NODE_ENV=production` and outputs structured JSON logs:

```json
{"level":30,"time":1234567890,"msg":"Server listening at http://0.0.0.0:3000"}
```

---

## Service Details

### API — `http://localhost:3000`

- Scalar API reference: `http://localhost:3000/`
- Raw OpenAPI spec (JSON): `http://localhost:3000/openapi.json`
- Health: `http://localhost:3000/health/live`

### Drizzle Studio — `https://local.drizzle.studio`

[Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) is a visual browser for your schema and data.

> **Important:** Do **not** open `http://localhost:4983` directly — that port is the local backend API, not the UI. The actual interface is served from Drizzle's cloud at **`https://local.drizzle.studio`**, which connects back to your local port `4983`.

The studio runs inside the `deps` image stage (so `drizzle-kit` is always available), with the schema and config files mounted read-only.

> **Note:** If it shows a blank screen on first load, wait a few seconds for the tunnel to initialize and refresh.

### pgAdmin — `http://localhost:5050`

[pgAdmin 4](https://www.pgadmin.org) is a full-featured Postgres management tool.

**Login credentials:**

| Field | Value |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin` |

The `fastify_dev` server is **pre-configured** via `docker/pgadmin/servers.json` — it appears in the left sidebar under *Servers* immediately after login with no manual setup required.

**Connection details (if adding a server manually):**

| Field | Value |
|---|---|
| Host | `postgres` (inside Docker) / `localhost` (from host) |
| Port | `5432` |
| Database | `fastify_dev` |
| Username | `postgres` |
| Password | `password` |

---

## Running Migrations

```bash
# Dev mode — while dev services are up
docker-compose -f docker-compose.dev.yml run --rm drizzle-studio \
  node_modules/.bin/drizzle-kit migrate

# Production mode — while prod services are up
docker-compose run --rm drizzle-studio \
  node_modules/.bin/drizzle-kit migrate

# From host machine (requires DATABASE_URL set)
DATABASE_URL=postgres://postgres:password@localhost:5432/fastify_dev pnpm db:migrate
```

---

## Useful Commands

```bash
# --- Dev mode ---

# View app logs (colorized)
docker-compose -f docker-compose.dev.yml logs -f app

# Restart just the app (e.g. after changing a plugin)
docker-compose -f docker-compose.dev.yml restart app

# Stop all dev services
docker-compose -f docker-compose.dev.yml down

# --- Production mode ---

# View app logs (JSON)
docker-compose logs -f app

# Rebuild and restart app after source changes
docker-compose up -d --build app

# Stop all production services
docker-compose down

# --- Both modes ---

# Open a psql shell
docker exec -it fastify_postgres psql -U postgres -d fastify_dev

# Wipe all data volumes and start fresh
docker-compose down -v
# or
docker-compose -f docker-compose.dev.yml down -v
```

---

## Volumes

| Volume | Purpose |
|---|---|
| `postgres_data` | Persists the PostgreSQL data directory across restarts |
| `pgadmin_data` | Persists pgAdmin settings and query history |

Both Compose files share the same named volumes, so your data persists regardless of which mode you use.

---

## Environment Variables

Both Compose files read environment variables from a `.env` file in the project root if it exists. To override values without editing the Compose files:

```bash
cp .env.example .env
# then edit .env
```

```env
JWT_SECRET=your_actual_secret_here
DATABASE_URL=postgres://postgres:password@localhost:5432/fastify_dev
```

See `.env.example` for all available variables.
