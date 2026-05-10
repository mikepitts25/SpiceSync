# SpiceSync Relay

VPS-first encrypted sync relay for remote couple linking. The service stores invite metadata, anonymous couple membership, and encrypted sync events. It never receives plaintext votes or match results.

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

## VPS Deploy

1. Copy this directory to the VPS.
2. Set `RELAY_PUBLIC_BASE_URL` in `docker-compose.yml`.
3. Start the relay:

```bash
docker compose up -d --build
```

4. Put Caddy in front of `127.0.0.1:8787` using `Caddyfile.example`.

The SQLite database is stored in the `relay-data` Docker volume. Back up that volume if you need disaster recovery, but keep event retention short because each client keeps its own local copy.

## Portability

HTTP routes depend on the `RelayStore` interface, not SQLite directly. To move off the VPS later, add a Postgres or serverless store implementation and keep the mobile-facing API unchanged.
