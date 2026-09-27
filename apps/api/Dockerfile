FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

FROM base AS dependencies

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules

# Copy source
COPY . .

# Build API
RUN pnpm --filter @hy10/api build

FROM base AS runtime

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Expose API port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "pnpm --filter @hy10/api migration:run && pnpm --filter @hy10/api start:prod"]
