import { encodeBase64 } from '../lib/sync/base64';
import {
  refreshCoupleMetadata,
  useCoupleLinkStore,
} from '../lib/sync/coupleLink';
import {
  generateEncryptionKeypair,
  generateSigningKeypair,
} from '../lib/sync/crypto';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { RelayHttpError } from '../lib/sync/relayClient';
import { flushPending } from '../lib/sync/syncLoop';

jest.mock('../lib/sync/relayConfig', () => ({
  getRelayClient: () => mockRelay,
}));

const mockRelay = {
  appendEvent: jest.fn(),
  getCouple: jest.fn(),
};

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
      getItemAsync: async (key: string) => secure.get(key) ?? null,
      setItemAsync: async (key: string, value: string) => {
        secure.set(key, value);
      },
      deleteItemAsync: async (key: string) => {
        secure.delete(key);
      },
    },
    asyncStorage: {
      getItem: async (key: string) => async.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        async.set(key, value);
      },
      removeItem: async (key: string) => {
        async.delete(key);
      },
    },
  };
}

function couple(overrides: Record<string, unknown> = {}) {
  return {
    coupleId: 'couple-1',
    memberADeviceId: 'dev_me',
    memberBDeviceId: 'dev_partner_old',
    memberAPublicKey: 'my-encryption-key',
    memberBPublicKey: 'partner-encryption-key',
    memberASigningPublicKey: 'my-signing-key',
    memberBSigningPublicKey: 'partner-signing-key',
    memberAKeyVersion: 1,
    memberBKeyVersion: 1,
    memberAProfileName: 'Me',
    memberBProfileName: 'Sam',
    memberAProfileAvatar: null,
    memberBProfileAvatar: null,
    createdAt: 1700,
    revokedAt: null,
    ...overrides,
  };
}

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

