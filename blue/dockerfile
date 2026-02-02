# Use Node with Debian to ensure Prisma OpenSSL compatibility.
FROM node:24-bookworm-slim AS base

# Install OpenSSL (Prisma needs it) and set up pnpm via Corepack.
# TODO dont use fixed pnpm version, instead use the one defined in .npmrc once supported by corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

### 1) Dependencies (with dev) ###
FROM base AS deps
# Copy lockfile and manifest first for better layer caching.
COPY package.json pnpm-lock.yaml ./
# Copy prisma schema early so pnpm postinstall/generate can run correctly if configured.
COPY prisma ./prisma

# Install all deps (incl. dev) for build.
RUN pnpm install --frozen-lockfile

### 2) Build ###
FROM base AS builder
WORKDIR /app
# Reuse installed deps from deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY . .

# Ensure Prisma client is generated.
RUN pnpm exec prisma generate --schema=./prisma/schema.prisma

# Build the app.
RUN pnpm build

### 3) Prune to production deps ###
FROM base AS pruner
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
# Remove devDependencies to slim final image.
RUN pnpm prune --prod --ignore-scripts

### 4) Runtime ###
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry.
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL runtime libraries IN THE FINAL STAGE. This is crucial for Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 --ingroup nextjs nextjs

# Copy production node_modules and build output.
COPY --from=pruner --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./
COPY --from=builder --chown=nextjs:nextjs /app/next.config.mjs ./

EXPOSE 3000
ENV PORT=3000

USER nextjs

# Start the application using Next.js.
CMD ["node", "node_modules/next/dist/bin/next", "start"]