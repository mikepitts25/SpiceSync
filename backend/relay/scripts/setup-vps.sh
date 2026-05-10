#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Set up the SpiceSync relay on an Ubuntu VPS.

Run from the repo root or backend/relay:

  sudo bash backend/relay/scripts/setup-vps.sh

Useful environment overrides:

  SERVER_IP=185.135.137.33
  RELAY_HOSTNAME=185-135-137-33.sslip.io
  REPO_DIR=/opt/SpiceSync
  SKIP_GIT_PULL=1
  CONFIGURE_UFW=0

EOF
  exit 0
fi

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

log() {
  printf '\n==> %s\n' "$*"
}

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_repo_dir() {
  if [[ -n "${REPO_DIR:-}" ]]; then
    printf '%s\n' "$REPO_DIR"
    return
  fi

  local current
  current="$(pwd)"

  if [[ -d "$current/backend/relay" ]]; then
    printf '%s\n' "$current"
    return
  fi

  if [[ "$(basename "$current")" == "relay" && -f "$current/package.json" ]]; then
    cd "$current/../.." >/dev/null
    pwd
    return
  fi

  if [[ -d /opt/SpiceSync/backend/relay ]]; then
    printf '%s\n' "/opt/SpiceSync"
    return
  fi

  fail "Could not find SpiceSync repo. Set REPO_DIR=/opt/SpiceSync and rerun."
}

detect_public_ip() {
  if [[ -n "${SERVER_IP:-}" ]]; then
    printf '%s\n' "$SERVER_IP"
    return
  fi

  local ip
  ip="$(curl -fsS4 https://api.ipify.org 2>/dev/null || true)"
  if [[ -z "$ip" ]]; then
    ip="$(hostname -I | awk '{print $1}')"
  fi

  [[ -n "$ip" ]] || fail "Could not detect public IP. Rerun with SERVER_IP=185.135.137.33."
  printf '%s\n' "$ip"
}

install_packages() {
  log "Installing system packages"
  apt-get update

  if ! apt-get install -y git curl ca-certificates ufw caddy docker.io docker-compose-plugin; then
    apt-get install -y git curl ca-certificates ufw caddy docker.io docker-compose
  fi

  systemctl enable --now docker
  systemctl enable --now caddy
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command_exists docker-compose; then
    docker-compose "$@"
  else
    fail "Docker Compose is not available after install."
  fi
}

write_relay_env() {
  local relay_dir="$1"
  local public_base_url="$2"

  log "Writing relay environment"
  cat > "$relay_dir/.env" <<EOF
RELAY_PORT=8787
RELAY_DATABASE_PATH=/data/relay.sqlite
RELAY_PUBLIC_BASE_URL=${public_base_url}
RELAY_INVITE_TTL_SECONDS=604800
RELAY_EVENT_RETENTION_DAYS=90
RELAY_MAX_PAYLOAD_BYTES=16384
RELAY_RATE_LIMIT_WINDOW_SECONDS=60
RELAY_RATE_LIMIT_MAX_REQUESTS=120
EOF
}

write_caddyfile() {
  local hostname="$1"

  log "Writing Caddy config for ${hostname}"
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.$(date +%Y%m%d%H%M%S).bak" 2>/dev/null || true

  cat > /etc/caddy/Caddyfile <<EOF
${hostname} {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8787

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "no-referrer"
  }
}
EOF

  caddy validate --config /etc/caddy/Caddyfile
  systemctl reload caddy
}

configure_firewall() {
  if [[ "${CONFIGURE_UFW:-1}" == "0" ]]; then
    log "Skipping UFW configuration"
    return
  fi

  log "Configuring firewall"
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

main() {
  local repo_dir relay_dir public_ip hostname public_base_url
  repo_dir="$(detect_repo_dir)"
  relay_dir="$repo_dir/backend/relay"

  [[ -f "$relay_dir/package.json" ]] || fail "Missing $relay_dir/package.json. Pull a version that includes backend/relay first."

  log "Using repo at ${repo_dir}"
  cd "$repo_dir"

  if [[ -d .git && "${SKIP_GIT_PULL:-0}" != "1" ]]; then
    log "Updating repo from origin/main"
    git checkout main
    git pull --ff-only origin main
  else
    log "Skipping git pull"
  fi

  public_ip="$(detect_public_ip)"
  hostname="${RELAY_HOSTNAME:-${public_ip//./-}.sslip.io}"
  public_base_url="https://${hostname}"

  install_packages
  write_relay_env "$relay_dir" "$public_base_url"

  log "Building and starting relay"
  cd "$relay_dir"
  compose_cmd up -d --build

  write_caddyfile "$hostname"
  configure_firewall

  log "Testing local relay"
  curl -fsS http://127.0.0.1:8787/healthz
  printf '\n'

  log "Testing public HTTPS relay"
  curl -fsS "${public_base_url}/healthz"
  printf '\n'

  log "Relay setup complete"
  printf 'Public base URL: %s\n' "$public_base_url"
  printf 'Use this in the mobile app relay config.\n'
}

main "$@"
