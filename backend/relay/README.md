# SpiceSync Relay

VPS-first encrypted sync relay for remote couple linking. The service stores invite metadata, anonymous couple membership, and encrypted sync events. It never receives plaintext votes or match results.

## Quick start (fresh VPS, one line)

```bash
curl -fsSL https://raw.githubusercontent.com/mikepitts25/SpiceSync/main/backend/relay/scripts/quick-start.sh | sudo bash
```

With a custom hostname (after pointing the A record at the server):

```bash
curl -fsSL https://raw.githubusercontent.com/mikepitts25/SpiceSync/main/backend/relay/scripts/quick-start.sh \
  | sudo RELAY_HOSTNAME=relay.spicesync.app bash
```

If DNS is not ready, leave `RELAY_HOSTNAME` unset — the script falls back to `<ip-with-dashes>.sslip.io` so Caddy can still obtain a Let's Encrypt cert automatically.

## Quick start (repo already on the VPS)

```bash
sudo RELAY_HOSTNAME=relay.spicesync.app bash backend/relay/scripts/setup-vps.sh
```

## What the setup script installs

- Docker + Docker Compose plugin
- Caddy (TLS + reverse proxy, auto-renewing certs)
- UFW firewall (SSH, 80, 443)
- fail2ban (SSH brute-force protection)
- `spicesync-relay.service` + `spicesync-relay-watchdog.timer` (2-minute health checks, auto-restart on failure)
- `spicesync-relay-backup.timer` (daily SQLite snapshot to `/var/backups/spicesync-relay/`, 7-day retention)

Disable any layer with `CONFIGURE_UFW=0`, `CONFIGURE_FAIL2BAN=0`, `CONFIGURE_WATCHDOG=0`, `CONFIGURE_BACKUPS=0`.

## Operational tools (post-install)

```bash
systemctl status spicesync-relay
systemctl list-timers --all | grep spicesync
journalctl -u spicesync-relay-watchdog --since "1 hour ago"
ls -lh /var/backups/spicesync-relay/
/usr/local/sbin/spicesync-relay-backup        # ad-hoc backup
```

## Local Development

```bash
npm install
npm test
npm run dev
```

The local API listens on `http://localhost:8787` by default and stores SQLite data in `./data/relay.sqlite`.

## API

```text
GET  /healthz
POST /invites
GET  /invites/:inviteId
POST /invites/:inviteId/accept
GET  /couples/:coupleId
POST /couples/:coupleId/events
GET  /couples/:coupleId/events?after=<serverSequence>
POST /couples/:coupleId/revoke
```

## Manual VPS deploy (no script)

1. Copy this directory to the VPS.
2. Set `RELAY_PUBLIC_BASE_URL` in `.env`.
3. Start the relay: `docker compose up -d --build`
4. Put Caddy in front of `127.0.0.1:8787` using `Caddyfile.example`.

The SQLite database is stored in the `relay-data` Docker volume. Back up that volume if you need disaster recovery, but keep event retention short because each client keeps its own local copy.

## Portability

HTTP routes depend on the `RelayStore` interface, not SQLite directly. To move off the VPS later, add a Postgres or serverless store implementation and keep the mobile-facing API unchanged.
