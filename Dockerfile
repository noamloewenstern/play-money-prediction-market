# ============================================
# Stage 1: base
# ============================================
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1

# ============================================
# Stage 2: deps — install dependencies (cached until package*.json changes)
# ============================================
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/storybook/package.json ./apps/storybook/
COPY packages/api-helpers/package.json ./packages/api-helpers/
COPY packages/auth/package.json ./packages/auth/
COPY packages/comments/package.json ./packages/comments/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/finance/package.json ./packages/finance/
COPY packages/lists/package.json ./packages/lists/
COPY packages/markets/package.json ./packages/markets/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/quests/package.json ./packages/quests/
COPY packages/referrals/package.json ./packages/referrals/
COPY packages/search/package.json ./packages/search/
COPY packages/transparency/package.json ./packages/transparency/
COPY packages/ui/package.json ./packages/ui/
COPY packages/users/package.json ./packages/users/

RUN npm ci

# ============================================
# Stage 3: builder — generate prisma, build UI CSS & Next.js apps
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
# Copy workspace-level node_modules (non-hoisted packages due to version conflicts)
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# NEXT_PUBLIC_* vars baked into client JS at build time
ARG NEXT_PUBLIC_WEB_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Auth vars required at build time for SSR page data collection
ENV NEXTAUTH_URL=$NEXT_PUBLIC_WEB_URL
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV AUTH_RESEND_EMAIL=build@placeholder.com

# Dummy DB URL for build-time static generation (not used for actual connections)
ENV POSTGRES_PRISMA_URL=postgresql://build:build@localhost:5432/build?schema=public
ENV POSTGRES_URL_NON_POOLING=postgresql://build:build@localhost:5432/build?schema=public

# Generate Prisma client + Zod types (no DB needed)
RUN npx prisma generate --schema=packages/database/schema.prisma

# Build UI CSS (required before Next.js builds)
RUN npm run build --workspace=@play-money/ui

# Build both Next.js apps
RUN npm run build --workspace=web && \
    npm run build --workspace=api

# ============================================
# Stage 4: web — production image
# ============================================
FROM base AS web
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/ui/dist ./packages/ui/dist

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# ============================================
# Stage 5: api — production image
# ============================================
FROM base AS api
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/static ./apps/api/.next/static

USER nextjs
EXPOSE 3001
CMD ["node", "apps/api/server.js"]
