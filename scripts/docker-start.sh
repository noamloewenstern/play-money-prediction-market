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

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Play Money — Docker Start ==="
echo ""

# ── Port availability check ──────────────────────────────────────────

# Stop existing compose containers from this project first
running_containers=$(docker compose -f "$PROJECT_DIR/docker-compose.yml" ps -q 2>/dev/null || true)
if [ -n "$running_containers" ]; then
  echo "Stopping existing Play Money containers..."
  docker compose -f "$PROJECT_DIR/docker-compose.yml" down 2>/dev/null || true
  sleep 1
fi

# Find the docker container bound to a host port, if any.
# Returns container ID or empty string.
find_container_on_port() {
  local port=$1
  docker ps --format '{{.ID}} {{.Ports}}' 2>/dev/null | while read -r cid ports; do
    if echo "$ports" | grep -qE "0\.0\.0\.0:${port}->|:::${port}->"; then
      echo "$cid"
      return
    fi
  done
}

# Stop a process holding a port. Handles three cases:
#   1. Docker container → docker stop <container>
#   2. Project process (cwd inside PROJECT_DIR) → kill
#   3. External process → prompt user
stop_port_holder() {
  local pid=$1
  local port=$2
  local cmd
  cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")

  # Case 1: Docker container holding this port
  local container_id
  container_id=$(find_container_on_port "$port")
  if [ -n "$container_id" ]; then
    local container_name
    container_name=$(docker inspect --format '{{.Name}}' "$container_id" 2>/dev/null | sed 's|^/||')
    # Check if this container belongs to our compose project
    local compose_project
    compose_project=$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$container_id" 2>/dev/null || true)
    local project_name
    project_name=$(basename "$PROJECT_DIR")

    if [ "$compose_project" = "$project_name" ] || [ "$compose_project" = "play-money" ]; then
      echo "   Container '$container_name' (this project) — stopping..."
      docker stop "$container_id" >/dev/null 2>&1 || true
      return
    else
      echo "   Docker container '$container_name' (project: ${compose_project:-unknown}) is NOT from this project."
      printf "   [k]ill (docker stop) / [s]kip? "
      read -r choice </dev/tty
      case "$choice" in
        k|K|kill)
          echo "   Stopping container '$container_name'..."
          docker stop "$container_id" >/dev/null 2>&1 || true
          ;;
        *)
          echo "   Skipping port $port — service may fail to bind."
          ;;
      esac
      return
    fi
  fi

  # Case 2: Non-docker process — check if it belongs to this project
  local cwd=""
  cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n/' | head -1 | sed 's/^n//' || true)
  if [ -n "$cwd" ] && echo "$cwd" | grep -q "^$PROJECT_DIR"; then
    echo "   PID $pid ($cmd) belongs to this project — killing..."
    kill "$pid" 2>/dev/null || true
    return
  fi

  # Case 3: External process
  echo "   PID $pid ($cmd) is NOT from this project."
  printf "   [k]ill it / [s]kip? "
  read -r choice </dev/tty
  case "$choice" in
    k|K|kill)
      echo "   Killing PID $pid..."
      kill "$pid" 2>/dev/null || true
      ;;
    *)
      echo "   Skipping port $port — service may fail to bind."
      ;;
  esac
}

check_port() {
  local port=$1
  local label=$2
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  [ -z "$pids" ] && return 0

  echo "⚠  Port $port ($label) is in use."

  # Deduplicate — a docker port may show multiple PIDs (docker-proxy etc.)
  local handled_container=""
  for pid in $pids; do
    local container_id
    container_id=$(find_container_on_port "$port")
    # If we already handled this container, skip duplicate PIDs
    if [ -n "$container_id" ] && [ "$container_id" = "$handled_container" ]; then
      continue
    fi
    stop_port_holder "$pid" "$port"
    [ -n "$container_id" ] && handled_container="$container_id"
  done
  sleep 1
}

# Load POSTGRES_PORT from .env if set
if [ -f "$PROJECT_DIR/.env" ]; then
  _pg_port=$(grep -E '^POSTGRES_PORT=' "$PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]"'"'" || true)
  [ -n "$_pg_port" ] && POSTGRES_PORT="$_pg_port"
fi
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
check_port "$POSTGRES_PORT" "PostgreSQL"
check_port 3000 "Web"
check_port 3001 "API"
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
