#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Set up the SpiceSync relay on an Ubuntu/Debian VPS.

Run from the repo root or backend/relay:

  sudo bash backend/relay/scripts/setup-vps.sh

Useful environment overrides:

  SERVER_IP=185.135.137.33
  RELAY_HOSTNAME=relay.spicesync.app          # FQDN or <ip-dashed>.sslip.io
  RELAY_PUBLIC_BASE_URL=https://relay.spicesync.app
  REPO_DIR=/opt/SpiceSync
  GIT_BRANCH=main
  SKIP_GIT_PULL=1
  CONFIGURE_UFW=0                              # default: enable UFW (SSH+80+443)
  CONFIGURE_FAIL2BAN=0                         # default: install + enable
  CONFIGURE_WATCHDOG=0                         # default: 2-minute health check + restart
  CONFIGURE_BACKUPS=0                          # default: daily SQLite snapshot
  SKIP_PUBLIC_HEALTH_CHECK=1                   # skip the https://hostname/healthz check
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
  command_exists apt-get || fail "This setup script expects an Ubuntu/Debian VPS with apt-get."

  apt-get update

  local base_packages="git curl ca-certificates jq ufw caddy docker.io openssl"
  if [[ "${CONFIGURE_FAIL2BAN:-1}" != "0" ]]; then
    base_packages="$base_packages fail2ban"
  fi

  # shellcheck disable=SC2086
  if ! apt-get install -y $base_packages docker-compose-plugin; then
    # shellcheck disable=SC2086
    apt-get install -y $base_packages docker-compose
  fi

  systemctl enable --now docker
  systemctl enable --now caddy
  if [[ "${CONFIGURE_FAIL2BAN:-1}" != "0" ]]; then
    systemctl enable --now fail2ban
  fi
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

