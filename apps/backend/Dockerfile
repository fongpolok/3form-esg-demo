FROM node:20-slim AS base
WORKDIR /workspace

# Puppeteer needs a real Chromium + its shared-lib dependencies present in
# the image; this is why the backend image is not node:20-alpine.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-validation/package.json packages/shared-validation/
COPY apps/backend/package.json apps/backend/
RUN npm install --workspace=@esg/backend --workspace=@esg/shared-types --workspace=@esg/shared-validation --include-workspace-root

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/config packages/config
COPY packages/shared-types packages/shared-types
COPY packages/shared-validation packages/shared-validation
COPY apps/backend apps/backend
RUN npm run prisma:generate --workspace=@esg/backend
# shared-types/shared-validation ship compiled JS (not raw .ts) because the
# backend's compiled dist/main.js requires() them at plain-Node runtime,
# which can't resolve TypeScript source the way ts-node/Vite/tsc can — see
# packages/shared-types and packages/shared-validation's tsconfig.build.json.
# Must run before building backend, which needs their .d.ts for typechecking.
RUN npm run build --workspace=@esg/shared-types --workspace=@esg/shared-validation
RUN npm run build --workspace=@esg/backend

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /workspace/node_modules ./node_modules
# node_modules/@esg/shared-types and @esg/shared-validation are npm-workspace
# symlinks into these two directories — without copying the real directories
# too, those symlinks would dangle in this stage and require() would fail.
COPY --from=build /workspace/packages/shared-types packages/shared-types
COPY --from=build /workspace/packages/shared-validation packages/shared-validation
COPY --from=build /workspace/apps/backend/dist ./apps/backend/dist
COPY --from=build /workspace/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /workspace/apps/backend/package.json ./apps/backend/package.json

WORKDIR /workspace/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
