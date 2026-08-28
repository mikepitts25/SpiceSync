import { encodeBase64 } from '../lib/sync/base64';
import {
  generateEncryptionKeypair,
  generateSigningKeypair,
} from '../lib/sync/crypto';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import {
  buildEncryptedVoteSnapshot,
  validateAndDecryptVoteSnapshot,
} from '../lib/sync/voteSnapshot';

function keys() {
  return {
    encryption: generateEncryptionKeypair(),
    signing: generateSigningKeypair(),
  };
}

describe('encrypted vote snapshots', () => {
  beforeEach(() => {
    usePartnerVotesStore.getState().reset();
  });

  it('round-trips a complete normalized vote snapshot', () => {
    const author = keys();
    const recipient = keys();
    const envelope = buildEncryptedVoteSnapshot({
      coupleId: 'cpl_1',
      authorDeviceId: 'dev_a',
      recipientDeviceId: 'dev_b',
      requestGeneration: 3,
      snapshotVersion: 9,
      updatedAt: 1700,
      votes: {
        card_b: { value: 'maybe', readiness: 'curious' },
        card_a: 'yes',
      },
      authorEncryptionPrivateKey: author.encryption.privateKey,
      authorSigningPrivateKey: author.signing.privateKey,
      recipientEncryptionPublicKey: recipient.encryption.publicKey,
    });

    const decoded = validateAndDecryptVoteSnapshot({
      coupleId: 'cpl_1',
      myDeviceId: 'dev_b',
      partnerDeviceId: 'dev_a',
      snapshot: {
        coupleId: 'cpl_1',
        ...envelope,
        createdAt: 1700,
        updatedAt: 1701,
      },
      myEncryptionPrivateKey: recipient.encryption.privateKey,
      partnerEncryptionPublicKey: author.encryption.publicKey,
      partnerSigningPublicKey: author.signing.publicKey,
      receivedAt: 1800,
    });

    expect(decoded).toEqual({
      authorDeviceId: 'dev_a',
      requestGeneration: 3,
      snapshotVersion: 9,
      answeredCount: 2,
      votes: {
        card_a: {
          cardId: 'card_a',
          vote: 'yes',
          updatedAt: 1700,
          receivedAt: 1800,
        },
        card_b: {
          cardId: 'card_b',
          vote: 'maybe',
          readiness: 'curious',
          updatedAt: 1700,
          receivedAt: 1800,
        },
      },
    });
  });

  it('rejects wrong-recipient, hash, and signature claims', () => {
    const author = keys();
    const recipient = keys();
    const envelope = buildEncryptedVoteSnapshot({
      coupleId: 'cpl_1',
      authorDeviceId: 'dev_a',
      recipientDeviceId: 'dev_b',
      requestGeneration: 1,
      snapshotVersion: 1,
      updatedAt: 1700,
      votes: { card_a: 'yes' },
      authorEncryptionPrivateKey: author.encryption.privateKey,
      authorSigningPrivateKey: author.signing.privateKey,
      recipientEncryptionPublicKey: recipient.encryption.publicKey,
    });
    const snapshot = {
      coupleId: 'cpl_1',
      ...envelope,
      createdAt: 1700,
      updatedAt: 1701,
    };
    const input = {
      coupleId: 'cpl_1',
      myDeviceId: 'dev_b',
      partnerDeviceId: 'dev_a',
      snapshot,
      myEncryptionPrivateKey: recipient.encryption.privateKey,
      partnerEncryptionPublicKey: author.encryption.publicKey,
      partnerSigningPublicKey: author.signing.publicKey,
      receivedAt: 1800,
    };

    expect(() =>
      validateAndDecryptVoteSnapshot({ ...input, myDeviceId: 'dev_other' })
    ).toThrow('wrong recipient');
    expect(() =>
      validateAndDecryptVoteSnapshot({
        ...input,
        snapshot: { ...snapshot, payloadHash: 'wrong' },
      })
    ).toThrow('hash');
    expect(() =>
      validateAndDecryptVoteSnapshot({
        ...input,
        snapshot: { ...snapshot, signature: encodeBase64(new Uint8Array(64)) },
      })
    ).toThrow('signature');
  });

  it('atomically replaces stale partner votes with an empty snapshot', () => {
    usePartnerVotesStore.getState().applyVote({
      cardId: 'stale',
      vote: 'yes',
      updatedAt: 100,
      receivedAt: 100,
    });
    usePartnerVotesStore.getState().setAnsweredCount(1, 100);

    usePartnerVotesStore.getState().replaceSnapshot({
      authorDeviceId: 'dev_partner',
      requestGeneration: 2,
      snapshotVersion: 7,
      answeredCount: 0,
      votes: {},
      receivedAt: 200,
    });

    expect(usePartnerVotesStore.getState()).toMatchObject({
      byCardId: {},
      answeredCount: 0,
      lastSnapshotVersion: 7,
      lastSnapshotAuthorDeviceId: 'dev_partner',
      lastSnapshotRequestGeneration: 2,
      lastSnapshotReceivedAt: 200,
    });
  });

  it('does not let a delayed older snapshot overwrite newer partner votes', () => {
    const store = usePartnerVotesStore.getState();
    expect(
      store.replaceSnapshot({
        authorDeviceId: 'dev_partner',
        requestGeneration: 4,
        snapshotVersion: 12,
        answeredCount: 1,
        votes: {
          new_card: {
            cardId: 'new_card',
            vote: 'yes',
            updatedAt: 12,
            receivedAt: 12,
          },
        },
        receivedAt: 12,
      })
    ).toBe(true);
    expect(
      usePartnerVotesStore.getState().replaceSnapshot({
        authorDeviceId: 'dev_partner',
        requestGeneration: 4,
        snapshotVersion: 11,
        answeredCount: 1,
        votes: {
          stale_card: {
            cardId: 'stale_card',
            vote: 'yes',
            updatedAt: 11,
            receivedAt: 13,
          },
        },
        receivedAt: 13,
      })
    ).toBe(false);
    expect(usePartnerVotesStore.getState().byCardId).toHaveProperty('new_card');
    expect(usePartnerVotesStore.getState().byCardId).not.toHaveProperty(
      'stale_card'
    );
  });
});
