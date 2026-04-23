FROM node:20-slim AS base

# Install system dependencies needed for native modules & Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate

# ───────────────────────────── deps stage ─────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# --ignore-scripts skips the postinstall (prisma generate) hook.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ───────────────────────────── builder stage ──────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Provide dummy DATABASE_URL for prisma generate
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema ./prisma/schema

# Compile TypeScript
RUN pnpm run build

# ───────────────────────────── runner stage ───────────────────────────
FROM base AS runner
WORKDIR /app

# Copy EVERYTHING needed for runtime from builder
# This includes the generated Prisma client in node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

ENV PRISMA_CLIENT_ENGINE_TYPE="library"
ENV NODE_ENV=production

EXPOSE 4000

# Runtime database sync and start
# We use db push as a fallback because of the multi-file schema path complexities
CMD ["sh", "-c", "npx prisma db push --schema ./prisma/schema && node dist/server.js"]