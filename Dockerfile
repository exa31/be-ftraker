# Gunakan Bun official image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package file dan install depedensi
COPY bun.lock package.json ./
RUN bun install

# Copy semua file project
COPY . .

# Build project
RUN bun run build

# ======== STAGE RUNTIME (lebih kecil & ringan) ========
FROM oven/bun:1 AS runtime

WORKDIR /app

# Copy hasil build + node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json bun.lock ./

EXPOSE 3003

# Jalankan aplikasi
CMD ["bun", "run", "dist/index.js"]
