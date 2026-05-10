# Couple Sync Relay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the VPS-first encrypted couple sync relay and mobile-facing client contract for remote couple linking.

**Architecture:** Add a standalone `backend/relay` TypeScript service with Hono HTTP routes, domain services, a `RelayStore` persistence interface, and a SQLite implementation. Keep the mobile API stable and add a small Expo-side client/types layer so app UI work can call the relay without knowing backend details.

**Tech Stack:** Node.js, TypeScript, Hono, SQLite via `better-sqlite3`, Vitest, Zod, Docker Compose, Caddy, Expo `fetch`.

---

### Task 1: Scaffold Relay Package

**Files:**
- Create: `backend/relay/package.json`
- Create: `backend/relay/tsconfig.json`
- Create: `backend/relay/vitest.config.ts`
- Create: `backend/relay/src/config.ts`
- Test: `backend/relay/src/config.test.ts`

- [ ] **Step 1: Write the failing config tests**

```ts
// backend/relay/src/config.test.ts
import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses safe defaults for local development', () => {
    const config = loadConfig({});

    expect(config.port).toBe(8787);
    expect(config.databasePath).toBe('./data/relay.sqlite');
    expect(config.publicBaseUrl).toBe('http://localhost:8787');
    expect(config.inviteTtlSeconds).toBe(7 * 24 * 60 * 60);
    expect(config.eventRetentionDays).toBe(90);
    expect(config.maxPayloadBytes).toBe(16 * 1024);
    expect(config.rateLimitWindowSeconds).toBe(60);
    expect(config.rateLimitMaxRequests).toBe(120);
  });

  it('parses environment overrides', () => {
    const config = loadConfig({
      RELAY_PORT: '9000',
      RELAY_DATABASE_PATH: '/var/lib/spicesync/relay.sqlite',
      RELAY_PUBLIC_BASE_URL: 'https://relay.spicesync.app',
      RELAY_INVITE_TTL_SECONDS: '3600',
      RELAY_EVENT_RETENTION_DAYS: '14',
      RELAY_MAX_PAYLOAD_BYTES: '2048',
      RELAY_RATE_LIMIT_WINDOW_SECONDS: '10',
      RELAY_RATE_LIMIT_MAX_REQUESTS: '20',
    });

    expect(config).toMatchObject({
      port: 9000,
      databasePath: '/var/lib/spicesync/relay.sqlite',
      publicBaseUrl: 'https://relay.spicesync.app',
      inviteTtlSeconds: 3600,
      eventRetentionDays: 14,
      maxPayloadBytes: 2048,
      rateLimitWindowSeconds: 10,
      rateLimitMaxRequests: 20,
    });
  });

  it('rejects invalid numeric settings', () => {
    expect(() => loadConfig({ RELAY_PORT: '0' })).toThrow('RELAY_PORT must be between 1 and 65535');
    expect(() => loadConfig({ RELAY_MAX_PAYLOAD_BYTES: '0' })).toThrow('RELAY_MAX_PAYLOAD_BYTES must be positive');
  });
});
```

- [ ] **Step 2: Run config test to verify RED**

Run: `cd backend/relay && npm test -- src/config.test.ts`

Expected: FAIL because `package.json` or `src/config.ts` does not exist.

- [ ] **Step 3: Add package and config implementation**

```json
// backend/relay/package.json
{
  "name": "@spicesync/relay",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=20 <25"
  },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.8",
    "better-sqlite3": "^11.7.0",
    "hono": "^4.6.16",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.10.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

```json
// backend/relay/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

```ts
// backend/relay/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

```ts
// backend/relay/src/config.ts
export type RelayConfig = {
  port: number;
  databasePath: string;
  publicBaseUrl: string;
  inviteTtlSeconds: number;
  eventRetentionDays: number;
  maxPayloadBytes: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
};

type Env = Record<string, string | undefined>;

