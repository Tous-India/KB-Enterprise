# ============================================
# KB CRM Backend - Development Image
# Contains full source code
# Usage: npm install runs on container start
# ============================================

FROM node:20-alpine

# Install git (needed for some npm packages)
RUN apk add --no-cache git

WORKDIR /app

# Copy all source code
COPY . .

# Expose port
EXPOSE 5000

# Default: install deps and run dev server
CMD ["sh", "-c", "npm install && npm run dev"]
