#!/usr/bin/env bash
# Automated deploy of AgentProvision on a GCP VM (Debian/Ubuntu)

set -euo pipefail

# --- customize these values ---
REPO_URL="https://github.com/nomad3/agentprovision.git"
REPO_DIR="/opt/agentprovision"
GIT_REF="main"                       # branch or tag to deploy
ENV_FILE="$REPO_DIR/.env.production"

PRIMARY_DOMAIN="agentprovision.com"
ALT_DOMAIN="www.agentprovision.com"
LETSENCRYPT_EMAIL="admin@example.com"  # required for certbot; use a real address
# --- end customization ---

log()  { printf "\n[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die()  { log "ERROR: $*"; exit 1; }

require_root() {
  if [[ $EUID -ne 0 ]]; then
    die "Run this script as root (or with sudo)."
  fi
}

install_packages() {
  log "Ensuring git and base tooling are installed…"
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release git
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed."
    return
  fi

  log "Installing Docker Engine + Compose plugin…"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable
EOF

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
}

fetch_repo() {
  log "Fetching repository into $REPO_DIR…"
  if [[ -d $REPO_DIR/.git ]]; then
    git -C "$REPO_DIR" fetch --all --prune
    git -C "$REPO_DIR" checkout "$GIT_REF"
    git -C "$REPO_DIR" pull --ff-only origin "$GIT_REF"
  else
    git clone "$REPO_URL" "$REPO_DIR"
    git -C "$REPO_DIR" checkout "$GIT_REF"
  fi
}

prepare_env() {
  if [[ ! -f $ENV_FILE ]]; then
    log "Creating $ENV_FILE (edit values before continuing)."
    cat > "$ENV_FILE" <<'EOF'
APP_ENV=production
DATABASE_URL=postgresql+asyncpg://postgres:CHANGEME@db:5432/agentprovision
REDIS_URL=redis://redis:6379/0
SECRET_KEY=REPLACE_ME
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://agentprovision.com,https://www.agentprovision.com
NEXT_PUBLIC_API_BASE_URL=https://agentprovision.com
EOF
    chmod 600 "$ENV_FILE"
    log "IMPORTANT: edit $ENV_FILE with real secrets (DB password, SECRET_KEY, etc.) and rerun the script."
    exit 0
  fi
}

update_compose_ports() {
  log "Setting host-port overrides in docker-compose files…"
  local compose_dev="$REPO_DIR/docker-compose.yml"
  local compose_prod="$REPO_DIR/docker-compose.prod.yml"

  for file in "$compose_dev" "$compose_prod"; do
    [[ -f $file ]] || continue
    sed -i \
      -e 's/"3000:3000"/"13000:3000"/' \
      -e 's/"8000:8000"/"18000:8000"/' \
      -e 's/"5678:5678"/"15678:5678"/' \
      -e 's/"55432:5432"/"15432:5432"/' \
      "$file" || true
  done
}

build_and_start() {
  log "Building production images…"
  (
    cd "$REPO_DIR"
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" build
  )

  log "Launching containers…"
  (
    cd "$REPO_DIR"
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d
  )
}

post_checks() {
  log "Deployment complete."
  echo "Useful commands:"
  echo "  docker-compose -f $REPO_DIR/docker-compose.prod.yml --env-file $ENV_FILE ps"
  echo "  docker-compose -f $REPO_DIR/docker-compose.prod.yml --env-file $ENV_FILE logs -f"
  echo "  systemctl status nginx"
  echo "Ensure DNS for ${PRIMARY_DOMAIN} points to this VM. Firewall must allow ports 80/443."
}

main() {
  require_root
  install_packages
  install_docker
  fetch_repo
  prepare_env
  update_compose_ports
  build_and_start
  post_checks
}

main "$@"
