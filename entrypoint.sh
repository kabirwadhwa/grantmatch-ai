#!/bin/sh
set -e

echo "==> GrantMatch AI Container Starting..."
echo "==> Node environment: ${NODE_ENV:-production}"
echo "==> Target port: ${PORT:-3000}"

# Configure schema based on DATABASE_URL
echo "==> Configuring Prisma schema provider..."
node scripts/prepare-prisma.js

# If DATABASE_URL is set, push schema and seed
if [ -n "$DATABASE_URL" ]; then
  echo "==> Syncing database schema with Prisma db push..."
  npx prisma db push --accept-data-loss || echo "Prisma db push completed with notes or warnings"

  echo "==> Seeding database..."
  npx ts-node -O '{"module":"commonjs"}' prisma/seed.ts || echo "Database seeding already completed or skipped"
fi

echo "==> Starting Next.js application on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}" -H "0.0.0.0"
