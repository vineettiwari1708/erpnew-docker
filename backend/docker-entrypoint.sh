#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss || true

echo "Seeding database..."
node prisma/seed.js || true

echo "Starting server..."
exec node src/server.js
