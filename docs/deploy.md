# Production Deployment Guide

Deploy Play Money on a remote server using Docker Compose.

## Prerequisites

- Docker >= 24 with Compose v2
- 2 vCPU / 2 GB RAM / 20 GB disk (minimum)
- A domain name with DNS pointing to the server
- (Recommended) Reverse proxy for SSL termination (Caddy, nginx, etc.)

## Architecture

```
  Internet
     |
  [ Reverse Proxy ]   (Caddy / nginx — terminates SSL)
     |          |
  :3000      :3001
     |          |
  +-----+   +-----+
  | web |   | api |        (Next.js containers)
  +-----+   +-----+
     |          |
     +----+-----+
          |
     +----------+
     | postgres |          (internal only — no exposed port)
     +----------+
          |
    [ volume: postgres_data ]
```

### Service Communication

| From | To | URL | Network |
|------|----|-----|---------|
| Browser | Web | `https://play.example.com` | Public |
| Browser | API | `https://api.example.com` | Public |
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
NEXTAUTH_URL=https://play.example.com
NEXT_PUBLIC_WEB_URL=https://play.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

```bash
# 3. Build and start
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f web api
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password. Use a strong random value. |
| `NEXTAUTH_SECRET` | Session encryption key. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical URL of the web app (e.g., `https://play.example.com`). Used for auth callbacks and cookie domain. |
| `NEXT_PUBLIC_WEB_URL` | Public URL for the web frontend. Baked into client JS at build time. |
| `NEXT_PUBLIC_API_URL` | Public URL for the API. Baked into client JS at build time. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_DB` | `playmoney` | Database name |
| `WEB_PORT` | `3000` | Host port for web container |
| `API_PORT` | `3001` | Host port for API container |
| `AUTH_RESEND_KEY` | *(empty)* | Resend API key for magic link email login |
| `AUTH_RESEND_EMAIL` | *(empty)* | Sender address for auth emails |
| `AUTH_EMAIL_WHITELIST` | *(empty)* | Comma-separated allowed emails. Empty = open registration. |
| `OPENAI_API_KEY` | *(empty)* | Auto-generate question tags |

## Cookie Domain Caveat

The auth cookie domain is set to `.{hostname}` extracted from `NEXTAUTH_URL`. For cross-subdomain auth to work, the cookie domain must be a parent of both the web and API domains.

**Example**: If web is at `play.example.com` and API is at `api.example.com`:
- Set `NEXTAUTH_URL=https://example.com` so the cookie domain is `.example.com` (covers all subdomains)
- Do NOT set `NEXTAUTH_URL=https://play.example.com` — the cookie on `.play.example.com` won't reach `api.example.com`

**Simplest approach**: Use a single domain for both, with path-based routing:
- `example.com` for web
- `example.com/api/` proxied to the API container

## SSL / Reverse Proxy

The containers serve plain HTTP. Use a reverse proxy for SSL.

### Caddy (automatic HTTPS)

```
# /etc/caddy/Caddyfile
play.example.com {
    reverse_proxy localhost:3000
}

api.example.com {
    reverse_proxy localhost:3001
}
```

### nginx (with certbot)

```nginx
server {
    listen 443 ssl;
    server_name play.example.com;

    ssl_certificate     /etc/letsencrypt/live/play.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/play.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Common Operations

All commands assume `-f docker-compose.prod.yml --env-file .env.prod`. You can alias this:

```bash
alias dc="docker compose -f docker-compose.prod.yml --env-file .env.prod"
```

### Logs

```bash
dc logs -f              # All services
dc logs -f web api      # Web + API only
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

Verify `NEXTAUTH_URL` matches the public URL users access. If behind a reverse proxy, ensure `X-Forwarded-Proto: https` is set so auth callbacks use the correct scheme.

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

Web health checks hit `/` on port 3000, API health checks hit `/api/health` on port 3001. Ensure those endpoints respond with 2xx.
