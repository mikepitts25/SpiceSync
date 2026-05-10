# Couple Sync Relay Design

## Goal

Support couples who are not physically together while preserving SpiceSync's privacy-first model. A couple should be able to link remotely, answer cards independently, and see progress and matches as both partners vote.

The backend must not store plaintext votes, profile details, or match results. It only relays encrypted events between the two linked installs.

## Non-Goals

- No email/password accounts for MVP.
- No social login.
- No plaintext answer storage on the server.
- No realtime chat or socket presence for MVP.
- No multi-device account recovery for MVP.
- No server-side match computation.

## Recommended Approach

Build an anonymous end-to-end encrypted couple sync relay:

- The mobile app remains local-first.
- Each install creates a local sync identity and key pair.
- One partner creates an invite link.
- The second partner opens the link and accepts.
- Both devices store a shared `coupleId` locally.
- Each vote is saved locally first, then queued as an encrypted sync event.
- The relay stores only encrypted event payloads and minimal routing metadata.
- Each device pulls partner events on app open, after local voting, and periodically while active.
- Matches are computed locally only when both partners have answered the same card.

Deploy the MVP relay on the existing VPS as a small TypeScript service:

- Node.js runtime
- Hono HTTP API running on the Node adapter
- SQLite in WAL mode for invites, couples, and encrypted event logs
- Caddy as the public HTTPS reverse proxy
- Docker Compose for process management
- a cleanup timer for expired invites and old events

This should be built as a portable relay, not a VPS-only application. The mobile app talks only to the stable HTTP API. The backend keeps routing, domain rules, and storage behind clear module boundaries so the service can later move to a managed host, managed Postgres, or a serverless adapter without rewriting the sync protocol.

## Portability Strategy

Keep three boundaries explicit:

```text
HTTP transport
  -> relay service/domain logic
    -> RelayStore interface
      -> SQLite implementation for VPS MVP
```

The first implementation uses SQLite because it is simple, cheap, and reliable for a tiny encrypted relay. Future implementations can add a Postgres store or serverless store while keeping the same app-facing endpoints and payloads.

Recommended service layout:

```text
backend/relay/
  src/http/          # request parsing, response shaping, route registration
  src/domain/        # invite, couple, event, auth/signature rules
  src/store/         # RelayStore interface and concrete stores
  src/store/sqlite/  # SQLite migrations and repository implementation
  src/ops/           # cleanup jobs, health checks, maintenance scripts
```

`RelayStore` owns persistence operations such as creating invites, accepting invites, appending events, listing events after a cursor, and revoking couples. HTTP handlers should not contain SQL.

Migration path when the VPS is no longer enough:

1. Move the same Dockerized service to a managed app platform.
2. Add a Postgres `RelayStore` and run the same API against managed Postgres.
3. If serverless becomes attractive, add a Worker-compatible store adapter and keep the mobile API unchanged.
4. Only add account auth if product requirements expand into backup, multi-device identity, or paid account management.

## Data Model

### Local Device State

```ts
type SyncIdentity = {
  deviceId: string;
  signingPublicKey: string;
  signingPrivateKeyRef: string;
  encryptionPublicKey: string;
  encryptionPrivateKeyRef: string;
  createdAt: number;
};

type CoupleLink = {
  coupleId: string;
  myDeviceId: string;
  partnerDeviceId: string;
  partnerPublicKey: string;
  linkedAt: number;
  lastPulledServerSequence: number;
  lastSyncedAt: number | null;
  status: 'active' | 'unlinked';
};

type LocalVoteRecord = {
  cardId: string;
  vote: 'yes' | 'maybe' | 'no';
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'failed';
};

type PartnerVoteRecord = {
  cardId: string;
  vote: 'yes' | 'maybe' | 'no';
  updatedAt: number;
  receivedAt: number;
};
```

Private keys are stored in `expo-secure-store` where available. Non-secret sync metadata and votes continue to use the existing persisted Zustand/AsyncStorage pattern.

### Relay Tables

The table shape is intentionally plain SQL. SQLite is the MVP database. A future Postgres migration can keep the same logical schema, replacing `AUTOINCREMENT` with an identity column.