function numberSetting(env: Env, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) throw new Error(`${key} must be an integer`);
  return parsed;
}

function positiveSetting(env: Env, key: string, fallback: number): number {
  const value = numberSetting(env, key, fallback);
  if (value <= 0) throw new Error(`${key} must be positive`);
  return value;
}

export function loadConfig(env: Env = process.env): RelayConfig {
  const port = numberSetting(env, 'RELAY_PORT', 8787);
  if (port < 1 || port > 65535) throw new Error('RELAY_PORT must be between 1 and 65535');

  return {
    port,
    databasePath: env.RELAY_DATABASE_PATH || './data/relay.sqlite',
    publicBaseUrl: env.RELAY_PUBLIC_BASE_URL || 'http://localhost:8787',
    inviteTtlSeconds: positiveSetting(env, 'RELAY_INVITE_TTL_SECONDS', 7 * 24 * 60 * 60),
    eventRetentionDays: positiveSetting(env, 'RELAY_EVENT_RETENTION_DAYS', 90),
    maxPayloadBytes: positiveSetting(env, 'RELAY_MAX_PAYLOAD_BYTES', 16 * 1024),
    rateLimitWindowSeconds: positiveSetting(env, 'RELAY_RATE_LIMIT_WINDOW_SECONDS', 60),
    rateLimitMaxRequests: positiveSetting(env, 'RELAY_RATE_LIMIT_MAX_REQUESTS', 120),
  };
}
```

- [ ] **Step 4: Run config tests to verify GREEN**

Run: `cd backend/relay && npm install && npm test -- src/config.test.ts`

Expected: PASS.

### Task 2: Add Relay Domain Types And Validation

**Files:**
- Create: `backend/relay/src/domain/types.ts`
- Create: `backend/relay/src/domain/validation.ts`
- Test: `backend/relay/src/domain/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
// backend/relay/src/domain/validation.test.ts
import { describe, expect, it } from 'vitest';
import { parseCreateInvite, parseAppendEvent } from './validation';

describe('relay request validation', () => {
  it('accepts valid create invite input', () => {
    expect(parseCreateInvite({
      inviterDeviceId: 'dev_123',
      inviterPublicKey: 'pub_abc',
      inviteSecretHash: 'hash_xyz',
    })).toEqual({
      inviterDeviceId: 'dev_123',
      inviterPublicKey: 'pub_abc',
      inviteSecretHash: 'hash_xyz',
    });
  });

  it('rejects empty create invite fields', () => {
    expect(() => parseCreateInvite({
      inviterDeviceId: '',
      inviterPublicKey: 'pub_abc',
      inviteSecretHash: 'hash_xyz',
    })).toThrow('Invalid request body');
  });

  it('rejects encrypted payloads over the configured byte limit', () => {
    expect(() => parseAppendEvent({
      eventId: 'evt_1',
      authorDeviceId: 'dev_1',
      clientSequence: 1,
      encryptedPayload: 'abcd',
      payloadHash: 'hash',
      signature: 'sig',
    }, 3)).toThrow('Encrypted payload exceeds maximum size');
  });
});
```

- [ ] **Step 2: Run validation tests to verify RED**

Run: `cd backend/relay && npm test -- src/domain/validation.test.ts`

Expected: FAIL because validation modules do not exist.

- [ ] **Step 3: Implement domain types and validation**

```ts
// backend/relay/src/domain/types.ts
export type InviteRecord = {
  inviteId: string;
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviteSecretHash: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt: number | null;
  coupleId: string | null;
};

export type CoupleRecord = {
  coupleId: string;
  memberADeviceId: string;
  memberBDeviceId: string;
  memberAPublicKey: string;
  memberBPublicKey: string;
  createdAt: number;
  revokedAt: number | null;
};

export type SyncEventRecord = {
  serverSequence: number;
  eventId: string;
  coupleId: string;
  authorDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  createdAt: number;
  expiresAt: number | null;
};

