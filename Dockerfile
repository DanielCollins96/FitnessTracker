## Multi-stage Dockerfile for FitnessTracker
# - builder: installs deps and builds the client + server bundle
# - runner: lightweight production image that runs `node dist/index.js`

FROM node:20-slim AS builder
WORKDIR /app

# install build-time deps
COPY package.json package-lock.json* ./
# install dev deps for build (ensures esbuild, vite, etc are present)
# IMPORTANT: do NOT omit optional dependencies — rollup installs platform-specific
# optional native packages (eg @rollup/rollup-linux-arm64-gnu) and omitting them
# causes "Cannot find module @rollup/rollup-..." errors during the build.
RUN npm ci --include=optional && npx esbuild --version

# copy everything and run the build (vite + esbuild as configured in package.json)
COPY . .
RUN npm run build

## Production image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built server and client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy node_modules from builder to avoid reinstalling heavy native deps
# (this includes dev deps from build stage but keeps runtime simple)
## Copy node_modules but prune devDependencies to reduce size
COPY --from=builder /app/node_modules ./node_modules
RUN if [ -f package.json ]; then npm prune --production; fi

EXPOSE 3000

# Use a non-root user if you want (optional)
RUN groupadd -r app && useradd -r -g app app
USER app

CMD ["node", "dist/index.js"]
