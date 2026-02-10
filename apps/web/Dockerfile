# ServiceTsunami Web - Production Dockerfile
# Multi-stage build for optimal image size

# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment configuration
ARG REACT_APP_API_BASE_URL=https://servicetsunami.com
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (use npm install for better lock file compatibility)
RUN npm install --silent

# Copy source code
COPY . .

# Build production assets
RUN npm run build

# ===== Production Stage =====
FROM nginx:1.25-alpine

# Labels
LABEL maintainer="ServiceTsunami Team" \
      version="1.0.0" \
      description="ServiceTsunami Web - React Frontend"

# Install curl for health checks
RUN apk add --no-cache curl

# Create nginx user directories with correct permissions
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Update nginx.conf to run as non-root
RUN sed -i 's/user  nginx;/user nginx;/' /etc/nginx/nginx.conf && \
    sed -i '/^pid/c\pid /var/run/nginx.pid;' /etc/nginx/nginx.conf

# Set ownership for static files
RUN chown -R nginx:nginx /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
