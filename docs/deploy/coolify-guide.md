# Deploy Play Money on Coolify

This guide walks through deploying the full Play Money stack (web + API + Postgres + Caddy) on [Coolify](https://coolify.io) using Docker Compose.

The compose stack includes a built-in Caddy reverse proxy that handles SSL and path-based routing on a single domain.

## Prerequisites

- A server (VPS) with at least 2 vCPU / 2 GB RAM / 20 GB disk
- A domain with DNS access (e.g., `example.com`)
- Your Play Money repo on GitHub (or GitLab/Bitbucket)

## 1. Install Coolify

SSH into your server and run:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Once installed, access the Coolify dashboard at `http://<server-ip>:8000`. Create your admin account on first visit.

## 2. Connect Your Git Source

1. Go to **Settings** > **Git Sources**
2. Click **Add** > **GitHub**
3. Follow the OAuth flow or add a deploy key to connect your repo

## 3. Create the Docker Compose Resource

1. From the dashboard, click **+ New Resource**
2. Select your server
3. Choose **Docker Compose**
4. Select your GitHub repo and branch (`main`)
5. Set the **Docker Compose file path** to: `docker-compose.prod.yml`

## 4. Configure Environment Variables

In the resource's **Environment Variables** tab, add:

### Required

| Variable | Value | Notes |
|----------|-------|-------|
| `DOMAIN` | `example.com` | Public domain for URLs |
| `POSTGRES_PASSWORD` | *(generate a strong random password)* | `openssl rand -base64 24` |
| `NEXTAUTH_SECRET` | *(generate a random secret)* | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://example.com` | Must match the domain |
| `NEXT_PUBLIC_WEB_URL` | `https://example.com` | Baked at build time |
| `NEXT_PUBLIC_API_URL` | `https://example.com` | Same domain — Caddy routes `/api/*` and `/v1/*` to API |

### Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `POSTGRES_USER` | `postgres` | |
| `POSTGRES_DB` | `playmoney` | |
| `AUTH_RESEND_KEY` | *(empty)* | For magic link email login ([resend.com](https://resend.com)) |
| `AUTH_RESEND_EMAIL` | *(empty)* | Sender address (e.g., `noreply@example.com`) |
| `AUTH_EMAIL_WHITELIST` | *(empty)* | Comma-separated allowed emails; empty = open registration |

## 5. Configure Domain & Ports

The compose stack includes Caddy, which handles SSL and routing. You need to ensure Caddy can bind to ports 80 and 443 on the host.

### Option A: Let Caddy handle SSL directly (recommended)

Set the DNS A record for your domain to the server IP:

```
example.com  →  A  →  <server-ip>
```

Caddy serves plain HTTP on port 3080 by default (configurable via `CADDY_PORT`). Configure Coolify's Traefik to proxy your domain to Caddy's port for SSL termination.

Optionally set `CADDY_PORT=80` if Traefik is not using that port.

### Option B: Use Coolify's Traefik in front of Caddy

If you need Traefik for other apps on the same server:
1. Keep the default `CADDY_PORT=3080` or set a custom one
2. Configure Coolify/Traefik to proxy `example.com` to Caddy's port

## 6. Deploy

Click **Deploy** in the Coolify dashboard. Coolify will:

1. Pull the repo
2. Run `docker compose -f docker-compose.prod.yml build`
3. Start all services in order:
   - Postgres starts first (healthcheck)
   - `db-setup` runs migrations
   - `web` and `api` start after migrations complete
   - Caddy starts after web and api are healthy

First build takes a few minutes. Subsequent deploys are faster due to Docker layer caching.

## 7. Verify

After deployment, check:

```
https://example.com           → should load the web app
https://example.com/api/health → should return 200 with health JSON
https://example.com/v1/markets → should return API response
```

In Coolify, check the **Logs** tab for each service to confirm healthy startup.

## Common Operations

### View logs

Use Coolify's **Logs** tab, or SSH into the server:

```bash
docker compose -f docker-compose.prod.yml logs -f web api caddy
```

### Seed the database

```bash
docker compose -f docker-compose.prod.yml run --rm db-setup sh -c \
  'npx dotenv -e /dev/null -- npx tsx packages/database/seed.ts'
```

### Database backup

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres playmoney > backup_$(date +%Y%m%d).sql
```

### Database restore

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres playmoney < backup_20240101.sql
```

### Force rebuild (after changing NEXT_PUBLIC_* vars)

`NEXT_PUBLIC_*` values are baked into the client JS at build time. If you change them, you must rebuild:

1. Update the env vars in Coolify
2. Click **Redeploy** (not just restart)

## Troubleshooting

### Services won't start

Check that all required env vars are set. The compose file uses `${VAR:?message}` syntax — Docker will refuse to start if any required var is missing.

### Auth redirects to wrong URL / login doesn't work

- Verify `NEXTAUTH_URL` matches your domain exactly (e.g., `https://example.com`)
- With single-domain routing, cookie issues are eliminated — all requests go to the same domain

### 502 Bad Gateway after deploy

Services may still be starting. The `web` and `api` containers have a 30s `start_period` on health checks. Caddy won't start until both are healthy. Wait ~60 seconds and retry.

### Port conflict

Caddy defaults to port 3080 to avoid conflicts. Set `CADDY_PORT` to a different value if needed.

### Build runs out of memory

The Next.js build can use >1 GB RAM. If it OOMs:
- Increase server RAM to 4 GB
- Or set in Coolify env vars: `NODE_OPTIONS=--max-old-space-size=2048`

### Coolify can't find docker-compose.prod.yml

Make sure the compose file path is set correctly in the resource settings. It should be `docker-compose.prod.yml` (at the repo root).
