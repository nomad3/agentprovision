#!/bin/bash
set -e

DOMAIN="agentprovision.com"
WWW_DOMAIN="www.$DOMAIN"
EMAIL="saguilera1608@gmail.com"
PROJECT_ROOT="$(dirname "$0")" # This should be the absolute path to your project root

echo "Starting AgentProvision deployment script..."

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

# --- 2. Generate Random Ports ---
echo "Generating random ports for API and Web services..."

# Function to generate a random port in a high range (e.g., 10000-65535)
generate_random_port() {
    shuf -i 10000-65535 -n 1
}

API_PORT=8001
WEB_PORT=8002
DB_PORT=8003
REDIS_PORT=8004

# Basic check to ensure ports are not the same (unlikely but possible)
while [ "$API_PORT" -eq "$WEB_PORT" ] || [ "$API_PORT" -eq "$DB_PORT" ] || [ "$WEB_PORT" -eq "$DB_PORT" ] || [ "$API_PORT" -eq "$REDIS_PORT" ] || [ "$WEB_PORT" -eq "$REDIS_PORT" ] || [ "$DB_PORT" -eq "$REDIS_PORT" ]; do
    REDIS_PORT=$(generate_random_port)
done

echo "Using fixed ports:"
echo "API Port: $API_PORT"
echo "Web Port: $WEB_PORT"
echo "DB Port: $DB_PORT"
echo "Redis Port: $REDIS_PORT"

# Export ports so docker-compose can use them
export API_PORT=$API_PORT
export WEB_PORT=$WEB_PORT
export DB_PORT=$DB_PORT
export REDIS_PORT=$REDIS_PORT

echo "Docker Compose configuration with resolved ports:"
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config

# --- 3. Stop Existing Docker Compose Services ---
echo "Stopping any existing Docker Compose services..."
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down --remove-orphans || true # Use || true to prevent script from exiting if no services are running

# --- 4. Build and Start Docker Compose ---
echo "Building and starting Docker Compose services..."
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up --build -d

echo "Docker Compose services started."

# --- 5. Configure Nginx ---
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

# --- 6. Run Certbot for SSL Certificate ---
echo "Running Certbot to obtain SSL certificate for $DOMAIN..."
sudo certbot --nginx -d "$DOMAIN" -d "$WWW_DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

# Certbot automatically modifies Nginx config and reloads Nginx.
# If it fails, Nginx might not be reloaded, so we'll do it again for good measure.
echo "Restarting Nginx after Certbot (if needed)..."
sudo systemctl reload nginx

echo "Deployment complete!"
echo "Your application should now be accessible at https://$DOMAIN"
echo "API is internally exposed on port $API_PORT"
echo "Web is internally exposed on port $WEB_PORT"
