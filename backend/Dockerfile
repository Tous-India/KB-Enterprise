# ============================================
# KB CRM Backend - Docker Image
# Node.js Express API
# ============================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Install dependencies and start dev server
CMD ["sh", "-c", "npm install && npm run dev"]
