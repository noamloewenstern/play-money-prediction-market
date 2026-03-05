#!/usr/bin/env bash
set -e

echo "=== Play Money Local Setup ==="

# 1. Create .env from .env.example if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example"
  echo ""
  echo "⚠️  NOTE: Fill in the following required values in .env before running the app:"
  echo "  - NEXTAUTH_SECRET (generate via: openssl rand -base64 32)"
  echo "  - AUTH_RESEND_KEY (optional, get from Resend or ask @case)"
  echo "  - DEV_DB_SEED_EMAIL (optional, your email for seed data)"
  echo ""
else
  echo "✓ .env already exists"
fi

# 2. Start Postgres via Docker Compose
echo "Starting Postgres..."
docker compose up -d postgres

# 3. Wait for Postgres to be ready
# Load .env vars for use in this script
set -a
source .env
set +a

echo "Waiting for Postgres to be healthy..."
until docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  sleep 1
  echo "  ..."
done
echo "✓ Postgres is ready"

# 4. Push schema (runs all migrations)
echo "Pushing Prisma schema..."
npm run db:push

# 5. Create HOUSE account (required before seeding)
echo "Creating house account..."
npx dotenv -e .env -- npx prisma db execute --stdin <<'SQL'
INSERT INTO "Account" (id, type, "internalType", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'HOUSE', 'HOUSE', NOW(), NOW())
ON CONFLICT ("internalType") DO NOTHING;
SQL

# 6. Seed database
echo "Seeding database..."
cd packages/database && npx dotenv -e ../../.env -- npx prisma db seed && cd ../..

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Edit .env and fill in required values (NEXTAUTH_SECRET, etc.)"
echo "  2. Run 'npm run dev' to start the dev servers"
echo "  3. Web: http://localhost:3000"
echo "  4. API: http://localhost:3001"
echo "  5. Prisma Studio: http://localhost:5555"
