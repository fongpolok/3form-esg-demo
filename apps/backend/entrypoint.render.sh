#!/bin/sh
set -e

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
