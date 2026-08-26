#!/bin/sh
set -e

# render.yaml can't compose a single DATABASE_URL from a generated password
# plus another service's hostname in one Blueprint env var (fromService
# maps one value, not a template) — so it hands over DB_HOST/DB_PASSWORD
# separately and this assembles the URL Prisma actually needs. User/db name/
# port match what render.yaml's esg-mysql service is seeded with.
export DATABASE_URL="mysql://esg_app:${DB_PASSWORD}@${DB_HOST}:3306/esg_platform"

npx prisma migrate deploy

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
