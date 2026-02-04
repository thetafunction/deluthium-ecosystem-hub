# DarkPool Market Maker Example
# Go-based WebSocket MM reference implementation

FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git protobuf-dev

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o mm-server ./cmd/mm

# Production image
FROM alpine:3.19 AS production

# Install CA certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/mm-server .

# Copy default configuration
COPY configs/config.example.yaml /app/configs/config.yaml

# Environment variables
ENV DELUTHIUM_JWT=""
ENV WS_URL="wss://mmhub.deluthium.ai/ws"
ENV CHAIN_ID=56
ENV LOG_LEVEL=info
ENV CONFIG_PATH=/app/configs/config.yaml

# Health check (via logs - MM uses WebSocket)
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep mm-server || exit 1

# Create entrypoint script
RUN echo '#!/bin/sh\n\
echo "========================================"\n\
echo "DarkPool Market Maker Example (Go)"\n\
echo "========================================"\n\
echo ""\n\
echo "WebSocket URL: ${WS_URL}"\n\
echo "Chain ID: ${CHAIN_ID}"\n\
echo "Config: ${CONFIG_PATH}"\n\
echo ""\n\
\n\
if [ -z "$DELUTHIUM_JWT" ]; then\n\
    echo "ERROR: DELUTHIUM_JWT is required!"\n\
    exit 1\n\
fi\n\
\n\
echo "Starting Market Maker..."\n\
exec ./mm-server --config ${CONFIG_PATH}\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Volumes
VOLUME ["/app/configs"]

# Security: Run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

ENTRYPOINT ["/entrypoint.sh"]
