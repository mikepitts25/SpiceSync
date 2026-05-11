#!/usr/bin/env bash
set -euo pipefail

# SpiceSync relay quick-start for a fresh Ubuntu/Debian VPS.
#
# One-liner:
#   curl -fsSL https://raw.githubusercontent.com/mikepitts25/SpiceSync/main/backend/relay/scripts/quick-start.sh | sudo bash
#
# Or with options:
#   curl -fsSL https://raw.githubusercontent.com/mikepitts25/SpiceSync/main/backend/relay/scripts/quick-start.sh \
#     | sudo RELAY_HOSTNAME=relay.spicesync.app bash

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage:
  sudo bash quick-start.sh                       # auto-detect public IP, use sslip.io hostname
  sudo RELAY_HOSTNAME=relay.example.com bash quick-start.sh
  sudo GIT_REPO=https://github.com/you/SpiceSync GIT_BRANCH=main bash quick-start.sh

Environment overrides (all optional):
  GIT_REPO       Default: https://github.com/mikepitts25/SpiceSync
  GIT_BRANCH     Default: main
  REPO_DIR       Default: /opt/SpiceSync
  RELAY_HOSTNAME Public hostname (FQDN or <ip-dashed>.sslip.io). Auto-detected if unset.
EOF
  exit 0
fi

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

GIT_REPO="${GIT_REPO:-https://github.com/mikepitts25/SpiceSync}"
GIT_BRANCH="${GIT_BRANCH:-main}"
REPO_DIR="${REPO_DIR:-/opt/SpiceSync}"

log() { printf '\n==> %s\n' "$*"; }

log "Installing git + curl"
apt-get update
apt-get install -y git curl ca-certificates

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Cloning $GIT_REPO into $REPO_DIR"
  git clone --branch "$GIT_BRANCH" "$GIT_REPO" "$REPO_DIR"
else
  log "Repo already present at $REPO_DIR, pulling latest"
  git -C "$REPO_DIR" fetch origin "$GIT_BRANCH"
  git -C "$REPO_DIR" checkout "$GIT_BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$GIT_BRANCH"
fi

[[ -x "$REPO_DIR/backend/relay/scripts/setup-vps.sh" ]] \
  || chmod +x "$REPO_DIR/backend/relay/scripts/setup-vps.sh"

log "Running setup-vps.sh"
cd "$REPO_DIR"
exec env REPO_DIR="$REPO_DIR" GIT_BRANCH="$GIT_BRANCH" bash "$REPO_DIR/backend/relay/scripts/setup-vps.sh"
