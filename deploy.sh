#!/bin/bash
set -e

DOMAIN="agentprovision.com"
WWW_DOMAIN="www.$DOMAIN"
EMAIL="saguilera1608@gmail.com"
PROJECT_ROOT="$(dirname "$0")" # This should be the absolute path to your project root
ENV_FILE="$PROJECT_ROOT/.env"

echo "Starting AgentProvision deployment script..."

echo "Loading environment configuration..."
if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
    echo "Loaded variables from $ENV_FILE"
else
    echo "No .env file found at $ENV_FILE; proceeding with defaults."
fi

TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE:-default}
TEMPORAL_GRPC_PORT=${TEMPORAL_GRPC_PORT:-7233}
TEMPORAL_WEB_PORT=${TEMPORAL_WEB_PORT:-8233}

if [ -z "${TEMPORAL_ADDRESS:-}" ] || [ "$TEMPORAL_ADDRESS" = "localhost:7233" ]; then
    TEMPORAL_ADDRESS="temporal:7233"
    echo "Setting TEMPORAL_ADDRESS to $TEMPORAL_ADDRESS for container networking."
fi

export TEMPORAL_ADDRESS
export TEMPORAL_NAMESPACE
export TEMPORAL_GRPC_PORT
export TEMPORAL_WEB_PORT

# --- 1. Install Prerequisites (if not already installed) ---
echo "Checking for prerequisites: Docker, Docker Compose, Nginx, Certbot..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker before proceeding."
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Please install Docker Compose (e.g., 'sudo apt install docker-compose') before proceeding."
    exit 1
fi

echo "All prerequisites found."

# --- 2. Use Fixed Ports (or override from environment) ---
echo "Configuring service ports..."

# Use environment variables if set, otherwise use fixed default ports
API_PORT=${API_PORT:-8001}
WEB_PORT=${WEB_PORT:-8002}
DB_PORT=${DB_PORT:-8003}
REDIS_PORT=${REDIS_PORT:-8004}

echo "Using ports:"
echo "API Port: $API_PORT"
echo "Web Port: $WEB_PORT"
echo "DB Port: $DB_PORT"
echo "Redis Port: $REDIS_PORT"
echo "Temporal gRPC Port: $TEMPORAL_GRPC_PORT"
echo "Temporal Web UI Port: $TEMPORAL_WEB_PORT"

# Export ports so docker-compose can use them
export API_PORT=$API_PORT
export WEB_PORT=$WEB_PORT
export DB_PORT=$DB_PORT
export REDIS_PORT=$REDIS_PORT
export TEMPORAL_GRPC_PORT=$TEMPORAL_GRPC_PORT
export TEMPORAL_WEB_PORT=$TEMPORAL_WEB_PORT

TEMPORAL_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.temporal.yml"

cat > "$TEMPORAL_COMPOSE_FILE" <<EOF
services:
  temporal:
    image: temporalio/auto-setup:1.22.2
    restart: unless-stopped
    environment:
      - DB=sqlite
      - SQL_PLUGIN=sqlite
      - SQLITE_PATH=/temporal/tmp/temporal.db
      - TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS}
      - TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE}
    ports:
      - "${TEMPORAL_GRPC_PORT}:7233"
      - "${TEMPORAL_WEB_PORT}:8233"

  api:
    environment:
      - TEMPORAL_ADDRESS=$TEMPORAL_ADDRESS
      - TEMPORAL_NAMESPACE=$TEMPORAL_NAMESPACE
    depends_on:
      - db
      - temporal
EOF

COMPOSE_FILES=("-f" "$PROJECT_ROOT/docker-compose.yml" "-f" "$TEMPORAL_COMPOSE_FILE")

docker_compose() {
    docker-compose "${COMPOSE_FILES[@]}" "$@"
}

echo "Docker Compose configuration with resolved ports (including Temporal):"
docker_compose config

# --- 3. Setup API Environment File ---
echo "Setting up API environment file..."
PRODUCTION_ENV="$PROJECT_ROOT/PRODUCTION.env"
API_ENV="$PROJECT_ROOT/apps/api/.env"

if [ -f "$PRODUCTION_ENV" ]; then
    echo "Copying PRODUCTION.env to apps/api/.env..."
    cp "$PRODUCTION_ENV" "$API_ENV"
    echo "✓ API environment file configured"

    # Verify critical variables are present
    if grep -q "ANTHROPIC_API_KEY" "$API_ENV"; then
        echo "✓ ANTHROPIC_API_KEY found in environment file"
    else
        echo "⚠️  WARNING: ANTHROPIC_API_KEY not found in PRODUCTION.env"
        echo "   Chat functionality will not work without this key"
    fi
else
    echo "⚠️  WARNING: PRODUCTION.env not found at $PRODUCTION_ENV"
    echo "   Using existing apps/api/.env if available"
    if [ ! -f "$API_ENV" ]; then
        echo "❌ ERROR: No environment file found. Please create PRODUCTION.env or apps/api/.env"
        exit 1
    fi
fi

