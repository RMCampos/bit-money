# Build static files
# Node Bullseye has npm
FROM node:22.14-bookworm-slim AS build

# Build
WORKDIR /app
COPY *.html *.json *.js *.ts ./
COPY ./src ./src
COPY ./public ./public
RUN npm ci --ignore-scripts --no-update-notifier --omit=dev && \
    npm run build && \
    rm -rf node_modules

# Deploy container
# Caddy serves static files
FROM caddy:2.9.1-alpine
RUN apk add --no-cache ca-certificates curl

# Receive build number as argument, retain as environment variable
ARG VITE_BUILD
ARG SOURCE_PR
ENV VITE_BUILD=${VITE_BUILD}
ENV SOURCE_PR=${SOURCE_PR}

# Add metadata to the final image
LABEL org.opencontainers.image.authors="Ricardo Campos <ricardompcampos@gmail.com>" \
      org.opencontainers.image.vendor="Ricardo Campos Org" \
      org.opencontainers.image.title="Silent Guard app" \
      org.opencontainers.image.description="Simple vanilla Vite Web app application" \
      org.opencontainers.image.version="${SOURCE_PR}" \
      org.opencontainers.image.source="https://github.com/rmcampos/silent-guard"

# Copy files and run formatting
COPY --from=build /app/dist/ /app/dist
COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

# User, port and healthcheck
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["curl", "-f", "http://localhost:5173"]
USER 1001
