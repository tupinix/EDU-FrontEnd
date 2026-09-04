# EDU Platform Frontend - Dockerfile
# Multi-stage build

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Edition / API base baked at build time (Vite inlines VITE_* at build).
# Defaults keep the Cloud build unchanged; the Edge stack passes edition=edge.
# VITE_API_URL=/api matches the nginx reverse-proxy in this image (same origin).
ARG VITE_EDU_EDITION=cloud
ARG VITE_API_URL=/api
ENV VITE_EDU_EDITION=$VITE_EDU_EDITION \
    VITE_API_URL=$VITE_API_URL

# Build
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