export type CreateInviteInput = {
  inviterDeviceId: string;
  inviterPublicKey: string;
  inviteSecretHash: string;
};

export type AcceptInviteInput = {
  accepterDeviceId: string;
  accepterPublicKey: string;
  inviteProof: string;
};

export type AppendEventInput = {
  eventId: string;
  authorDeviceId: string;
  clientSequence: number;
  encryptedPayload: string;
  payloadHash: string;
  signature: string;
};
```

```ts
// backend/relay/src/domain/validation.ts
import { z } from 'zod';
import type { AcceptInviteInput, AppendEventInput, CreateInviteInput } from './types';

const nonEmpty = z.string().trim().min(1);

const createInviteSchema = z.object({
  inviterDeviceId: nonEmpty,
  inviterPublicKey: nonEmpty,
  inviteSecretHash: nonEmpty,
});

const acceptInviteSchema = z.object({
  accepterDeviceId: nonEmpty,
  accepterPublicKey: nonEmpty,
  inviteProof: nonEmpty,
});

const appendEventSchema = z.object({
  eventId: nonEmpty,
  authorDeviceId: nonEmpty,
  clientSequence: z.number().int().positive(),
  encryptedPayload: nonEmpty,
  payloadHash: nonEmpty,
  signature: nonEmpty,
});

function parseWithMessage<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error('Invalid request body');
  return parsed.data;
}

export function parseCreateInvite(value: unknown): CreateInviteInput {
  return parseWithMessage(createInviteSchema, value);
}

export function parseAcceptInvite(value: unknown): AcceptInviteInput {
  return parseWithMessage(acceptInviteSchema, value);
}

export function parseAppendEvent(value: unknown, maxPayloadBytes: number): AppendEventInput {
  const parsed = parseWithMessage(appendEventSchema, value);
  if (Buffer.byteLength(parsed.encryptedPayload, 'utf8') > maxPayloadBytes) {
    throw new Error('Encrypted payload exceeds maximum size');
  }
  return parsed;
}
```

- [ ] **Step 4: Run validation tests to verify GREEN**

Run: `cd backend/relay && npm test -- src/domain/validation.test.ts`

Expected: PASS.

### Task 3: Implement SQLite RelayStore

**Files:**
- Create: `backend/relay/src/store/relay-store.ts`
- Create: `backend/relay/src/store/sqlite/sqlite-relay-store.ts`
- Test: `backend/relay/src/store/sqlite/sqlite-relay-store.test.ts`

- [ ] **Step 1: Write failing store tests**

```ts
// backend/relay/src/store/sqlite/sqlite-relay-store.test.ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SqliteRelayStore } from './sqlite-relay-store';

