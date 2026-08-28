import AsyncStorage from '@react-native-async-storage/async-storage';

import { computeActionBuckets } from '../lib/match/actionBuckets';
import { decodeBase64, encodeBase64 } from '../lib/sync/base64';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import {
  encryptForPartner,
  generateEncryptionKeypair,
  generateSigningKeypair,
  sha256Base64,
  signEd25519,
  verifyEd25519,
} from '../lib/sync/crypto';
import {
  bindLegacyPendingToPersistedLink,
  useEventQueueStore,
} from '../lib/sync/eventQueue';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { RelayTestClient } from '../test-support/relayTestClient';
import { RelayHttpError, type RelayTransport } from '../lib/sync/relayClient';
import { _resetRelayClientForTests } from '../lib/sync/relayConfig';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import {
  flushPending,
  pullPartnerEvents,
  refreshCoupleMetadata,
  startSyncLoop,
  stopSyncLoop,
  syncNow,
  syncOnce,
} from '../lib/sync/syncLoop';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function settleAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function activeLink(partnerEncryptionPublicKey: string) {
  return {
    coupleId: 'couple-1',
    ownerUserId: 'user-me',
    myDeviceId: 'dev_me',
    partnerDeviceId: 'dev_partner',
    partnerSigningPublicKey: 'partner-signing-key',
    partnerEncryptionPublicKey,
    linkedAt: Date.now(),
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    status: 'active' as const,
  };
}

function refreshedCouple(partnerEncryptionPublicKey: string) {
  return {
    coupleId: 'couple-1',
    memberADeviceId: 'dev_me',
    memberBDeviceId: 'dev_partner',
    memberAPublicKey: 'my-encryption-key',
    memberBPublicKey: partnerEncryptionPublicKey,
    memberASigningPublicKey: 'my-signing-key',
    memberBSigningPublicKey: 'partner-signing-key',
    memberAKeyVersion: 1,
    memberBKeyVersion: 1,
    createdAt: 1700,
    revokedAt: null,
  };
}

function signEnvelope(
  signing: { privateKey: Uint8Array },
  eventId: string,
  clientSequence: number,
  payloadHash: string,
  recipientDeviceId?: string
): string {
  const payload = recipientDeviceId
    ? `${eventId}:${clientSequence}:${payloadHash}:${recipientDeviceId}`
    : `${eventId}:${clientSequence}:${payloadHash}`;
  return encodeBase64(
    signEd25519(signing.privateKey, new TextEncoder().encode(payload))
  );
}

function buildIdentityDeps(
  signing: { privateKey: Uint8Array; publicKey: Uint8Array },
  encryption: { privateKey: Uint8Array; publicKey: Uint8Array },
  deviceId: string
) {
  const secure = new Map<string, string>();
  secure.set(
    'spicesync.sync.signing.private',
    encodeBase64(signing.privateKey)
  );
  secure.set(
    'spicesync.sync.encryption.private',
    encodeBase64(encryption.privateKey)
  );
  const async = new Map<string, string>();
  async.set(
    'spicesync.sync.identity.public',
    JSON.stringify({
      deviceId,
      signingPublicKey: encodeBase64(signing.publicKey),
      encryptionPublicKey: encodeBase64(encryption.publicKey),
      createdAt: 1,
    })
  );
  return {
    secureStore: {
      getItemAsync: async (k: string) =>
        secure.has(k) ? secure.get(k)! : null,
      setItemAsync: async (k: string, v: string) => {
        secure.set(k, v);
      },
      deleteItemAsync: async (k: string) => {
        secure.delete(k);
      },
    },
    asyncStorage: {
      getItem: async (k: string) => (async.has(k) ? async.get(k)! : null),
      setItem: async (k: string, v: string) => {
        async.set(k, v);
      },
      removeItem: async (k: string) => {
        async.delete(k);
      },
    },
  };
}

