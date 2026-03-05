# Production Deployment Guide

Deploy Play Money on a remote server using Docker Compose with built-in Caddy reverse proxy.

## Prerequisites

- Docker >= 24 with Compose v2
- 2 vCPU / 2 GB RAM / 20 GB disk (minimum)
- A domain name with DNS A record pointing to the server

## Architecture

Single domain — Caddy handles SSL and routes by path.

```
  Internet
     |
  [ Caddy ]       (ports 80/443, auto-SSL via Let's Encrypt)
     |
     |── /api/* ──→ api:3001
     |── /v1/*  ──→ api:3001
     |── /*     ──→ web:3000
     |
  +-----+  +-----+
  | web |  | api |    (Next.js containers, no exposed ports)
  +-----+  +-----+
     |        |
     +---+----+
         |
    +----------+
    | postgres |      (internal only)
    +----------+
         |
   [ volumes: postgres_data, caddy_data ]
```

### Service Communication

| From | To | URL | Network |
|------|----|-----|---------|
| Browser | Caddy | `https://example.com` | Public (80/443) |
| Caddy | Web | `web:3000` | Internal (Docker) |
| Caddy | API | `api:3001` | Internal (Docker) |
| Web (SSR) | API | `http://api:3001` | Internal (Docker) |
| Web / API | Postgres | `postgres:5432` | Internal (Docker) |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/play-money.git
cd play-money

# 2. Create .env from example
cp .env.example .env.prod
```

Edit `.env.prod` with production values (see [Environment Variables](#environment-variables) below):

```bash
# .env.prod — minimum required values
POSTGRES_PASSWORD=<strong-random-password>
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://example.com
NEXT_PUBLIC_WEB_URL=https://example.com
NEXT_PUBLIC_API_URL=https://example.com
```

Note: `NEXT_PUBLIC_WEB_URL` and `NEXT_PUBLIC_API_URL` are the **same domain** — Caddy routes `/api/*` and `/v1/*` to the API container automatically.

```bash
# 3. Build and start
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. Verify
docker compose -f docker-compose.prod.yml ps
curl https://example.com/              # Web app (if using standard ports)
curl https://example.com/api/health    # API health check
curl https://example.com/v1/markets    # API endpoint
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password. Use a strong random value. |
| `NEXTAUTH_SECRET` | Session encryption key. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical URL (e.g., `https://example.com`). Used for auth callbacks and cookie domain. |
| `NEXT_PUBLIC_WEB_URL` | Public URL for web. Set to `https://example.com`. Baked at build time. |
| `NEXT_PUBLIC_API_URL` | Public URL for API. Set to `https://example.com` (same domain). Baked at build time. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_DB` | `playmoney` | Database name |
| `AUTH_RESEND_KEY` | *(empty)* | Resend API key for magic link email login |
| `AUTH_RESEND_EMAIL` | *(empty)* | Sender address for auth emails |
| `AUTH_EMAIL_WHITELIST` | *(empty)* | Comma-separated allowed emails. Empty = open registration. |
| `CADDY_PORT` | `3080` | Host port for Caddy reverse proxy |
| `OPENAI_API_KEY` | *(empty)* | Auto-generate question tags |

## How Routing Works

The `Caddyfile` at the project root defines path-based routing:

- `/api/*` and `/v1/*` → API container (port 3001)
- Everything else → Web container (port 3000)

Only Caddy exposes a port to the host (default: 3080, configurable via `CADDY_PORT`). Web and API containers are internal-only. Caddy serves plain HTTP — use an external reverse proxy (Coolify/Traefik, nginx, or a host-level Caddy) for SSL termination.

Caddy serves plain HTTP inside the Docker network. SSL should be handled by an external reverse proxy (Coolify's Traefik, host-level Caddy, nginx, etc.).

## Cookie Domain

With a single domain, cookies just work — no cross-origin issues. The auth cookie is set on `.example.com` from `NEXTAUTH_URL`, which covers all paths on that domain.

## Common Operations

All commands assume `-f docker-compose.prod.yml --env-file .env.prod`. You can alias this:

```bash
alias dc="docker compose -f docker-compose.prod.yml --env-file .env.prod"
```

### Logs

```bash
dc logs -f              # All services
dc logs -f web api      # Web + API only
dc logs -f caddy        # Reverse proxy logs
dc logs --tail 100 api  # Last 100 lines
```

### Restart / Rebuild

```bash
dc restart web api      # Restart without rebuilding
dc up -d --build        # Rebuild and restart (required after code changes)
```

**Important**: Changing `NEXT_PUBLIC_WEB_URL` or `NEXT_PUBLIC_API_URL` requires a full rebuild (`--build`) because these values are baked into the client JS bundle at build time.

### Database

```bash
# Run migrations (happens automatically on startup via db-setup)
dc run --rm db-setup

# Seed with sample data
dc run --rm db-setup sh -c \
  'npx dotenv -e /dev/null -- npx tsx packages/database/seed.ts'

# Backup
dc exec postgres pg_dump -U postgres playmoney > backup_$(date +%Y%m%d).sql

# Restore
dc exec -T postgres psql -U postgres playmoney < backup_20240101.sql

# Reset (destroys all data)
dc down -v && dc up -d
```

### Shell Access

```bash
dc exec web sh          # Shell into web container
dc exec postgres psql -U postgres playmoney  # Postgres CLI
```

## Troubleshooting

### Missing required env vars

```
POSTGRES_PASSWORD is required
```

All required vars use `${VAR:?message}` syntax — compose will refuse to start if they're unset. Check your `.env.prod` file.

### Auth redirects to wrong URL

Verify `NEXTAUTH_URL` matches the public URL users access. Caddy automatically sets `X-Forwarded-Proto` headers.

### `NEXT_PUBLIC_*` changes not taking effect

These are baked into the client JS at build time. You must rebuild:

```bash
dc build --no-cache web api && dc up -d web api
```

### Build runs out of memory

The Next.js build can use >1 GB RAM. If the build OOMs:

```bash
# Increase Node memory for the build
docker compose -f docker-compose.prod.yml build --build-arg NODE_OPTIONS="--max-old-space-size=2048"
```

Or build on a machine with more RAM and transfer the images.

### Health check failing

```bash
# Check health status
dc ps
# Inspect health check output
docker inspect --format='{{json .State.Health}}' play-money-web-1 | jq
```

Web health checks hit `/` on port 3000, API health checks hit `/api/health` on port 3001.

### Caddy not starting

Caddy depends on web and api being healthy first. If Caddy shows as "Created" but not "Up", check that web and api are healthy:

```bash
dc ps
dc logs web api
```

### Port conflict

By default Caddy binds to host port 3080. Set `CADDY_PORT=80` if you want standard HTTP port, or any other port to avoid conflicts.
