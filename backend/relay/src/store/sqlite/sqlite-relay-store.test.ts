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

  it('rejects duplicate client sequences for one author', () => {
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

    store.appendEvent({
      coupleId: couple.coupleId,
      authorDeviceId: 'dev_a',
      eventId: 'evt_1',
      clientSequence: 1,
      encryptedPayload: 'ciphertext',
      payloadHash: 'hash_1',
      now: 1600,
      expiresAt: 2000,
    });

    expect(() =>
      store.appendEvent({
        coupleId: couple.coupleId,
        authorDeviceId: 'dev_a',
        eventId: 'evt_2',
        clientSequence: 1,
        encryptedPayload: 'ciphertext-2',
        payloadHash: 'hash_2',
        now: 1700,
        expiresAt: 2000,
      }),
    ).toThrow('Duplicate sync event');
  });
});
