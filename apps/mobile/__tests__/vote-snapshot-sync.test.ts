import { encodeBase64 } from '../lib/sync/base64';
import {
  decryptFromPartner,
  generateEncryptionKeypair,
  generateSigningKeypair,
} from '../lib/sync/crypto';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { RelayHttpError } from '../lib/sync/relayClient';
import type {
  GetVoteSnapshotResponse,
  PutVoteSnapshotRequest,
  VoteSnapshotResponse,
} from '../lib/sync/relayTypes';
import { syncVoteSnapshots } from '../lib/sync/syncLoop';
import { buildEncryptedVoteSnapshot } from '../lib/sync/voteSnapshot';
import { useVotesStore } from '../src/stores/votes';

const callOrder: string[] = [];
const mockRelay = {
  getVoteSnapshot: jest.fn<Promise<GetVoteSnapshotResponse>, [string]>(
    async () => {
      callOrder.push('get');
      return {
        snapshot: null,
        myRequestGeneration: 1,
        partnerRequestGeneration: 1,
      };
    }
  ),
  putVoteSnapshot: jest.fn<
    Promise<VoteSnapshotResponse>,
    [string, PutVoteSnapshotRequest]
  >(async (_coupleId, body) => {
    callOrder.push('put');
    return {
      coupleId: 'cpl_1',
      ...body,
      createdAt: 1,
      updatedAt: 1,
    };
  }),
  getCouple: jest.fn(),
};

jest.mock('../lib/sync/relayConfig', () => ({
  getRelayClient: () => mockRelay,
}));