describe('sync loop', () => {
  beforeEach(() => {
    useEventQueueStore.setState({
      pending: [],
      quarantined: [],
      nextClientSequence: 1,
    });
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
    });
    usePartnerVotesStore.setState({ byCardId: {}, answeredCount: 0 });
    useRevealConsentStore.setState({ local: {}, partner: {} });
    _resetCacheForTests();
    _resetRelayClientForTests();
  });

  afterEach(() => {
    stopSyncLoop();
    jest.useRealTimers();
  });

  it('does not call the relay or mutate sync state while profile confirmation is required', async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn();
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        fetchMock as unknown as (
          input: string,
          init?: RequestInit
        ) => Promise<Response>
      )
    );
    useCoupleLinkStore.getState().setLink({
      ...activeLink('partner-encryption-key'),
      requiresProfileConfirmation: true,
    });
    const queued = useEventQueueStore.getState().enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_me',
      cardId: 'card-paused',
      vote: 'yes',
      updatedAt: 1,
    });

    await expect(flushPending()).resolves.toEqual({ uploaded: 0, failed: 0 });
    await expect(pullPartnerEvents()).resolves.toEqual({ applied: 0 });
    await expect(syncOnce()).resolves.toEqual({
      uploaded: 0,
      failed: 0,
      applied: 0,
    });
    await expect(refreshCoupleMetadata()).resolves.toBe('unchanged');
    startSyncLoop(25);
    jest.advanceTimersByTime(50);
    await settleAsyncWork();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(queued).toBeNull();
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useCoupleLinkStore.getState().link).toMatchObject({
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      requiresProfileConfirmation: true,
    });
  });

  it('does not apply an in-flight metadata response after recovery pauses sync', async () => {
    const originalPartner = generateEncryptionKeypair();
    const replacementPartner = generateEncryptionKeypair();
    const response = deferred<{
      ok: boolean;
      json: () => Promise<Record<string, unknown>>;
    }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        fetchMock as unknown as (
          input: string,
          init?: RequestInit
        ) => Promise<Response>
      )
    );
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(originalPartner.publicKey)));

    const refresh = syncOnce();
    await settleAsyncWork();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });
    response.resolve({
      ok: true,
      json: async () =>
        refreshedCouple(encodeBase64(replacementPartner.publicKey)),
    });

    await expect(refresh).resolves.toEqual({
      uploaded: 0,
      failed: 0,
      applied: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useCoupleLinkStore.getState().link).toMatchObject({
      partnerEncryptionPublicKey: encodeBase64(originalPartner.publicKey),
      requiresProfileConfirmation: true,
    });
  });

  it('does not apply an in-flight partner pull after recovery pauses sync', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore.getState().setLink({
      ...activeLink(encodeBase64(partnerEncryption.publicKey)),
      myDeviceId: 'dev_me',
    });
    const response = deferred<{
      ok: boolean;
      json: () => Promise<Record<string, unknown>>;
    }>();
    const fetchMock = jest.fn().mockReturnValue(response.promise);
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        fetchMock as unknown as (
          input: string,
          init?: RequestInit
        ) => Promise<Response>
      )
    );

    const pulling = pullPartnerEvents();
    await settleAsyncWork();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });
    response.resolve({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 9,
            eventId: 'evt_late_partner',
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            clientSequence: 1,
            encryptedPayload: 'late-payload',
            payloadHash: 'late-hash',
            signature: '',
            createdAt: 1,
            expiresAt: null,
          },
        ],
        cursor: 9,
      }),
    });

    await expect(pulling).resolves.toEqual({ applied: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useCoupleLinkStore.getState().link).toMatchObject({
      requiresProfileConfirmation: true,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
    });
    expect(usePartnerVotesStore.getState().byCardId).toEqual({});
  });

  it('encrypts, signs, and uploads a recipient-bound pending event', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    const deps = buildIdentityDeps(mySigning, myEncryption, 'dev_me');
    setIdentityDeps(deps);

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: '',
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const queue = useEventQueueStore.getState();
    queue.enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_me',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1,
    });

    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/events') && url.includes('/couples/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ serverSequence: 1, eventId: 'evt_1' }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({}),
      });
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    const result = await flushPending();
    expect(result.uploaded).toBe(1);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalled();
    const eventCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'POST'
    );
    expect(eventCall).toBeDefined();
    const [, init] = eventCall!;
    const body = JSON.parse((init as any).body);
    expect(body.coupleId).toBeUndefined();
    expect(body.recipientDeviceId).toBe('dev_partner');
    expect(body.encryptedPayload.length).toBeGreaterThan(20);
    expect(body.payloadHash).toBe(sha256Base64(body.encryptedPayload));
    expect(
      verifyEd25519(
        mySigning.publicKey,
        decodeBase64(body.signature),
        new TextEncoder().encode(
          `${body.eventId}:${body.clientSequence}:${body.payloadHash}:dev_partner`
        )
      )
    ).toBe(true);
  });

  it('binds a persisted unbound v1 event to the same restarted link and retries CLIENT_UPGRADE_REQUIRED only once', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));
    await AsyncStorage.setItem(
      'spicesync-sync-queue',
      JSON.stringify({
        state: {
          pending: [
            {
              eventId: 'evt_legacy_restart',
              recipientDeviceId: null,
              clientSequence: 1,
              payload: {
                schemaVersion: 1,
                eventType: 'progress.snapshot',
                eventId: 'evt_legacy_restart',
                authorDeviceId: 'dev_me',
                answeredCount: 3,
                updatedAt: 1,
              },
              createdAt: 1,
              attempts: 0,
              nextAttemptAt: 1,
            },
          ],
          nextClientSequence: 2,
        },
        version: 0,
      })
    );
    await useEventQueueStore.persist.rehydrate();
    expect(bindLegacyPendingToPersistedLink()).toEqual({
      bound: 1,
      quarantined: 0,
    });

    const appendEvent = jest
      .fn()
      .mockRejectedValueOnce(
        new RelayHttpError(409, 'CLIENT_UPGRADE_REQUIRED', 'upgrade')
      )
      .mockResolvedValue({ serverSequence: 1 });
    _resetRelayClientForTests({
      appendEvent,
      getCouple: jest
        .fn()
        .mockResolvedValue(
          refreshedCouple(encodeBase64(partnerEncryption.publicKey))
        ),
    } as unknown as RelayTransport);

    await expect(flushPending()).resolves.toEqual({ uploaded: 1, failed: 0 });
    expect(appendEvent).toHaveBeenCalledTimes(2);
    expect(appendEvent.mock.calls[0][1]).toMatchObject({
      authorDeviceId: 'dev_me',
      recipientDeviceId: 'dev_partner',
    });
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('backs off after one safe CLIENT_UPGRADE_REQUIRED retry', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));
    const queued = useEventQueueStore.getState().enqueue({
      schemaVersion: 1,
      eventType: 'progress.snapshot',
      authorDeviceId: 'dev_me',
      answeredCount: 1,
      updatedAt: 1,
    })!;
    const appendEvent = jest
      .fn()
      .mockRejectedValue(
        new RelayHttpError(409, 'CLIENT_UPGRADE_REQUIRED', 'upgrade')
      );
    _resetRelayClientForTests({
      appendEvent,
      getCouple: jest
        .fn()
        .mockResolvedValue(
          refreshedCouple(encodeBase64(partnerEncryption.publicKey))
        ),
    } as unknown as RelayTransport);

    await expect(flushPending()).resolves.toEqual({ uploaded: 0, failed: 1 });
    expect(appendEvent).toHaveBeenCalledTimes(2);
    expect(useEventQueueStore.getState().pending).toEqual([
      expect.objectContaining({ eventId: queued.eventId, attempts: 1 }),
    ]);
  });

  it('quarantines cross-owner plaintext without uploading it', async () => {
    const partnerEncryption = generateEncryptionKeypair();
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'evt_other_owner',
          ownerUserId: 'other-user',
          coupleId: 'couple-1',
          authorDeviceId: 'dev_me',
          recipientDeviceId: 'dev_partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'evt_other_owner',
            authorDeviceId: 'dev_me',
            answeredCount: 7,
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      quarantined: [],
      nextClientSequence: 2,
    });
    const appendEvent = jest.fn();
    _resetRelayClientForTests({ appendEvent } as unknown as RelayTransport);

    await expect(flushPending()).resolves.toEqual({ uploaded: 0, failed: 0 });
    expect(appendEvent).not.toHaveBeenCalled();
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useEventQueueStore.getState().quarantined).toEqual([
      expect.objectContaining({
        eventId: 'evt_other_owner',
        reason: 'ownership-mismatch',
      }),
    ]);
  });

  it('accepts a v2 partner event addressed to this device with a v2 signature', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_v2_partner_1',
      authorDeviceId: 'dev_partner',
      cardId: 'pair:v2-event',
      vote: 'yes' as const,
      updatedAt: 1700,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 8,
            eventId: plainEvent.eventId,
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            recipientDeviceId: 'dev_me',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            signature: signEnvelope(
              partnerSigning,
              plainEvent.eventId,
              1,
              payloadHash,
              'dev_me'
            ),
            createdAt: 1700,
            expiresAt: null,
          },
        ],
        cursor: 8,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    await expect(pullPartnerEvents()).resolves.toEqual({ applied: 1 });
    expect(
      usePartnerVotesStore.getState().byCardId['pair:v2-event']
    ).toMatchObject({
      vote: 'yes',
      updatedAt: 1700,
    });
  });

  it('rejects a v2 event addressed to another device before applying it', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_wrong_recipient',
      authorDeviceId: 'dev_partner',
      cardId: 'pair:wrong-recipient',
      vote: 'yes' as const,
      updatedAt: 1700,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 9,
            eventId: plainEvent.eventId,
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            recipientDeviceId: 'dev_other',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            // This must be a valid v2 signature for dev_other: rejecting it
            // therefore proves the recipient gate, not signature failure.
            signature: signEnvelope(
              partnerSigning,
              plainEvent.eventId,
              1,
              payloadHash,
              'dev_other'
            ),
            createdAt: 1700,
            expiresAt: null,
          },
        ],
        cursor: 9,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    await expect(pullPartnerEvents()).resolves.toEqual({ applied: 0 });
    expect(
      usePartnerVotesStore.getState().byCardId['pair:wrong-recipient']
    ).toBeUndefined();
  });

  it('does not overlap scheduled sync ticks while a refresh is in flight', async () => {
    jest.useFakeTimers();
    const partnerEncryption = generateEncryptionKeypair();
    const refresh = deferred<{
      ok: boolean;
      json: () => Promise<Record<string, unknown>>;
    }>();
    const fetchMock = jest.fn().mockReturnValue(refresh.promise);
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        fetchMock as unknown as (
          input: string,
          init?: RequestInit
        ) => Promise<Response>
      )
    );
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));

    startSyncLoop(50);
    await settleAsyncWork();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(200);
    await settleAsyncWork();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    refresh.resolve({
      ok: true,
      json: async () =>
        refreshedCouple(encodeBase64(partnerEncryption.publicKey)),
    });
    await settleAsyncWork();
  });

  it('keeps a restarted loop in flight when the stopped loop completes late', async () => {
    jest.useFakeTimers();
    const partnerEncryption = generateEncryptionKeypair();
    const firstRefresh = deferred<{
      ok: boolean;
      json: () => Promise<Record<string, unknown>>;
    }>();
    const secondRefresh = deferred<{
      ok: boolean;
      json: () => Promise<Record<string, unknown>>;
    }>();
    const fetchMock = jest
      .fn()
      .mockReturnValueOnce(firstRefresh.promise)
      .mockReturnValueOnce(secondRefresh.promise);
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        fetchMock as unknown as (
          input: string,
          init?: RequestInit
        ) => Promise<Response>
      )
    );
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));

    startSyncLoop(50);
    await settleAsyncWork();
    stopSyncLoop();
    startSyncLoop(50);
    await settleAsyncWork();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    firstRefresh.resolve({
      ok: true,
      json: async () =>
        refreshedCouple(encodeBase64(partnerEncryption.publicKey)),
    });
    await settleAsyncWork();
    jest.advanceTimersByTime(50);
    await settleAsyncWork();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    secondRefresh.resolve({
      ok: true,
      json: async () =>
        refreshedCouple(encodeBase64(partnerEncryption.publicKey)),
    });
    await settleAsyncWork();
  });

  it('pulls partner events, decrypts them, and applies', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    const deps = buildIdentityDeps(mySigning, myEncryption, 'dev_me');
    setIdentityDeps(deps);

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_partner_1',
      authorDeviceId: 'dev_partner',
      cardId: 'pair:oral-pleasure',
      vote: 'no' as const,
      readiness: 'not_now' as const,
      pairPreference: 'give' as const,
      updatedAt: 1700,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );
    const signature = signEnvelope(
      partnerSigning,
      'evt_partner_1',
      1,
      payloadHash
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 4,
            eventId: 'evt_partner_1',
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            signature,
            createdAt: 1700,
            expiresAt: null,
          },
        ],
        cursor: 4,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();
    expect(result.applied).toBe(1);
    expect(
      usePartnerVotesStore.getState().byCardId['pair:oral-pleasure']
    ).toMatchObject({
      vote: 'no',
      readiness: 'not_now',
      pairPreference: 'give',
    });
    expect(useCoupleLinkStore.getState().link?.lastPulledServerSequence).toBe(
      4
    );
  });

  it('records a successful relay poll even when there are no new events', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));

    const beforePoll = Date.now();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], cursor: 0 }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    await expect(pullPartnerEvents()).resolves.toEqual({ applied: 0 });
    expect(
      useCoupleLinkStore.getState().link?.lastSyncedAt
    ).toBeGreaterThanOrEqual(beforePoll);
  });

  it('turns matching local and downloaded partner votes into a match', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore.getState().setLink({
      ...activeLink(encodeBase64(partnerEncryption.publicKey)),
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_shared_yes',
      authorDeviceId: 'dev_partner',
      cardId: 'shared-card',
      vote: 'yes' as const,
      updatedAt: 2_000,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );
    _resetRelayClientForTests(
      new RelayTestClient(
        'https://relay.test',
        jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            events: [
              {
                serverSequence: 8,
                eventId: plainEvent.eventId,
                coupleId: 'couple-1',
                authorDeviceId: 'dev_partner',
                clientSequence: 1,
                encryptedPayload,
                payloadHash,
                signature: signEnvelope(
                  partnerSigning,
                  plainEvent.eventId,
                  1,
                  payloadHash
                ),
                createdAt: 2_000,
                expiresAt: null,
              },
            ],
            cursor: 8,
          }),
        }) as any
      )
    );

    await expect(pullPartnerEvents()).resolves.toEqual({ applied: 1 });
    const downloaded = usePartnerVotesStore.getState().byCardId;
    const matches = computeActionBuckets({
      kinks: [
        {
          id: 'shared-card',
          title: 'Shared activity',
          category: 'Basics',
          intensityScale: 1,
          tier: 'soft',
          tags: [],
        },
      ],
      mine: { 'shared-card': 'yes' },
      theirs: Object.fromEntries(
        Object.entries(downloaded).map(([cardId, record]) => [
          cardId,
          record.vote,
        ])
      ),
    });

    expect(matches.readyNow.map((match) => match.id)).toEqual(['shared-card']);
  });

  it('manual sync retries pending votes immediately despite automatic backoff', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));
    useCoupleLinkStore
      .getState()
      .setLink(activeLink(encodeBase64(partnerEncryption.publicKey)));

    const queued = useEventQueueStore.getState().enqueue({
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_me',
      cardId: 'card-manual-retry',
      vote: 'yes',
      updatedAt: 1,
    });
    useEventQueueStore.setState({
      pending: [
        {
          ...queued!,
          attempts: 4,
          nextAttemptAt: Date.now() + 300_000,
          lastError: 'offline',
        },
      ],
    });

    const fetchMock = jest
      .fn()
      .mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/couples/couple-1')) {
          return {
            ok: true,
            json: async () =>
              refreshedCouple(encodeBase64(partnerEncryption.publicKey)),
          };
        }
        if (init?.method === 'POST' && url.endsWith('/events')) {
          return {
            ok: true,
            json: async () => ({ serverSequence: 1, eventId: queued!.eventId }),
          };
        }
        return {
          ok: true,
          json: async () => ({ events: [], cursor: 1 }),
        };
      });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    await expect(syncNow()).resolves.toMatchObject({ uploaded: 1, failed: 0 });
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('pulls partner reveal unlock consent and applies it', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    const deps = buildIdentityDeps(mySigning, myEncryption, 'dev_me');
    setIdentityDeps(deps);

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'reveal.unlock' as const,
      eventId: 'evt_partner_unlock_1',
      authorDeviceId: 'dev_partner',
      bucket: 'mutualMaybe' as const,
      updatedAt: 1800,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );
    const signature = signEnvelope(
      partnerSigning,
      'evt_partner_unlock_1',
      1,
      payloadHash
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 5,
            eventId: 'evt_partner_unlock_1',
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            signature,
            createdAt: 1800,
            expiresAt: null,
          },
        ],
        cursor: 5,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();
    expect(result.applied).toBe(1);
    expect(useRevealConsentStore.getState().partner.mutualMaybe).toBe(1800);
  });

  it('rejects partner events with invalid signatures', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const wrongSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_bad_signature',
      authorDeviceId: 'dev_partner',
      cardId: 'pair:bad-signature',
      vote: 'yes' as const,
      updatedAt: 1900,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 6,
            eventId: 'evt_bad_signature',
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            signature: signEnvelope(
              wrongSigning,
              'evt_bad_signature',
              1,
              payloadHash
            ),
            createdAt: 1900,
            expiresAt: null,
          },
        ],
        cursor: 6,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();

    expect(result.applied).toBe(0);
    expect(
      usePartnerVotesStore.getState().byCardId['pair:bad-signature']
    ).toBeUndefined();
    expect(useCoupleLinkStore.getState().link?.lastPulledServerSequence).toBe(
      6
    );
  });

  it('rejects decrypted partner events whose claims do not match the envelope', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      ownerUserId: 'user-me',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: Date.now(),
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });

    const plainEvent = {
      schemaVersion: 1 as const,
      eventType: 'vote.upsert' as const,
      eventId: 'evt_payload_claim',
      authorDeviceId: 'dev_other',
      cardId: 'pair:claim-mismatch',
      vote: 'yes' as const,
      updatedAt: 2000,
    };
    const { encryptedPayload, payloadHash } = encryptForPartner(
      partnerEncryption.privateKey,
      myEncryption.publicKey,
      JSON.stringify(plainEvent)
    );

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            serverSequence: 7,
            eventId: 'evt_payload_claim',
            coupleId: 'couple-1',
            authorDeviceId: 'dev_partner',
            clientSequence: 1,
            encryptedPayload,
            payloadHash,
            signature: signEnvelope(
              partnerSigning,
              'evt_payload_claim',
              1,
              payloadHash
            ),
            createdAt: 2000,
            expiresAt: null,
          },
        ],
        cursor: 7,
      }),
    });
    _resetRelayClientForTests(
      new RelayTestClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();

    expect(result.applied).toBe(0);
    expect(
      usePartnerVotesStore.getState().byCardId['pair:claim-mismatch']
    ).toBeUndefined();
  });
});
