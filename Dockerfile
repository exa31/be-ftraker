# ===== STAGE 1: BUILD =====
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install deps (gunakan clean cache + npm ci utk production consistency)
RUN npm ci

# Copy semua source code
COPY . .

# Build TypeScript -> dist
RUN npm run build


# ===== STAGE 2: RUNTIME =====
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy hanya node_modules dan output build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3003

# Jalankan aplikasi
CMD ["node", "dist/index.js"]