function identityDeps(input: {
  deviceId: string;
  encryptionPrivateKey: Uint8Array;
  encryptionPublicKey: Uint8Array;
  signingPrivateKey: Uint8Array;
  signingPublicKey: Uint8Array;
}) {
  const secure = new Map<string, string>([
    [
      'spicesync.sync.encryption.private',
      encodeBase64(input.encryptionPrivateKey),
    ],
    ['spicesync.sync.signing.private', encodeBase64(input.signingPrivateKey)],
  ]);
  const async = new Map<string, string>([
    [
      'spicesync.sync.identity.public',
      JSON.stringify({
        deviceId: input.deviceId,
        encryptionPublicKey: encodeBase64(input.encryptionPublicKey),
        signingPublicKey: encodeBase64(input.signingPublicKey),
        createdAt: 1,
      }),
    ],
  ]);
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

describe('vote snapshot convergence', () => {
  const meEncryption = generateEncryptionKeypair();
  const meSigning = generateSigningKeypair();
  const partnerEncryption = generateEncryptionKeypair();
  const partnerSigning = generateSigningKeypair();

  beforeEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
    _resetCacheForTests();
    setIdentityDeps(
      identityDeps({
        deviceId: 'dev_me',
        encryptionPrivateKey: meEncryption.privateKey,
        encryptionPublicKey: meEncryption.publicKey,
        signingPrivateKey: meSigning.privateKey,
        signingPublicKey: meSigning.publicKey,
      })
    );
    useCoupleLinkStore.setState({
      authenticatedUserId: 'user-me',
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      link: {
        coupleId: 'cpl_1',
        ownerUserId: 'user-me',
        myDeviceId: 'dev_me',
        partnerDeviceId: 'dev_partner',
        partnerEncryptionPublicKey: encodeBase64(partnerEncryption.publicKey),
        partnerSigningPublicKey: encodeBase64(partnerSigning.publicKey),
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
    useVotesStore.setState({ votesByProfile: {} });
    usePartnerVotesStore.getState().reset();
    mockRelay.getVoteSnapshot.mockImplementation(async () => {
      callOrder.push('get');
      return {
        snapshot: null,
        myRequestGeneration: 2,
        partnerRequestGeneration: 3,
      };
    });
    mockRelay.putVoteSnapshot.mockImplementation(
      async (_coupleId: string, body: any) => {
        callOrder.push('put');
        return {
          coupleId: 'cpl_1',
          ...body,
          createdAt: 1,
          updatedAt: 1,
        };
      }
    );
  });

  it('publishes an empty complete snapshot before the authoritative fetch', async () => {
    await expect(syncVoteSnapshots('profile-me')).resolves.toMatchObject({
      published: true,
      received: false,
      status: 'waiting',
    });

    expect(callOrder).toEqual(['get', 'put', 'get']);
    const put = mockRelay.putVoteSnapshot.mock.calls[0][1];
    expect(put.requestGeneration).toBe(3);
    const plaintext = decryptFromPartner(
      partnerEncryption.privateKey,
      meEncryption.publicKey,
      put.encryptedPayload
    );
    expect(JSON.parse(plaintext)).toMatchObject({
      votes: [],
      answeredCount: 0,
      recipientDeviceId: 'dev_partner',
    });
  });

  it('atomically receives the partner snapshot after publishing mine', async () => {
    useVotesStore.setState({
      votesByProfile: { 'profile-me': { card_local: 'maybe' } },
    });
    const partnerEnvelope = buildEncryptedVoteSnapshot({
      coupleId: 'cpl_1',
      authorDeviceId: 'dev_partner',
      recipientDeviceId: 'dev_me',
      requestGeneration: 2,
      snapshotVersion: 11,
      updatedAt: 200,
      votes: { shared_card: 'yes' },
      authorEncryptionPrivateKey: partnerEncryption.privateKey,
      authorSigningPrivateKey: partnerSigning.privateKey,
      recipientEncryptionPublicKey: meEncryption.publicKey,
    });
    mockRelay.getVoteSnapshot
      .mockResolvedValueOnce({
        snapshot: null,
        myRequestGeneration: 2,
        partnerRequestGeneration: 3,
      })
      .mockResolvedValueOnce({
        snapshot: {
          coupleId: 'cpl_1',
          ...partnerEnvelope,
          createdAt: 200,
          updatedAt: 201,
        },
        myRequestGeneration: 2,
        partnerRequestGeneration: 3,
      });

    await expect(syncVoteSnapshots('profile-me')).resolves.toMatchObject({
      published: true,
      received: true,
      status: 'received',
    });
    expect(usePartnerVotesStore.getState()).toMatchObject({
      answeredCount: 1,
      lastSnapshotVersion: 11,
      byCardId: { shared_card: { vote: 'yes' } },
    });
  });

  it('reports rejected partner ciphertext without replacing prior state', async () => {
    usePartnerVotesStore.getState().applyVote({
      cardId: 'existing',
      vote: 'yes',
      updatedAt: 1,
      receivedAt: 1,
    });
    mockRelay.getVoteSnapshot
      .mockResolvedValueOnce({
        snapshot: null,
        myRequestGeneration: 2,
        partnerRequestGeneration: 3,
      })
      .mockResolvedValueOnce({
        snapshot: {
          coupleId: 'cpl_1',
          authorDeviceId: 'dev_partner',
          recipientDeviceId: 'dev_me',
          requestGeneration: 2,
          snapshotVersion: 1,
          encryptedPayload: 'invalid',
          payloadHash: 'invalid',
          signature: 'invalid',
          createdAt: 1,
          updatedAt: 1,
        },
        myRequestGeneration: 2,
        partnerRequestGeneration: 3,
      });

    await expect(syncVoteSnapshots('profile-me')).resolves.toMatchObject({
      published: true,
      received: false,
      status: 'rejected',
    });
    expect(usePartnerVotesStore.getState().byCardId).toHaveProperty('existing');
  });

  it('refreshes metadata and retries once when the recipient changes', async () => {
    mockRelay.putVoteSnapshot
      .mockRejectedValueOnce(
        new RelayHttpError(400, 'RECIPIENT_KEY_CHANGED', 'changed')
      )
      .mockImplementationOnce(async (_coupleId: string, body: any) => ({
        coupleId: 'cpl_1',
        ...body,
        createdAt: 1,
        updatedAt: 1,
      }));
    mockRelay.getCouple.mockResolvedValue({
      coupleId: 'cpl_1',
      memberADeviceId: 'dev_me',
      memberBDeviceId: 'dev_partner',
      memberAPublicKey: encodeBase64(meEncryption.publicKey),
      memberBPublicKey: encodeBase64(partnerEncryption.publicKey),
      memberASigningPublicKey: encodeBase64(meSigning.publicKey),
      memberBSigningPublicKey: encodeBase64(partnerSigning.publicKey),
      createdAt: 1,
      revokedAt: null,
    });

    await expect(syncVoteSnapshots('profile-me')).resolves.toMatchObject({
      published: true,
      status: 'waiting',
    });
    expect(mockRelay.putVoteSnapshot).toHaveBeenCalledTimes(2);
    expect(mockRelay.getCouple).toHaveBeenCalledTimes(1);
  });
});
