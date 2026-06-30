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
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { RelayClient } from '../lib/sync/relayClient';
import { _resetRelayClientForTests } from '../lib/sync/relayConfig';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { flushPending, pullPartnerEvents } from '../lib/sync/syncLoop';

function signEnvelope(
  signing: { privateKey: Uint8Array },
  eventId: string,
  clientSequence: number,
  payloadHash: string
): string {
  return encodeBase64(
    signEd25519(
      signing.privateKey,
      new TextEncoder().encode(`${eventId}:${clientSequence}:${payloadHash}`)
    )
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
    useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
    useCoupleLinkStore.setState({ link: null });
    usePartnerVotesStore.setState({ byCardId: {}, answeredCount: 0 });
    useRevealConsentStore.setState({ local: {}, partner: {} });
    _resetCacheForTests();
    _resetRelayClientForTests();
  });

  it('encrypts and uploads a pending event', async () => {
    const mySigning = generateSigningKeypair();
    const myEncryption = generateEncryptionKeypair();
    const partnerEncryption = generateEncryptionKeypair();
    const deps = buildIdentityDeps(mySigning, myEncryption, 'dev_me');
    setIdentityDeps(deps);

    useCoupleLinkStore.getState().setLink({
      coupleId: 'couple-1',
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
      new RelayClient('https://relay.test', fetchMock as any)
    );

    const result = await flushPending();
    expect(result.uploaded).toBe(1);
    expect(useEventQueueStore.getState().pending).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as any).body);
    expect(body.coupleId).toBeUndefined();
    expect(body.encryptedPayload.length).toBeGreaterThan(20);
    expect(body.payloadHash).toBe(sha256Base64(body.encryptedPayload));
    expect(
      verifyEd25519(
        mySigning.publicKey,
        decodeBase64(body.signature),
        new TextEncoder().encode(
          `${body.eventId}:${body.clientSequence}:${body.payloadHash}`
        )
      )
    ).toBe(true);
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
      vote: 'yes' as const,
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
      new RelayClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();
    expect(result.applied).toBe(1);
    expect(
      usePartnerVotesStore.getState().byCardId['pair:oral-pleasure']
    ).toMatchObject({
      vote: 'yes',
      pairPreference: 'give',
    });
    expect(useCoupleLinkStore.getState().link?.lastPulledServerSequence).toBe(
      4
    );
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
      new RelayClient('https://relay.test', fetchMock as any)
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
      new RelayClient('https://relay.test', fetchMock as any)
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
      new RelayClient('https://relay.test', fetchMock as any)
    );

    const result = await pullPartnerEvents();

    expect(result.applied).toBe(0);
    expect(
      usePartnerVotesStore.getState().byCardId['pair:claim-mismatch']
    ).toBeUndefined();
  });
});