update_repo() {
  if [[ ! -d .git ]]; then
    log "Skipping git pull because $(pwd) is not a git checkout"
    return
  fi

  if [[ "${SKIP_GIT_PULL:-0}" == "1" ]]; then
    log "Skipping git pull"
    return
  fi

  local branch="${GIT_BRANCH:-main}"
  log "Updating repo from origin/${branch}"
  git fetch origin "$branch"
  git checkout "$branch"
  git pull --ff-only origin "$branch"
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

configure_fail2ban() {
  if [[ "${CONFIGURE_FAIL2BAN:-1}" == "0" ]]; then
    log "Skipping fail2ban configuration"
    return
  fi

  log "Configuring fail2ban (SSH)"
  cat > /etc/fail2ban/jail.d/spicesync.conf <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
EOF
  systemctl reload fail2ban 2>/dev/null || systemctl restart fail2ban
}

configure_watchdog() {
  local relay_dir="$1"
  if [[ "${CONFIGURE_WATCHDOG:-1}" == "0" ]]; then
    log "Skipping watchdog timer"
    return
  fi

  log "Installing relay systemd unit + 2-minute watchdog timer"

  cat > /etc/systemd/system/spicesync-relay.service <<EOF
[Unit]
Description=SpiceSync relay (docker compose up)
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=${relay_dir}
ExecStart=/usr/bin/env bash -c 'docker compose up -d || docker-compose up -d'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

  cat > /etc/systemd/system/spicesync-relay-watchdog.service <<EOF
[Unit]
Description=Restart SpiceSync relay if /healthz fails
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=${relay_dir}
ExecStart=/usr/bin/env bash -c '\
  set -e; \
  if ! curl -fsS --max-time 5 http://127.0.0.1:8787/healthz >/dev/null; then \
    echo "relay unhealthy, restarting"; \
    (docker compose restart || docker-compose restart); \
  fi'
EOF

  cat > /etc/systemd/system/spicesync-relay-watchdog.timer <<'EOF'
[Unit]
Description=Periodic relay health check

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Unit=spicesync-relay-watchdog.service

[Install]
WantedBy=timers.target
EOF

  systemctl daemon-reload
  systemctl enable --now spicesync-relay.service
  systemctl enable --now spicesync-relay-watchdog.timer
}

configure_backups() {
  local relay_dir="$1"
  if [[ "${CONFIGURE_BACKUPS:-1}" == "0" ]]; then
    log "Skipping backup setup"
    return
  fi

  log "Installing daily SQLite backup (kept 7 days, /var/backups/spicesync-relay)"
  mkdir -p /var/backups/spicesync-relay

  cat > /usr/local/sbin/spicesync-relay-backup <<EOF
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/var/backups/spicesync-relay
TS=\$(date +%Y%m%d-%H%M%S)
OUT="\$BACKUP_DIR/relay-\$TS.sqlite"

cd "${relay_dir}"
CID=\$( (docker compose ps -q relay 2>/dev/null) || (docker-compose ps -q relay 2>/dev/null) )
if [[ -z "\$CID" ]]; then
  echo "relay container not running, skipping backup" >&2
  exit 0
fi

docker exec "\$CID" sh -c 'cp /data/relay.sqlite /tmp/relay.backup'
docker cp "\$CID:/tmp/relay.backup" "\$OUT"
docker exec "\$CID" rm -f /tmp/relay.backup
gzip -f "\$OUT"

find "\$BACKUP_DIR" -name 'relay-*.sqlite.gz' -mtime +7 -delete
EOF
  chmod +x /usr/local/sbin/spicesync-relay-backup

  cat > /etc/systemd/system/spicesync-relay-backup.service <<'EOF'
[Unit]
Description=SpiceSync relay SQLite backup

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/spicesync-relay-backup
EOF

  cat > /etc/systemd/system/spicesync-relay-backup.timer <<'EOF'
[Unit]
Description=Daily SpiceSync relay backup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=15m
Unit=spicesync-relay-backup.service

[Install]
WantedBy=timers.target
EOF

  systemctl daemon-reload
  systemctl enable --now spicesync-relay-backup.timer
}

verify_tls_renewal() {
  local hostname="$1"
  if ! command_exists openssl; then return; fi

  log "Reading TLS certificate for ${hostname}"
  local expiry
  expiry=$(echo | openssl s_client -servername "$hostname" -connect "${hostname}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | sed 's/notAfter=//') || true

  if [[ -n "$expiry" ]]; then
    printf 'TLS cert valid until: %s\n' "$expiry"
  else
    printf 'TLS cert not yet readable. Caddy may still be obtaining one — wait ~30s and re-run:\n'
    printf '  echo | openssl s_client -servername %s -connect %s:443 2>/dev/null | openssl x509 -noout -enddate\n' "$hostname" "$hostname"
  fi
}

test_public_relay() {
  local public_base_url="$1"

  if [[ "${SKIP_PUBLIC_HEALTH_CHECK:-0}" == "1" ]]; then
    log "Skipping public HTTPS health check"
    return
  fi

  log "Testing public HTTPS relay"
  curl -fsS "${public_base_url}/healthz" || log "Public health check failed — DNS may not have propagated yet."
  printf '\n'
}

main() {
  local repo_dir relay_dir public_ip hostname public_base_url
  repo_dir="$(detect_repo_dir)"
  relay_dir="$repo_dir/backend/relay"

  [[ -f "$relay_dir/package.json" ]] || fail "Missing $relay_dir/package.json. Pull a version that includes backend/relay first."

  log "Using repo at ${repo_dir}"
  cd "$repo_dir"

  install_packages
  update_repo

  public_ip="$(detect_public_ip)"
  hostname="${RELAY_HOSTNAME:-${public_ip//./-}.sslip.io}"
  public_base_url="${RELAY_PUBLIC_BASE_URL:-https://${hostname}}"

  write_relay_env "$relay_dir" "$public_base_url"

  log "Building and starting relay"
  cd "$relay_dir"
  compose_cmd up -d --build

  write_caddyfile "$hostname"
  configure_firewall
  configure_fail2ban
  configure_watchdog "$relay_dir"
  configure_backups "$relay_dir"

  log "Testing local relay"
  curl -fsS http://127.0.0.1:8787/healthz
  printf '\n'

  test_public_relay "$public_base_url"
  verify_tls_renewal "$hostname"

  log "Relay setup complete"
  printf '\nPublic base URL: %s\n' "$public_base_url"
  printf 'Set this in the mobile app: EXPO_PUBLIC_RELAY_BASE_URL or app.json extra.relayBaseUrl\n\n'
  printf 'Operational tools:\n'
  printf '  systemctl status spicesync-relay\n'
  printf '  systemctl list-timers --all | grep spicesync\n'
  printf '  journalctl -u spicesync-relay-watchdog --since "1 hour ago"\n'
  printf '  ls -lh /var/backups/spicesync-relay/\n'
  printf '  /usr/local/sbin/spicesync-relay-backup   # run a backup now\n'
}

main "$@"
