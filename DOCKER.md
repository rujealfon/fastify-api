# Docker Guide

This project ships a `docker-compose.yml` that runs four services together so you can develop, browse data, and inspect the schema without installing anything locally except Docker.

## Services

| Service | Container | Port | Description |
|---|---|---|---|
| `postgres` | `fastify_postgres` | `5432` | PostgreSQL 16 database |
| `app` | `fastify_app` | `3000` | Fastify API (production build) |
| `drizzle-studio` | `fastify_drizzle_studio` | `4983` | Drizzle Studio — visual schema & data browser |
| `pgadmin` | `fastify_pgadmin` | `5050` | pgAdmin 4 — full-featured Postgres GUI |

---

## Quick Start

```bash
# Start all services
docker-compose up

# Start only the database (for local dev with pnpm dev)
docker-compose up -d postgres

# Start everything in the background
docker-compose up -d
```

---

## Service Details

### API — `http://localhost:3000`

The Fastify application built from the `Dockerfile` using a multi-stage build (`deps` → `builder` → `production`).

- Swagger UI: `http://localhost:3000/documentation`
- Health: `http://localhost:3000/health/live`

To use local source changes without rebuilding the image, run the dev server directly instead:

```bash
docker-compose up -d postgres
pnpm dev
```

### Drizzle Studio — `http://localhost:4983`

[Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) is a visual browser for your schema and data. It connects directly to the `postgres` service.

The studio runs inside the same `deps` image stage used during the build (so `drizzle-kit` is always available), with the schema and config files mounted read-only.

> **Note:** Drizzle Studio opens inside the browser at `http://localhost:4983`. If it shows a blank screen, wait a few seconds for the tunnel to initialize and then refresh.

### pgAdmin — `http://localhost:5050`

[pgAdmin 4](https://www.pgadmin.org) is a full-featured Postgres management tool.

**Login credentials:**

| Field | Value |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin` |

The `fastify_dev` server is **pre-configured** via `docker/pgadmin/servers.json` — it will appear in the left sidebar under *Servers* immediately after login without any manual setup.

**Connection details (if you need to add a server manually):**

| Field | Value |
|---|---|
| Host | `postgres` (inside Docker) / `localhost` (from host) |
| Port | `5432` |
| Database | `fastify_dev` |
| Username | `postgres` |
| Password | `password` |

---

## Running Migrations

Migrations must be applied before the app can serve requests. Run them from your host machine (requires `DATABASE_URL` pointing to the running container):

```bash
# With postgres running via docker-compose
DATABASE_URL=postgres://postgres:password@localhost:5432/fastify_dev pnpm db:migrate
```

Or add it as a one-off command:

```bash
docker-compose run --rm drizzle-studio node_modules/.bin/drizzle-kit migrate
```

---

## Useful Commands

```bash
# View logs for a specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Restart a single service
docker-compose restart app

# Rebuild the app image after code changes
docker-compose up -d --build app

# Stop all services (preserves volumes)
docker-compose down

# Stop and delete all data volumes
docker-compose down -v

# Open a psql shell inside the postgres container
docker exec -it fastify_postgres psql -U postgres -d fastify_dev
```

---

## Volumes

| Volume | Purpose |
|---|---|
| `postgres_data` | Persists the PostgreSQL data directory across restarts |
| `pgadmin_data` | Persists pgAdmin settings and query history |

Run `docker-compose down -v` to wipe both and start fresh.

---

## Environment Variables

The `app` service reads its config from the `environment` block in `docker-compose.yml`. To override values without editing the file, create a `.env` file in the project root — Docker Compose automatically picks it up:

```env
JWT_SECRET=your_actual_secret_here
```

See `.env.example` for all available variables.