describe('partner key refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
    useCoupleLinkStore.setState({ link: null, securityNotice: null });
    _resetCacheForTests();
  });

  it('re-encrypts queued plaintext after a recipient-key conflict', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerOldEncryption = generateEncryptionKeypair();
    const partnerNewEncryption = generateEncryptionKeypair();
    const partnerOldSigning = generateSigningKeypair();
    const partnerNewSigning = generateSigningKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      myDeviceId: 'dev_me',
      myKeyVersion: 1,
      partnerDeviceId: 'dev_partner_old',
      partnerKeyVersion: 1,
      partnerSigningPublicKey: encodeBase64(partnerOldSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerOldEncryption.publicKey),
      partnerProfileName: 'Sam',
      linkedAt: 1700,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });
    const pending = useEventQueueStore.getState().enqueue({
      eventId: 'evt_pending',
      schemaVersion: 1,
      eventType: 'vote.upsert',
      authorDeviceId: 'dev_me',
      cardId: 'card-1',
      vote: 'yes',
      updatedAt: 1700,
    });
    expect(pending).toMatchObject({ recipientDeviceId: 'dev_partner_old' });
    expect(pending).not.toHaveProperty('encryptedPayload');
    expect(pending).not.toHaveProperty('payloadHash');
    expect(pending).not.toHaveProperty('signature');

    mockRelay.getCouple
      .mockResolvedValueOnce(
        couple({
          memberBPublicKey: encodeBase64(partnerOldEncryption.publicKey),
          memberBSigningPublicKey: encodeBase64(partnerOldSigning.publicKey),
        })
      )
      .mockResolvedValueOnce(
        couple({
          memberBDeviceId: 'dev_partner_new',
          memberBPublicKey: encodeBase64(partnerNewEncryption.publicKey),
          memberBSigningPublicKey: encodeBase64(partnerNewSigning.publicKey),
          memberBKeyVersion: 2,
        })
      );
    mockRelay.appendEvent
      .mockRejectedValueOnce(
        new RelayHttpError(409, 'RECIPIENT_KEY_CHANGED', 'changed')
      )
      .mockResolvedValueOnce({
        eventId: 'evt_pending',
        recipientDeviceId: 'dev_partner_new',
      });

    await expect(flushPending()).resolves.toEqual({ uploaded: 1, failed: 0 });

    expect(mockRelay.getCouple).toHaveBeenCalledTimes(2);
    expect(mockRelay.appendEvent).toHaveBeenCalledTimes(2);
    const first = mockRelay.appendEvent.mock.calls[0][1];
    const second = mockRelay.appendEvent.mock.calls[1][1];
    expect(first.recipientDeviceId).toBe('dev_partner_old');
    expect(second.recipientDeviceId).toBe('dev_partner_new');
    expect(second.encryptedPayload).not.toBe(first.encryptedPayload);
    expect(second.signature).not.toBe(first.signature);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);
  });

  it('does not recursively retry another recipient-key conflict', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    setIdentityDeps(buildIdentityDeps(mySigning, myEncryption, 'dev_me'));

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      myDeviceId: 'dev_me',
      partnerDeviceId: 'dev_partner_old',
      partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
      linkedAt: 1700,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });
    const pending = useEventQueueStore.getState().enqueue({
      eventId: 'evt_retry_once',
      schemaVersion: 1,
      eventType: 'progress.snapshot',
      authorDeviceId: 'dev_me',
      answeredCount: 4,
      updatedAt: 1700,
    });
    mockRelay.getCouple.mockResolvedValue(
      couple({
        memberBPublicKey: encodeBase64(partnerEncryption.publicKey),
        memberBSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      })
    );
    mockRelay.appendEvent
      .mockRejectedValueOnce(
        new RelayHttpError(409, 'RECIPIENT_KEY_CHANGED', 'changed')
      )
      .mockRejectedValueOnce(
        new RelayHttpError(409, 'RECIPIENT_KEY_CHANGED', 'changed again')
      );

    await expect(flushPending()).resolves.toEqual({ uploaded: 0, failed: 1 });

    expect(mockRelay.appendEvent).toHaveBeenCalledTimes(2);
    expect(useEventQueueStore.getState().pending).toEqual([
      expect.objectContaining({
        eventId: pending.eventId,
        attempts: 1,
        lastError: 'changed again',
      }),
    ]);
  });

  it('records one persistent unacknowledged notice when the partner key version changes', async () => {
    const partnerEncryption = generateEncryptionKeypair();
    const partnerSigning = generateSigningKeypair();
    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      myDeviceId: 'dev_me',
      myKeyVersion: 1,
      partnerDeviceId: 'dev_partner_old',
      partnerKeyVersion: 1,
      partnerSigningPublicKey: 'old-signing-key',
      partnerEncryptionPublicKey: 'old-encryption-key',
      partnerProfileName: 'Sam',
      linkedAt: 1700,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });
    mockRelay.getCouple.mockResolvedValue(
      couple({
        memberBDeviceId: 'dev_partner_new',
        memberBPublicKey: encodeBase64(partnerEncryption.publicKey),
        memberBSigningPublicKey: encodeBase64(partnerSigning.publicKey),
        memberBKeyVersion: 2,
      })
    );

    await expect(refreshCoupleMetadata()).resolves.toBe('partner-key-changed');

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: {
        partnerDeviceId: 'dev_partner_new',
        partnerKeyVersion: 2,
        partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
        partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      },
      securityNotice: {
        kind: 'partner-device-restored',
        acknowledged: false,
        partnerName: 'Sam',
      },
    });
  });

  it('discards an older metadata response after a newer key rotation wins', async () => {
    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
      myDeviceId: 'dev_me',
      myKeyVersion: 1,
      partnerDeviceId: 'dev_partner_old',
      partnerKeyVersion: 1,
      partnerSigningPublicKey: 'old-signing-key',
      partnerEncryptionPublicKey: 'old-encryption-key',
      partnerProfileName: 'Sam',
      linkedAt: 1700,
      lastPulledServerSequence: 0,
      lastSyncedAt: null,
      status: 'active',
    });
    const older = deferred<ReturnType<typeof couple>>();
    const newer = deferred<ReturnType<typeof couple>>();
    mockRelay.getCouple
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);

    const olderRefresh = refreshCoupleMetadata();
    const newerRefresh = refreshCoupleMetadata();
    newer.resolve(
      couple({
        memberBDeviceId: 'dev_partner_new',
        memberBPublicKey: 'new-encryption-key',
        memberBSigningPublicKey: 'new-signing-key',
        memberBKeyVersion: 2,
      })
    );
    await expect(newerRefresh).resolves.toBe('partner-key-changed');

    older.resolve(
      couple({
        memberBDeviceId: 'dev_partner_old',
        memberBPublicKey: 'old-encryption-key',
        memberBSigningPublicKey: 'old-signing-key',
        memberBKeyVersion: 1,
      })
    );
    await expect(olderRefresh).resolves.toBe('unchanged');

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: {
        partnerDeviceId: 'dev_partner_new',
        partnerKeyVersion: 2,
        partnerEncryptionPublicKey: 'new-encryption-key',
        partnerSigningPublicKey: 'new-signing-key',
      },
      securityNotice: {
        kind: 'partner-device-restored',
        acknowledged: false,
      },
    });
  });
});