# --- 4. Stop Existing Docker Compose Services ---
echo "Stopping any existing Docker Compose services..."
docker_compose down --remove-orphans || true # Use || true to prevent script from exiting if no services are running

# --- 5. Build and Start Docker Compose ---
echo "Building and starting Docker Compose services..."
docker_compose up --build -d

echo "Docker Compose services started."
echo "Temporal server available on gRPC $TEMPORAL_ADDRESS (host port $TEMPORAL_GRPC_PORT)."
echo "Temporal Web UI exposed on http://$DOMAIN:$TEMPORAL_WEB_PORT (or host localhost:$TEMPORAL_WEB_PORT during provisioning)."

# --- 6. Configure Nginx ---
echo "Configuring Nginx for $DOMAIN and $WWW_DOMAIN..."

NGINX_CONF_PATH="/etc/nginx/sites-available/$DOMAIN"

sudo bash -c "cat > $NGINX_CONF_PATH" <<EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN $WWW_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the Nginx site
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    sudo ln -s "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/$DOMAIN"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl reload nginx

echo "Nginx configured and reloaded."

# --- 7. Run Certbot for SSL Certificate ---
echo "Running Certbot to obtain SSL certificate for $DOMAIN..."
sudo certbot --nginx -d "$DOMAIN" -d "$WWW_DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

# Certbot automatically modifies Nginx config and reloads Nginx.
# If it fails, Nginx might not be reloaded, so we'll do it again for good measure.
echo "Restarting Nginx after Certbot (if needed)..."
sudo systemctl reload nginx

# --- 8. Wait for Services to be Ready ---
echo ""
echo "Waiting for services to be ready..."
echo "Checking API health..."

MAX_RETRIES=30
RETRY_COUNT=0
API_READY=false

# Try both HTTP and HTTPS, starting with HTTP for initial checks
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # First try HTTP directly to the port (before SSL is fully configured)
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$API_PORT/api/v1/" 2>/dev/null | grep -q "200"; then
        API_READY=true
        echo "✓ API is ready!"
        break
    fi
    # Also try HTTPS if we're past SSL setup
    if curl -s -k -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/v1/" 2>/dev/null | grep -q "200"; then
        API_READY=true
        echo "✓ API is ready (via HTTPS)!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for API... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ "$API_READY" = false ]; then
    echo "⚠️  WARNING: API did not become ready within expected time"
    echo "You may need to check the logs: docker-compose logs api"
fi

# --- 9. Run End-to-End Tests ---
echo ""
echo "==========================================="
echo "Running End-to-End Tests"
echo "==========================================="

E2E_TEST_SCRIPT="$PROJECT_ROOT/scripts/e2e_test_production.sh"
TEST_EXIT_CODE=0

if [ -f "$E2E_TEST_SCRIPT" ]; then
    chmod +x "$E2E_TEST_SCRIPT"

    # Run tests and capture exit code
    # Try HTTPS first, fall back to HTTP if needed
    set +e  # Don't exit on test failure
    if curl -s -k -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/v1/" 2>/dev/null | grep -q "200"; then
        echo "Running E2E tests via HTTPS..."
        BASE_URL="https://$DOMAIN" "$E2E_TEST_SCRIPT"
        TEST_EXIT_CODE=$?
    else
        echo "HTTPS not available yet, running E2E tests via HTTP..."
        BASE_URL="http://localhost:$API_PORT" "$E2E_TEST_SCRIPT"
        TEST_EXIT_CODE=$?
    fi
    set -e  # Re-enable exit on error

    echo ""
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "✅ All E2E tests passed!"
    else
        echo "⚠️  Some E2E tests failed (exit code: $TEST_EXIT_CODE)"
        echo "Please review the test output above for details"
        echo "You can re-run tests manually with: $E2E_TEST_SCRIPT"
    fi
else
    echo "⚠️  E2E test script not found at $E2E_TEST_SCRIPT"
    echo "Skipping automated tests"
    TEST_EXIT_CODE=0  # Don't fail deployment if test script missing
fi

echo ""
echo "==========================================="
echo "Deployment Complete!"
echo "==========================================="
echo "Your application is now accessible at https://$DOMAIN"
echo ""
echo "Service Details:"
echo "  - API: https://$DOMAIN/api/v1/"
echo "  - Web: https://$DOMAIN/"
echo "  - API Internal Port: $API_PORT"
echo "  - Web Internal Port: $WEB_PORT"
echo "  - Temporal gRPC: localhost:$TEMPORAL_GRPC_PORT"
echo "  - Temporal Web UI: localhost:$TEMPORAL_WEB_PORT"
echo ""
echo "Useful Commands:"
echo "  - View API logs: docker-compose logs -f api"
echo "  - View Web logs: docker-compose logs -f web"
echo "  - Run E2E tests: $E2E_TEST_SCRIPT"
echo "  - Restart services: docker-compose restart"
echo ""
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "⚠️  IMPORTANT: E2E tests detected issues. Please review and fix before considering deployment complete."
    exit 1
fi
