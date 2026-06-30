import { describe, expect, it } from 'vitest';
import { createRelayApp } from './app';
import type { RelayConfig } from '../config';
import { SqliteRelayStore } from '../store/sqlite/sqlite-relay-store';

const config: RelayConfig = {
  port: 8787,
  databasePath: ':memory:',
  publicBaseUrl: 'http://localhost:8787',
  inviteTtlSeconds: 60,
  eventRetentionDays: 90,
  maxPayloadBytes: 1024,
  rateLimitWindowSeconds: 60,
  rateLimitMaxRequests: 100,
};

function testApp(now = 1000) {
  return createRelayApp({
    store: new SqliteRelayStore(':memory:'),
    config,
    now: () => now,
  });
}

async function createInvite(app: ReturnType<typeof testApp>): Promise<{ inviteId: string }> {
  const create = await app.request('/invites', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      inviterDeviceId: 'dev_a',
      inviterPublicKey: 'pub_a',
      inviterSigningPublicKey: 'sign_pub_a',
      inviteSecretHash: 'hash',
    }),
  });
  expect(create.status).toBe(201);
  return create.json() as Promise<{ inviteId: string }>;
}

describe('relay HTTP API', () => {
  it('reports health', async () => {
    const app = testApp();

    const response = await app.request('/healthz');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('creates and fetches an invite', async () => {
    const app = testApp();
    const body = await createInvite(app);

    expect(body.inviteId).toMatch(/^inv_/);
    expect(body).toMatchObject({
      inviteUrl: `http://localhost:8787/link/${body.inviteId}`,
      expiresAt: 1060,
    });

    const fetched = await app.request(`/invites/${body.inviteId}`);
    expect(fetched.status).toBe(200);
    await expect(fetched.json()).resolves.toMatchObject({
      inviteId: body.inviteId,
      inviterPublicKey: 'pub_a',
      inviterSigningPublicKey: 'sign_pub_a',
      status: 'pending',
    });
  });

  it('accepts an invite and syncs encrypted events', async () => {
    const app = testApp();
    const invite = await createInvite(app);

    const accepted = await app.request(`/invites/${invite.inviteId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accepterDeviceId: 'dev_b',
        accepterPublicKey: 'pub_b',
        accepterSigningPublicKey: 'sign_pub_b',
        inviteProof: 'hash',
      }),
    });
    expect(accepted.status).toBe(201);
    const acceptedBody = (await accepted.json()) as {
      coupleId: string;
      memberASigningPublicKey: string;
      memberBSigningPublicKey: string;
    };
    expect(acceptedBody.memberASigningPublicKey).toBe('sign_pub_a');
    expect(acceptedBody.memberBSigningPublicKey).toBe('sign_pub_b');
    const { coupleId } = acceptedBody;

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
      events: [
        {
          eventId: 'evt_1',
          encryptedPayload: 'ciphertext',
          signature: 'sig',
        },
      ],
    });
  });

  it('rejects event writes from non-members', async () => {
    const app = testApp();
    const invite = await createInvite(app);
    const accepted = await app.request(`/invites/${invite.inviteId}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accepterDeviceId: 'dev_b',
        accepterPublicKey: 'pub_b',
        accepterSigningPublicKey: 'sign_pub_b',
        inviteProof: 'hash',
      }),
    });
    const { coupleId } = (await accepted.json()) as { coupleId: string };

    const append = await app.request(`/couples/${coupleId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventId: 'evt_1',
        authorDeviceId: 'dev_other',
        clientSequence: 1,
        encryptedPayload: 'ciphertext',
        payloadHash: 'hash_1',
        signature: 'sig',
      }),
    });

    expect(append.status).toBe(403);
    await expect(append.json()).resolves.toMatchObject({
      error: { code: 'FORBIDDEN' },
    });
  });
});