let dir: string;
let store: SqliteRelayStore;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'spicesync-relay-'));
  store = new SqliteRelayStore(join(dir, 'relay.sqlite'));
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('SqliteRelayStore', () => {
  it('creates and reads an invite', () => {
    const invite = store.createInvite({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviteSecretHash: 'hash',
      now: 1000,
      expiresAt: 2000,
    });

    expect(invite.inviteId).toMatch(/^inv_/);
    expect(store.getInvite(invite.inviteId)).toMatchObject({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviteSecretHash: 'hash',
      createdAt: 1000,
      expiresAt: 2000,
      acceptedAt: null,
      coupleId: null,
    });
  });

  it('accepts an invite and creates a couple', () => {
    const invite = store.createInvite({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviteSecretHash: 'hash',
      now: 1000,
      expiresAt: 2000,
    });

    const result = store.acceptInvite({
      inviteId: invite.inviteId,
      accepterDeviceId: 'dev_b',
      accepterPublicKey: 'pub_b',
      now: 1500,
    });

    expect(result.couple.memberADeviceId).toBe('dev_a');
    expect(result.couple.memberBDeviceId).toBe('dev_b');
    expect(store.getInvite(invite.inviteId)?.coupleId).toBe(result.couple.coupleId);
  });

  it('appends events with stable server sequence cursors', () => {
    const invite = store.createInvite({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviteSecretHash: 'hash',
      now: 1000,
      expiresAt: 2000,
    });
    const { couple } = store.acceptInvite({
      inviteId: invite.inviteId,
      accepterDeviceId: 'dev_b',
      accepterPublicKey: 'pub_b',
      now: 1500,
    });

    const event = store.appendEvent({
      coupleId: couple.coupleId,
      authorDeviceId: 'dev_a',
      eventId: 'evt_1',
      clientSequence: 1,
      encryptedPayload: 'ciphertext',
      payloadHash: 'hash_1',
      now: 1600,
      expiresAt: 2000,
    });

    expect(event.serverSequence).toBe(1);
    expect(store.listEventsAfter(couple.coupleId, 0, 100)).toHaveLength(1);
    expect(store.listEventsAfter(couple.coupleId, event.serverSequence, 100)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run store tests to verify RED**

Run: `cd backend/relay && npm test -- src/store/sqlite/sqlite-relay-store.test.ts`

Expected: FAIL because store modules do not exist.

- [ ] **Step 3: Implement `RelayStore` and SQLite store**

Create `RelayStore` with methods for invite creation, invite lookup, invite acceptance, couple lookup, event append/list, revoke, and cleanup. Implement SQLite migrations in the constructor, enable WAL mode, and map snake_case rows to camelCase records.

- [ ] **Step 4: Run store tests to verify GREEN**

Run: `cd backend/relay && npm test -- src/store/sqlite/sqlite-relay-store.test.ts`

Expected: PASS.

### Task 4: Implement Hono HTTP API

**Files:**
- Create: `backend/relay/src/http/app.ts`
- Create: `backend/relay/src/http/errors.ts`
- Create: `backend/relay/src/http/rate-limit.ts`
- Test: `backend/relay/src/http/app.test.ts`

- [ ] **Step 1: Write failing API tests**

```ts
// backend/relay/src/http/app.test.ts
import { describe, expect, it } from 'vitest';
import { createRelayApp } from './app';
import { SqliteRelayStore } from '../store/sqlite/sqlite-relay-store';

function testApp() {
  return createRelayApp({
    store: new SqliteRelayStore(':memory:'),
    config: {
      port: 8787,
      databasePath: ':memory:',
      publicBaseUrl: 'http://localhost:8787',
      inviteTtlSeconds: 60,
      eventRetentionDays: 90,
      maxPayloadBytes: 1024,
      rateLimitWindowSeconds: 60,
      rateLimitMaxRequests: 100,
    },
    now: () => 1000,
  });
}

describe('relay HTTP API', () => {
  it('creates and fetches an invite', async () => {
    const app = testApp();
    const create = await app.request('/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        inviteSecretHash: 'hash',
      }),
    });
    expect(create.status).toBe(201);
    const body = await create.json() as { inviteId: string; inviteUrl: string };
    expect(body.inviteUrl).toContain(body.inviteId);

    const fetched = await app.request(`/invites/${body.inviteId}`);
    expect(fetched.status).toBe(200);
    await expect(fetched.json()).resolves.toMatchObject({
      inviteId: body.inviteId,
      inviterPublicKey: 'pub_a',
      status: 'pending',
    });
  });

  it('accepts an invite and syncs encrypted events', async () => {
    const app = testApp();
    const create = await app.request('/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        inviteSecretHash: 'hash',
      }),
    });
    const invite = await create.json() as { inviteId: string };

    const accepted = await app.request(`/invites/${invite.inviteId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accepterDeviceId: 'dev_b',
        accepterPublicKey: 'pub_b',
        inviteProof: 'proof',
      }),
    });
    expect(accepted.status).toBe(201);
    const { coupleId } = await accepted.json() as { coupleId: string };

    const append = await app.request(`/couples/${coupleId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventId: 'evt_1',
        authorDeviceId: 'dev_a',
        clientSequence: 1,
        encryptedPayload: 'ciphertext',
        payloadHash: 'hash_1',
        signature: 'sig',
      }),
    });
    expect(append.status).toBe(201);

    const events = await app.request(`/couples/${coupleId}/events?after=0`);
    expect(events.status).toBe(200);
    await expect(events.json()).resolves.toMatchObject({
      events: [{ eventId: 'evt_1', encryptedPayload: 'ciphertext' }],
    });
  });
});
```

- [ ] **Step 2: Run API tests to verify RED**

Run: `cd backend/relay && npm test -- src/http/app.test.ts`

Expected: FAIL because HTTP modules do not exist.

- [ ] **Step 3: Implement API app**

Implement all spec routes, health check, JSON errors, payload validation, basic in-memory IP rate limiting, no request-body logging, and membership checks for event writes.

- [ ] **Step 4: Run API tests to verify GREEN**

Run: `cd backend/relay && npm test -- src/http/app.test.ts`

Expected: PASS.

### Task 5: Add Server Entry And Deployment Files

**Files:**
- Create: `backend/relay/src/server.ts`
- Create: `backend/relay/Dockerfile`
- Create: `backend/relay/docker-compose.yml`
- Create: `backend/relay/Caddyfile.example`
- Create: `backend/relay/.env.example`
- Create: `backend/relay/README.md`

- [ ] **Step 1: Add deploy files**

Create a Node server entry that loads config, opens the SQLite store, creates the Hono app, and serves it. Add Docker Compose and Caddy examples for a VPS deployment.

- [ ] **Step 2: Verify build**

Run: `cd backend/relay && npm run build`

Expected: PASS.

### Task 6: Add Mobile Relay Client Contract

**Files:**
- Create: `apps/mobile/lib/sync/relayTypes.ts`
- Create: `apps/mobile/lib/sync/relayClient.ts`
- Test: `apps/mobile/__tests__/relay-client.test.ts`

- [ ] **Step 1: Write failing mobile client tests**

```ts
// apps/mobile/__tests__/relay-client.test.ts
import { RelayClient, RelayHttpError } from '../lib/sync/relayClient';

describe('RelayClient', () => {
  it('creates an invite using fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ inviteId: 'inv_1', inviteUrl: 'https://example.com/link/inv_1' }),
    });
    const client = new RelayClient('https://relay.example.com', fetchMock);

    await expect(client.createInvite({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviteSecretHash: 'hash',
    })).resolves.toEqual({ inviteId: 'inv_1', inviteUrl: 'https://example.com/link/inv_1' });
  });

  it('throws structured errors for failed responses', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ error: { code: 'INVITE_EXPIRED', message: 'Invite expired' } }),
    });
    const client = new RelayClient('https://relay.example.com', fetchMock);

    await expect(client.getInvite('inv_1')).rejects.toMatchObject({
      name: 'RelayHttpError',
      status: 410,
      code: 'INVITE_EXPIRED',
    } satisfies Partial<RelayHttpError>);
  });
});
```

- [ ] **Step 2: Run mobile client tests to verify RED**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/relay-client.test.ts`

Expected: FAIL because relay client files do not exist.

- [ ] **Step 3: Implement relay types and fetch client**

Use standard `fetch`, structured errors, base URL normalization, and JSON request helpers. Do not add axios or a global data-fetching framework.

- [ ] **Step 4: Run mobile client tests to verify GREEN**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/relay-client.test.ts`

Expected: PASS.

### Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run relay verification**

Run: `cd backend/relay && npm test && npm run build`

Expected: PASS.

- [ ] **Step 2: Run mobile relay client verification**

Run: `cd apps/mobile && npm test -- --runInBand __tests__/relay-client.test.ts`

Expected: PASS.

- [ ] **Step 3: Review changed files**

Run: `git status --short`

Expected: only relay implementation, mobile relay client/tests, and plan files are changed.
