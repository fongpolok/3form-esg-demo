#!/bin/sh
set -e

# render.yaml can't compose a single DATABASE_URL from a generated password
# plus another service's hostname in one Blueprint env var (fromService
# maps one value, not a template) — so it hands over DB_HOST/DB_PASSWORD
# separately and this assembles the URL Prisma actually needs. User/db name/
# port match what render.yaml's esg-mysql service is seeded with.
export DATABASE_URL="mysql://esg_app:${DB_PASSWORD}@${DB_HOST}:3306/esg_platform"

# Render deploys each Blueprint service independently — there's no
# depends_on/condition:service_healthy the way docker-compose.yml has
# locally, and esg-mysql's own first boot (initializing a fresh data
# directory, then Render's HTTP-port-scan shim, then mysqld itself) can
# take longer than esg-backend's container needs to reach this line. Under
# `set -e`, a `migrate deploy` that fails once because MySQL isn't up yet
# would exit this whole script immediately — so retry instead of failing
# fast; `migrate deploy` is idempotent, safe to call repeatedly. Capped at
# ~4 minutes to stay inside Render's own ~5 minute port-scan timeout.
attempt=1
max_attempts=24
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "prisma migrate deploy still failing after $attempt attempts — giving up."
    exit 1
  fi
  echo "prisma migrate deploy failed (attempt $attempt/$max_attempts) — MySQL probably isn't ready yet. Retrying in 10s..."
  attempt=$((attempt + 1))
  sleep 10
done

# seed.js uses plain .create() throughout (not upsert), so it isn't safe to
# rerun — this only fires once, on the first boot against an empty
# database. Every later restart/redeploy sees an existing user row and
# skips straight to starting the server.
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then((c) => { console.log(c); process.exit(0); }).catch(() => { console.log(0); process.exit(0); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "Empty database — running seed..."
  node dist-seed/prisma/seed.js
fi

exec node dist/main.js
