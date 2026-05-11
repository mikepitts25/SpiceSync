# Couple Sync Relay — Integration Guide

End-to-end encrypted sync between two partners. The relay server stores only ciphertext — it never sees plaintext votes, match results, or profile data.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Security model](#security-model)
3. [Deploy the relay server](#deploy-the-relay-server)
4. [Relay API reference](#relay-api-reference)
5. [Mobile integration](#mobile-integration)
6. [Invite flow end-to-end](#invite-flow-end-to-end)
7. [Sync loop reference](#sync-loop-reference)
8. [Troubleshooting](#troubleshooting)

---

## Architecture overview

```
Partner A (mobile)                  Relay VPS                  Partner B (mobile)
──────────────────                  ─────────                  ─────────────────
  X25519 key pair                   SQLite DB                  X25519 key pair
  Ed25519 key pair                  (ciphertext only)          Ed25519 key pair
        │                                                             │
        │  POST /invites (secret hash)                                │
        │─────────────────────────────────────────────────►│          │
        │                                                   │ (polls) │
        │                                         POST /invites/:id/accept
        │                                                   │◄────────│
        │  GET  /invites/:id  →  coupleId                   │         │
        │─────────────────────────────────────────────────►│          │
        │                                                             │
        │  POST /couples/:id/events (encrypted payload)               │
        │─────────────────────────────────────────────────►│          │
        │                                                   │GET /couples/:id/events
        │                                                   │◄────────│
        │                                          (decrypt + apply)  │
```

Key facts:
- Each device generates an **X25519 encryption key pair** and an **Ed25519 signing key pair** on first launch.
- The public keys are exchanged through the invite handshake.
- After linking, events are encrypted with **ECDH-derived XChaCha20-Poly1305** before upload.
- The relay can't read any event payloads.

---

## Security model

| What the relay sees | What stays on device |
|---|---|
| Opaque device IDs (`dev_<uuid>`) | Ed25519 and X25519 private keys |
| X25519 public keys (in couple record) | Plaintext vote values |
| Invite secret hash (sha256, not the secret itself) | Profile names / emoji |
| Encrypted event blobs | Match results |
| Timestamps and sequence numbers | Love language responses |

**Encryption details:**

- Key agreement: X25519 (Diffie-Hellman over Curve25519)
- Key derivation: HKDF-SHA256 with context string `"spicesync-event-v1"`
- Cipher: XChaCha20-Poly1305 with a random 24-byte nonce prepended to ciphertext
- Integrity: payload hash (sha256 base64) checked before decrypt
- Signing: Ed25519 — each event is signed over `eventId:clientSequence:payloadHash`

Private key material is stored in `expo-secure-store` (Keychain on iOS, Android Keystore on Android). Non-secret identity state (device ID, public keys) uses AsyncStorage.

---

## Deploy the relay server

### Fresh VPS (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/mikepitts25/SpiceSync/main/backend/relay/scripts/quick-start.sh \
  | sudo RELAY_HOSTNAME=relay.spicesync.app bash
```

If DNS isn't ready yet, omit `RELAY_HOSTNAME` — the script falls back to `<ip-with-dashes>.sslip.io` so Caddy can get a Let's Encrypt cert immediately.

### Repo already on the VPS

```bash
sudo RELAY_HOSTNAME=relay.spicesync.app bash backend/relay/scripts/setup-vps.sh
```

### What gets installed

| Component | Purpose |
|---|---|
| Docker + Compose | Runs the relay as a container |
| Caddy | TLS termination + reverse proxy (auto-renews Let's Encrypt) |
| UFW | Firewall: allows SSH, 80, 443; blocks everything else |
| fail2ban | Blocks SSH brute-force and repeat 4xx hammering |
| `spicesync-relay.service` | Systemd unit that keeps Docker Compose up |
| `spicesync-relay-watchdog.timer` | Checks `/healthz` every 2 minutes; restarts if unhealthy |
| `spicesync-relay-backup.timer` | Daily SQLite snapshot to `/var/backups/spicesync-relay/`; 7-day retention |

### Environment variables

Set these before running the script or export them in the shell:

| Variable | Default | Description |
|---|---|---|
| `RELAY_HOSTNAME` | `<ip>.sslip.io` | FQDN for TLS cert and public URL |
| `SERVER_IP` | auto-detected | Public IPv4 (skip if auto-detect works) |
| `RELAY_PUBLIC_BASE_URL` | derived from hostname | Full `https://` URL sent back to clients in invite responses |
| `REPO_DIR` | `/opt/SpiceSync` | Where the repo is cloned / found |
| `GIT_BRANCH` | `main` | Branch to check out |
| `SKIP_GIT_PULL` | unset | Set to `1` to skip `git pull` |
| `CONFIGURE_UFW` | `1` | Set to `0` to skip firewall setup |
| `CONFIGURE_FAIL2BAN` | `1` | Set to `0` to skip fail2ban |
| `CONFIGURE_WATCHDOG` | `1` | Set to `0` to skip health-check watchdog |
| `CONFIGURE_BACKUPS` | `1` | Set to `0` to skip daily backup timer |
| `SKIP_PUBLIC_HEALTH_CHECK` | unset | Set to `1` to skip the final `https://hostname/healthz` check |

### Post-install operations

```bash
# Service status
systemctl status spicesync-relay

# View health-check logs (last hour)
journalctl -u spicesync-relay-watchdog --since "1 hour ago"

# List active timers
systemctl list-timers --all | grep spicesync

# Manual backup
/usr/local/sbin/spicesync-relay-backup

# List backups
ls -lh /var/backups/spicesync-relay/

# Pull latest code and redeploy
cd /opt/SpiceSync && git pull && \
  docker compose -f backend/relay/docker-compose.yml up -d --build

# Tail relay logs
docker compose -f backend/relay/docker-compose.yml logs -f relay

# TLS cert expiry
echo | openssl s_client -connect relay.spicesync.app:443 -servername relay.spicesync.app 2>/dev/null \
  | openssl x509 -noout -dates
```

### Local development

```bash
cd backend/relay
npm install
npm run dev        # http://localhost:8787
npm test           # Vitest unit tests
```

SQLite database is written to `./data/relay.sqlite` in dev mode.

---

## Relay API reference

All endpoints accept and return JSON. Errors follow `{ "error": { "code": "...", "message": "..." } }`.

### `GET /healthz`

Returns `{ "ok": true }`. Used by the watchdog timer and load balancers.

---

### `POST /invites`

Create an invite. The inviter sends their device ID, public key, and the **hash** of the invite secret (never the secret itself).

**Request body:**
```json
{
  "inviterDeviceId": "dev_<uuid>",
  "inviterPublicKey": "<base64-X25519-public-key>",
  "inviteSecretHash": "<sha256-base64-of-secret>"
}
```

**Response:**
```json
{
  "inviteId": "inv_<id>",
  "inviteUrl": "https://relay.spicesync.app/link/inv_<id>#<secret>",
  "expiresAt": 1234567890
}
```

Note: `inviteUrl` is provided for convenience but the secret is appended by the client, not stored by the server.

---

### `GET /invites/:inviteId`

Poll invite status. The inviter calls this to detect when the partner has accepted.

**Response:**
```json
{
  "inviteId": "inv_<id>",
  "inviterDeviceId": "dev_<uuid>",
  "inviterPublicKey": "<base64>",
  "expiresAt": 1234567890,
  "acceptedAt": null,
  "coupleId": null,
  "status": "pending"
}
```

`status` is one of `"pending"`, `"accepted"`, `"expired"`.

---

### `POST /invites/:inviteId/accept`

Accept an invite. The accepter proves knowledge of the secret by sending the same hash the inviter registered.

**Request body:**
```json
{
  "accepterDeviceId": "dev_<uuid>",
  "accepterPublicKey": "<base64-X25519-public-key>",
  "inviteProof": "<sha256-base64-of-secret>"
}
```

**Response:**
```json
{
  "coupleId": "cpl_<id>",
  "memberADeviceId": "dev_<inviter-uuid>",
  "memberBDeviceId": "dev_<accepter-uuid>",
  "memberAPublicKey": "<base64>",
  "memberBPublicKey": "<base64>",
  "createdAt": 1234567890
}
```

Returns `409 CONFLICT` if the invite was already accepted or the proof doesn't match.

---

### `GET /couples/:coupleId`

Fetch couple membership record. Used after `finalizePendingInvite` to discover the partner's public key.

**Response:**
```json
{
  "coupleId": "cpl_<id>",
  "memberADeviceId": "dev_<uuid>",
  "memberBDeviceId": "dev_<uuid>",
  "memberAPublicKey": "<base64>",
  "memberBPublicKey": "<base64>",
  "createdAt": 1234567890,
  "revokedAt": null
}
```

---

### `POST /couples/:coupleId/events`

Append an encrypted event. The relay validates the payload hash before writing.

**Request body:**
```json
{
  "eventId": "evt_<uuid>",
  "authorDeviceId": "dev_<uuid>",
  "clientSequence": 1,
  "encryptedPayload": "<base64-ciphertext>",
  "payloadHash": "<sha256-base64-of-encryptedPayload>",
  "signature": "<base64-Ed25519-sig>"
}
```

The signature covers the string `"<eventId>:<clientSequence>:<payloadHash>"`.

Returns `409 CONFLICT` if `eventId` is already recorded (idempotent retry safe).

---

### `GET /couples/:coupleId/events?after=<serverSequence>`

Pull events newer than a server-assigned sequence number. Pass `after=0` to get all events.

**Response:**
```json
{
  "events": [
    {
      "serverSequence": 42,
      "eventId": "evt_<uuid>",
      "authorDeviceId": "dev_<uuid>",
      "clientSequence": 1,
      "encryptedPayload": "<base64>",
      "payloadHash": "<sha256-base64>",
      "signature": "<base64>",
      "createdAt": 1234567890
    }
  ],
  "cursor": 42
}
```

The receiver skips events where `authorDeviceId === myDeviceId` (own events reflected back) and verifies `sha256(encryptedPayload) === payloadHash` before decrypting.

---

### `POST /couples/:coupleId/revoke`

Permanently revoke a couple link. Both members should call this when unlinking. Revoked couples can't append new events.

**Response:**
```json
{
  "coupleId": "cpl_<id>",
  "revokedAt": 1234567890
}
```

---

## Mobile integration

### Setup (app startup)

In `app/_layout.tsx`, before rendering screens:

```typescript
import 'react-native-get-random-values'; // crypto polyfill — must load first

// After confirming couple link exists:
import { startVoteSync, startSyncLoop } from '../lib/sync';

startVoteSync();           // watches votes store, enqueues changes
startSyncLoop(45_000);     // pulls + flushes every 45 seconds
```

Subscribe to `AppState` changes to pull immediately when the app returns to foreground:

```typescript
AppState.addEventListener('change', (state) => {
  if (state === 'active') void pullPartnerEvents().catch(() => undefined);
});
```

Stop sync on logout / unlink:

```typescript
import { stopVoteSync, stopSyncLoop } from '../lib/sync';
stopVoteSync();
stopSyncLoop();
```

### Configure the relay URL

**In `app.json`:**
```json
{
  "expo": {
    "extra": {
      "relayBaseUrl": "https://relay.spicesync.app"
    }
  }
}
```

**At runtime (e.g. for staging):**
```typescript
import { setRelayBaseUrl } from '../lib/sync';
setRelayBaseUrl('https://staging-relay.spicesync.app');
```

**Env variable (Expo public):**
```
EXPO_PUBLIC_RELAY_BASE_URL=https://relay.spicesync.app
```

Priority: runtime override > `app.json` extra > env var > hard-coded default.

### Reading partner votes

```typescript
import { usePartnerVotesStore } from '../lib/sync';

const partnerVotes = usePartnerVotesStore((s) => s.votes);
// { [cardId]: { vote: 'yes'|'no'|'maybe', updatedAt: number, receivedAt: number } }

const answeredCount = usePartnerVotesStore((s) => s.answeredCount);
```

### Checking sync status

```typescript
import { useCoupleLinkStore } from '../lib/sync';

const link = useCoupleLinkStore((s) => s.link);
// link.status: 'active' | 'pending' | null
// link.lastSyncedAt: number | null
// link.lastPulledServerSequence: number
```

### Triggering a manual sync

```typescript
import { syncOnce } from '../lib/sync';
const { uploaded, failed, applied } = await syncOnce();
```

### Unlinking

```typescript
import { useCoupleLinkStore } from '../lib/sync';
useCoupleLinkStore.getState().unlink();
stopVoteSync();
stopSyncLoop();
// optionally: getRelayClient().revokeCouple(coupleId)
```

---

## Invite flow end-to-end

### Partner A creates the invite

```
A calls createInvite()
  → generates 32 random bytes → encodes as base64url → inviteSecret
  → inviteSecretHash = sha256Base64(inviteSecret)
  → POST /invites { inviterDeviceId, inviterPublicKey, inviteSecretHash }
  ← { inviteId, inviteUrl, expiresAt }
  → returns InviteHandle { inviteId, inviteSecret, appUrl }

A displays a share sheet with:
  appUrl = "spicesync://link/<inviteId>#<inviteSecret>"
  (QR code or copy-paste)
```

The inviteSecret never touches the server. Only its hash is stored.

### Partner B receives and accepts

```
B receives the link (deep link, QR scan, or paste)
  → parseInviteUrl(url)
  ← { inviteId, inviteSecret }
  → B calls acceptInvite({ inviteId, inviteSecret })
      → inviteProof = sha256Base64(inviteSecret)
      → GET /invites/:inviteId           — fetch A's public key
      → POST /invites/:inviteId/accept   — send proof + B's public key
      ← { coupleId, memberADeviceId, memberBDeviceId, memberAPublicKey, memberBPublicKey }
      → store CoupleLink in Zustand + AsyncStorage
```

### Partner A finalizes

```
A polls finalizePendingInvite(inviteId) periodically
  → GET /invites/:inviteId   — check if status === 'accepted'
  → GET /couples/:coupleId   — fetch B's public key
  → store CoupleLink (partnerEncryptionPublicKey = B's X25519 public key)
```

Both devices now have each other's X25519 public key and can derive a shared encryption key for all future events.

### Link URL formats

Both URL formats are parsed by `parseInviteUrl()`:

| Format | Example |
|---|---|
| App scheme | `spicesync://link/inv_abc#secret123` |
| HTTPS (for web share/QR) | `https://relay.spicesync.app/link/inv_abc#secret123` |

The fragment (`#secret`) is never sent to the server in either case.

---

## Sync loop reference

### Event types

| `eventType` | Payload fields |
|---|---|
| `vote.upsert` | `cardId`, `vote` (`'yes'`\|`'no'`\|`'maybe'`), `updatedAt` |
| `progress.snapshot` | `answeredCount`, `updatedAt` |
| `couple.unlink` | _(none)_ |

All events also carry: `schemaVersion: 1`, `authorDeviceId`, `eventId`.

### Upload path

```
vote changes detected by voteSync subscriber
  → enqueue into event queue (Zustand + AsyncStorage)
  → flushPending() called by sync loop
      → for each due event:
          → ECDH derive shared key (X25519 + HKDF)
          → encrypt plaintext JSON (XChaCha20-Poly1305, random nonce)
          → sha256Base64(encryptedPayload) = payloadHash
          → Ed25519 sign(signingKey, "<eventId>:<seq>:<payloadHash>")
          → POST /couples/:id/events
      → on 409 CONFLICT: mark as uploaded (already received)
      → on network error: exponential backoff (2s → 5s → 15s → 60s → 300s)
```

### Pull path

```
pullPartnerEvents()
  → GET /couples/:id/events?after=<lastPulledServerSequence>
  → for each event:
      → skip if authorDeviceId === myDeviceId
      → verify sha256(encryptedPayload) === payloadHash
      → ECDH derive shared key
      → decrypt XChaCha20-Poly1305
      → JSON.parse plaintext → PlainSyncEvent
      → applyDecryptedEvent()
          vote.upsert       → partnerVotesStore.applyVote() (LWW on updatedAt)
          progress.snapshot → partnerVotesStore.setAnsweredCount()
          couple.unlink     → coupleLinkStore.unlink()
  → update server sequence cursor
  → update lastSyncedAt timestamp
```

### Event queue backoff schedule

| Attempt | Min delay before retry |
|---|---|
| 0 (first try) | immediately |
| 1 | 2 seconds |
| 2 | 5 seconds |
| 3 | 15 seconds |
| 4 | 60 seconds |
| 5+ | 300 seconds |

---

## Troubleshooting

**Invite link not working:**
- Verify the `#secret` fragment is preserved — some SMS clients strip URL fragments.
- Check that the relay URL is reachable from the device: `curl https://relay.spicesync.app/healthz`
- Invites expire after 24 hours by default.

**Events not syncing:**
- Confirm both devices show `link.status === 'active'` in `useCoupleLinkStore`.
- Check `useEventQueueStore.getState().pending` — events stuck with `failureCount > 4` have hit max backoff.
- Run `syncOnce()` manually from a dev menu or add a "Sync now" button.
- Check relay logs: `docker compose -f backend/relay/docker-compose.yml logs -f relay`

**Relay won't start:**
- `systemctl status spicesync-relay` — look for port conflicts or missing `.env`.
- `docker compose -f backend/relay/docker-compose.yml up` (foreground) to see startup errors.
- The relay requires port 8787 internally; Caddy handles 80/443 externally.

**TLS cert not obtained:**
- Verify DNS A record points to the VPS IP.
- Caddy needs ports 80 and 443 reachable from the internet for ACME challenges.
- Check Caddy logs: `journalctl -u caddy --since "10 minutes ago"`

**Backup failing:**
- Check: `journalctl -u spicesync-relay-backup --since "1 day ago"`
- Run manually: `sudo /usr/local/sbin/spicesync-relay-backup`
- Verify Docker container is named `spicesync-relay-relay-1` (or update the script's `CONTAINER_NAME`).
