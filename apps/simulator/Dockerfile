FROM node:20-slim AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/
COPY apps/simulator/package.json apps/simulator/
RUN npm install --workspace=@esg/simulator --workspace=@esg/shared-types --include-workspace-root

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/config packages/config
COPY packages/shared-types packages/shared-types
COPY apps/simulator apps/simulator
RUN npm run build --workspace=@esg/shared-types
RUN npm run build --workspace=@esg/simulator

FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages/shared-types packages/shared-types
COPY --from=build /workspace/apps/simulator/dist ./apps/simulator/dist
WORKDIR /workspace/apps/simulator
CMD ["node", "dist/index.js"]