```sql
CREATE TABLE invites (
  invite_id TEXT PRIMARY KEY,
  inviter_device_id TEXT NOT NULL,
  inviter_public_key TEXT NOT NULL,
  invite_secret_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  couple_id TEXT
);

CREATE TABLE couples (
  couple_id TEXT PRIMARY KEY,
  member_a_device_id TEXT NOT NULL,
  member_b_device_id TEXT NOT NULL,
  member_a_public_key TEXT NOT NULL,
  member_b_public_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE sync_events (
  server_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  couple_id TEXT NOT NULL,
  author_device_id TEXT NOT NULL,
  client_sequence INTEGER NOT NULL,
  encrypted_payload TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  UNIQUE(couple_id, author_device_id, client_sequence)
);

CREATE INDEX sync_events_couple_sequence
  ON sync_events (couple_id, server_sequence);
```

The relay does not need a `users` table. Device IDs are anonymous random IDs generated by the app.

## VPS Deployment

### Runtime

Run the relay as a long-lived Node service on the VPS through Docker Compose. The container should run as a non-root user and expose the relay only to the local Docker network or localhost behind Caddy.

```text
public internet
  -> Caddy HTTPS
    -> relay service on localhost
      -> SQLite database file
```

### Configuration

Use environment variables for deploy-time settings:

```text
RELAY_PORT
RELAY_DATABASE_PATH
RELAY_PUBLIC_BASE_URL
RELAY_INVITE_TTL_SECONDS
RELAY_EVENT_RETENTION_DAYS
RELAY_MAX_PAYLOAD_BYTES
RELAY_RATE_LIMIT_WINDOW_SECONDS
RELAY_RATE_LIMIT_MAX_REQUESTS
```

No production secret should be required to decrypt user data, because the server never decrypts payloads. Server-side secrets are only for operational concerns such as admin cleanup endpoints if those are added later.

### Operations

- Enable SQLite WAL mode.
- Back up the SQLite file for disaster recovery, while keeping retention short.
- Avoid logging request bodies, invite secrets, encrypted payloads, or URL fragments.
- Log request IDs, route names, status codes, timings, and coarse error classes.
- Add `/healthz` for process checks.
- Add a cleanup job that deletes expired invites and events past the retention window.
- Put basic IP rate limiting at the relay or Caddy layer.
- Keep payload size limits low because vote events are small.
- Use Caddy for TLS renewal and HTTP-to-HTTPS redirects.

## Invite Flow

1. Partner A taps "Link remotely".
2. App ensures a local sync identity exists.
3. App generates a high-entropy `inviteSecret`.
4. App calls `POST /invites` with A's public key, anonymous device ID, and `hash(inviteSecret)`.
5. Relay returns an `inviteId`.
6. App creates a link:

```text
https://spicesync.app/link/<inviteId>#<inviteSecret>
```

7. Partner B opens the link.
8. B's app fetches public invite metadata with `GET /invites/:inviteId`.
9. B accepts and calls `POST /invites/:inviteId/accept` with B's public key, device ID, and a proof derived from `inviteSecret`.
10. Relay validates the invite proof, creates a `coupleId`, and marks the invite accepted.
11. B stores the `CoupleLink` locally.
12. A learns the invite was accepted by polling `GET /invites/:inviteId` on app open or from the link screen, then stores the same `CoupleLink` locally.

The fragment secret after `#` is never sent to the relay as plaintext. The relay stores only a hash/proof value for link possession checks. The clients can also use the secret during linking to confirm they are joining the same invite.

## Sync Event Format

Plaintext before encryption:

```ts
type VoteSyncEvent = {
  schemaVersion: 1;
  eventType: 'vote.upsert';
  eventId: string;
  authorDeviceId: string;
  cardId: string;
  vote: 'yes' | 'maybe' | 'no';
  updatedAt: number;
};

type ProgressSyncEvent = {
  schemaVersion: 1;
  eventType: 'progress.snapshot';
  eventId: string;
  authorDeviceId: string;
  answeredCount: number;
  updatedAt: number;
};

type UnlinkSyncEvent = {
  schemaVersion: 1;
  eventType: 'couple.unlink';
  eventId: string;
  authorDeviceId: string;
  updatedAt: number;
};
```

Only encrypted payloads are uploaded:

```ts
type RelaySyncEvent = {
  eventId: string;
  coupleId: string;
  authorDeviceId: string;
  clientSequence: number;
  serverSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  createdAt: number;
};
```

## Sync Behavior

### Local Vote

1. User votes on a card.
2. App writes the local vote immediately.
3. App enqueues a `vote.upsert` event.
4. If online, app encrypts and uploads the event.
5. If offline, app retries later.

### Pull Partner Updates

