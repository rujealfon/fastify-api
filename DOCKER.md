# Docker Setup Guide

This guide walks through the full local development setup using Docker. All services run together with hot reload so your code changes are reflected immediately.

---

## Services

| Service | Container | Port | Description |
|---|---|---|---|
| `postgres` | `fastify_postgres` | `5432` | PostgreSQL 16 database |
| `app` | `fastify_app` | `3000` | Fastify API with hot reload (`tsx watch`) |
| `drizzle-studio` | `fastify_drizzle_studio` | `4983 (backend)` | Drizzle Studio — schema & data browser |
| `pgadmin` | `fastify_pgadmin` | `5050` | pgAdmin 4 — Postgres GUI |

---

## Step 1 — Build the images

```bash
docker-compose build
```

This builds the `app` and `drizzle-studio` images from the `deps` stage of the Dockerfile (installs all dependencies including dev tools like `tsx` and `drizzle-kit`).

---

## Step 2 — Start all services

```bash
docker-compose up -d
```

Wait a few seconds for postgres to pass its healthcheck before the app and drizzle-studio start.

Check that everything is running:

```bash
docker-compose ps
```

---

## Step 3 — Run migrations

Tables don't exist yet. Apply the migrations once:

```bash
pnpm db:migrate
```

Expected output:

```
✓ migrations applied successfully!
```

Confirm the tables were created:

```bash
docker exec -it fastify_postgres psql -U postgres -d fastify_dev -c "\dt"
```

---

## Step 4 — Verify the API is running

```bash
curl http://localhost:3000/health/live
# → {"status":"ok"}
```

Open the Scalar API reference in your browser:

```
http://localhost:3000/
```

---

## You're ready to develop

Any change you make to a file inside `src/` is picked up automatically — `tsx watch` restarts the server inside the container.

---

## Drizzle Studio

The Drizzle Studio UI is **not** at `http://localhost:4983`. Port `4983` is the local backend that the Drizzle cloud UI connects to.

Open the UI at:

```
https://local.drizzle.studio
```

It will automatically connect to your running container on port `4983`.

---

## pgAdmin

Open `http://localhost:5050` and log in with:

| Field | Value |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin` |

The `fastify_dev` server is pre-configured — it appears in the left sidebar under *Servers* with no manual setup needed.

---

## Schema changes & migrations

After editing a file in `src/db/schema/`, generate a new migration then apply it:

```bash
# 1. Generate migration SQL (runs on host, reads your local schema files)
pnpm db:generate

# 2. Apply it to the running Docker database
pnpm db:migrate
```

---

## Useful commands

```bash
# View live logs
docker-compose logs -f app
docker-compose logs -f postgres

# Restart the app (e.g. after changing a plugin or config)
docker-compose restart app

# Open a psql shell
docker exec -it fastify_postgres psql -U postgres -d fastify_dev

# Stop all services (data is preserved)
docker-compose down

# Stop and wipe all data
docker-compose down -v
```
