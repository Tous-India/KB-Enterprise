# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy only required project files
COPY index.html ./
COPY vite.config.* ./
COPY src ./src
COPY public ./public

# Build project
RUN npm run build


# ---------- Production Stage ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]