The app pulls:

- on app launch,
- when returning to foreground,
- after a successful local upload,
- every 30-60 seconds while the couple sync screen or deck is active.

The client asks for events after its last known cursor:

```text
GET /couples/:coupleId/events?after=<lastPulledSequence>
```

The `after` cursor is the relay-assigned `serverSequence`. The app ignores events authored by its own device, decrypts partner events, and applies last-write-wins per `cardId` using `updatedAt`.

### Neither Partner Has Answered

The couple link is active, but no vote events exist. UI should show connected state and a prompt to begin answering. No matches are shown.

### One Partner Has Answered

The app may show partner progress, but not partner answers directly:

```text
Partner has answered 28 cards.
You have answered 6.
Keep going to reveal more matches.
```

For each card, missing votes mean unknown. They are not treated as "no".

### Both Partners Have Answered

When both local and partner votes exist for the same `cardId`, the match engine can reveal the result:

- yes + yes: mutual yes
- yes + maybe: soft match
- maybe + maybe: mutual maybe
- any no: hidden or not matched, depending on existing product rules

The server never computes this.

## API Surface

```text
POST /invites
GET /invites/:inviteId
POST /invites/:inviteId/accept
GET /couples/:coupleId
POST /couples/:coupleId/events
GET /couples/:coupleId/events?after=<serverSequence>
POST /couples/:coupleId/revoke
```

All write requests should include a device signature. The MVP can start with signed requests using local device keys and server-side membership checks against `couples.member_*_device_id`.

## Security And Privacy

- Server stores no plaintext votes.
- Server stores no profile names, emails, or passwords.
- Invite IDs are high-entropy random values.
- Invite links expire, defaulting to 7 days.
- Sync events can expire after a retention window, such as 90 days, because each device keeps its local copy.
- The URL fragment secret is not sent to the relay.
- The server validates couple membership before accepting or returning events.
- Devices should sign write requests to prevent arbitrary event injection into a known `coupleId`.
- A partner can unlink locally and send a best-effort encrypted unlink event.

## Error Handling

- Expired invite: show "This link expired. Ask your partner for a new one."
- Already accepted invite: show "This link has already been used."
- Offline during voting: save locally and show sync pending state.
- Failed upload: retry with backoff and keep local source of truth.
- Failed decrypt: ignore event, log locally for diagnostics, and keep syncing later events.
- Clock skew: use server sequence for ordering, but event `updatedAt` for vote conflict resolution.

## Testing

### Unit Tests

- local vote creates pending sync event
- upload success marks event synced
- partner event applies to partner vote store
- duplicate event is ignored idempotently
- later `updatedAt` wins for same card
- missing partner vote remains unknown
- one-sided answers do not reveal answers

### Integration Tests

- create invite, accept invite, create couple
- upload encrypted event, pull from partner cursor
- reject writes from non-member device
- reject expired invite
- revoke couple prevents further sync
- SQLite store returns stable server cursors across process restarts
- HTTP handlers pass through the `RelayStore` interface without database-specific assumptions

### Manual QA

- link two local simulator installs remotely through a dev relay
- vote on A and confirm B sees progress but not the answer
- vote on B for the same card and confirm match appears
- go offline, vote several cards, reconnect, confirm queued events sync
- unlink and confirm further sync stops

## Crypto Implementation Decision

Use audited primitives through package APIs; do not implement cryptography manually. The implementation plan should choose the exact Expo-compatible packages after a quick compatibility check, but the protocol shape is fixed:

- per-install signing keys for relay request authorization,
- per-install encryption keys for partner-addressed payload encryption,
- authenticated encryption for every sync event payload,
- high-entropy random IDs and invite secrets,
- key material stored through SecureStore references, not AsyncStorage.

The existing `@noble/ed25519` dependency can cover signatures if it remains compatible with the runtime. Encryption/key agreement should use a similarly small audited package if the Expo runtime does not provide a suitable primitive.

## Rollout Plan

1. Implement `backend/relay` with portable service boundaries.
2. Add mobile sync identity and couple link store.
3. Add invite create/accept flow.
4. Add encrypted vote event queue.
5. Add pull/apply partner event sync.
6. Update match UI to distinguish unknown, one-sided, and mutual answers.
7. Add sync status UI and error states.
8. Deploy relay to the VPS behind Caddy.
9. Add cleanup jobs for expired invites and old events.
10. Document migration notes for moving from SQLite to managed Postgres.
