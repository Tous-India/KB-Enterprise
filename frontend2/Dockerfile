# ============================================
# KB CRM Frontend - Docker Image
# React/Vite Application
# ============================================

FROM node:20-alpine

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Install dependencies and start dev server
CMD ["sh", "-c", "npm install && npm run dev -- --host"]
