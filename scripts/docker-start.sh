#!/usr/bin/env bash
set -e

SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      echo "Usage: ./scripts/docker-start.sh [--skip-build]"
      echo ""
      echo "  --skip-build   Skip docker compose build (use existing images)"
      exit 0
      ;;
  esac
done

echo "=== Play Money — Docker Start ==="
echo ""

# 1. Create .env from .env.example if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo ""
  echo "  NOTE: Review .env and fill in optional values before proceeding."
  echo "  Defaults work out of the box for Docker, but you may want to set:"
  echo "    - NEXTAUTH_SECRET (generate via: openssl rand -base64 32)"
  echo "    - AUTH_RESEND_KEY (for email login — get from https://resend.com)"
  echo "    - AUTH_RESEND_EMAIL (sender address for auth emails)"
  echo ""
fi

# 2. Build images
if [ "$SKIP_BUILD" = true ]; then
  echo "Skipping build (--skip-build)"
else
  echo "Building Docker images (this may take a few minutes on first run)..."
  docker compose build
fi

# 3. Start all services
echo ""
echo "Starting services..."
docker compose up -d

# 4. Wait for services to be ready
echo ""
echo "Waiting for services to start..."
for i in $(seq 1 30); do
  web_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/v1/markets 2>/dev/null || echo "000")
  if [ "$web_status" != "000" ] && [ "$api_status" != "000" ]; then
    break
  fi
  sleep 2
done

echo ""
echo "=== Services ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== URLs ==="
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:3001"
echo ""
echo "=== Useful Commands ==="
echo "  docker compose logs -f          # Stream logs"
echo "  docker compose logs -f web      # Stream web logs only"
echo "  docker compose restart          # Restart all services"
echo "  docker compose down             # Stop all services"
echo "  docker compose down -v          # Stop and remove volumes (resets DB)"
echo ""
echo "  # Seed the database with sample data:"
echo "  docker compose run --rm db-setup sh -c \\"
echo "    'npx dotenv -e /dev/null -- npx tsx packages/database/seed.ts'"
echo ""
