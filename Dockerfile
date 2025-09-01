# Gunakan Bun official image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package file dan install depedensi
COPY bun.lock package.json ./
RUN bun install --production

# Copy semua file project
COPY . .

# Expose port (misalnya 3000)
EXPOSE 3000

# Jalankan aplikasi
CMD ["bun", "run", "start"]
