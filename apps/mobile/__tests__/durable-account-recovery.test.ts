import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { recoverPermanentAccount } from '../lib/sync/inviteFlow';

const COUPLE_LINK_STORAGE_KEY = 'spicesync-couple-link';

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => ({
    requirePermanentUser: mockRequirePermanentUser,
  }),
}));

jest.mock('../lib/sync/identity', () => ({
  getOrCreateIdentity: () => mockGetOrCreateIdentity(),
}));

jest.mock('../lib/sync/relayConfig', () => ({
  getRelayClient: () => mockRelay,
}));

const mockRequirePermanentUser = jest.fn();
const mockGetOrCreateIdentity = jest.fn();
const mockRelay = {
  recoverDevice: jest.fn(),
  findCoupleForDevice: jest.fn(),
};

function recoveryResponse(overrides: Record<string, unknown> = {}) {
  return {
    couple: {
      coupleId: 'cpl_1',
      memberADeviceId: 'dev_new',
      memberBDeviceId: 'dev_partner',
      memberAPublicKey: 'enc_new',
      memberBPublicKey: 'enc_partner',
      memberASigningPublicKey: 'sign_new',
      memberBSigningPublicKey: 'sign_partner',
      memberAKeyVersion: 2,
      memberBKeyVersion: 1,
      memberAProfileName: 'Alex',
      memberBProfileName: 'Sam',
      memberAProfileAvatar: 'fire',
      memberBProfileAvatar: 'cherries',
      createdAt: 1700,
      revokedAt: null,
    },
    recoveryCursor: 42,
    myDeviceId: 'dev_new',
    myKeyVersion: 2,
    partnerKeyVersion: 1,
    ...overrides,
  };
}

describe('durable account recovery', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.removeItem(COUPLE_LINK_STORAGE_KEY);
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      remoteStateNotice: null,
      securityNotice: null,
      pendingInviteId: null,
      pendingInviteExpiresAt: null,
      coupleRecoveryEnabled: true,
    } as never);
    useEventQueueStore.setState({
      pending: [],
      quarantined: [],
      nextClientSequence: 1,
    } as never);
    usePartnerVotesStore.setState({ byCardId: {}, answeredCount: 0 });
    useRevealConsentStore.setState({ local: {}, partner: {} });
    mockRequirePermanentUser.mockResolvedValue('user-a');
    mockGetOrCreateIdentity.mockResolvedValue({
      identity: {
        deviceId: 'dev_new',
        encryptionPublicKey: 'enc_new',
        signingPublicKey: 'sign_new',
        createdAt: 1700,
      },
    });
  });

  afterEach(async () => {
    await AsyncStorage.removeItem(COUPLE_LINK_STORAGE_KEY);
  });

  it('hydrates an unbound legacy link paused until current auth and device ownership are proven', async () => {
    await AsyncStorage.setItem(
      COUPLE_LINK_STORAGE_KEY,
      JSON.stringify({
        state: {
          link: {
            coupleId: 'cpl_legacy',
            myDeviceId: 'dev_me',
            partnerDeviceId: 'dev_partner',
            partnerSigningPublicKey: 'sign_partner',
            partnerEncryptionPublicKey: 'enc_partner',
            partnerProfileName: 'Sam',
            partnerProfileAvatar: 'cherries',
            linkedAt: 1700,
            lastPulledServerSequence: 24,
            lastSyncedAt: 1800,
            status: 'active',
          },
          securityNotice: {
            kind: 'partner-device-restored',
            occurredAt: 1900,
            acknowledged: false,
            partnerName: 'Sam',
          },
          pendingInviteId: 'inv_pending',
          pendingInviteExpiresAt: 2000,
          coupleRecoveryEnabled: true,
        },
        version: 0,
      })
    );

    await useCoupleLinkStore.persist.rehydrate();

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: {
        coupleId: 'cpl_legacy',
        myDeviceId: 'dev_me',
        partnerDeviceId: 'dev_partner',
        partnerSigningPublicKey: 'sign_partner',
        partnerEncryptionPublicKey: 'enc_partner',
        partnerProfileName: 'Sam',
        partnerProfileAvatar: 'cherries',
        linkedAt: 1700,
        lastPulledServerSequence: 24,
        lastSyncedAt: 1800,
        myKeyVersion: 1,
        partnerKeyVersion: 1,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: null,
      remoteSyncPauseReason: 'auth-required',
      securityNotice: {
        kind: 'partner-device-restored',
        occurredAt: 1900,
        acknowledged: false,
        partnerName: 'Sam',
      },
      pendingInviteId: 'inv_pending',
      pendingInviteExpiresAt: 2000,
      coupleRecoveryEnabled: true,
    });
  });

  it('keeps persisted null couple-link and security-notice state null during hydration', async () => {
    await AsyncStorage.setItem(
      COUPLE_LINK_STORAGE_KEY,
      JSON.stringify({
        state: {
          link: null,
          securityNotice: null,
          pendingInviteId: null,
          pendingInviteExpiresAt: null,
          coupleRecoveryEnabled: false,
        },
        version: 0,
      })
    );

    await useCoupleLinkStore.persist.rehydrate();

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: null,
      securityNotice: null,
      coupleRecoveryEnabled: false,
    });
  });

  it('rebuilds the couple link from the permanent account response and skips old-key events', async () => {
    mockRelay.recoverDevice.mockResolvedValue(recoveryResponse());

    await expect(
      recoverPermanentAccount({ requireProfileConfirmation: false })
    ).resolves.toEqual({ kind: 'recovered', coupleId: 'cpl_1' });

    expect(mockRequirePermanentUser).toHaveBeenCalledTimes(1);
    expect(mockRelay.recoverDevice).toHaveBeenCalledWith({
      deviceId: 'dev_new',
      encryptionPublicKey: 'enc_new',
      signingPublicKey: 'sign_new',
    });
    expect(mockRelay.findCoupleForDevice).not.toHaveBeenCalled();
    expect(useCoupleLinkStore.getState().link).toMatchObject({
      coupleId: 'cpl_1',
      ownerUserId: 'user-a',
      myDeviceId: 'dev_new',
      partnerDeviceId: 'dev_partner',
      myKeyVersion: 2,
      partnerKeyVersion: 1,
      lastPulledServerSequence: 42,
      requiresProfileConfirmation: false,
    });
  });

  it('does not manufacture a couple link when device registration has no couple', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'cpl_old',
        ownerUserId: 'user-a',
        myDeviceId: 'dev_new',
        partnerDeviceId: 'dev_old_partner',
        partnerSigningPublicKey: 'sign_old_partner',
        partnerEncryptionPublicKey: 'enc_old_partner',
        linkedAt: 1,
        lastPulledServerSequence: 9,
        lastSyncedAt: 10,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-a',
    } as never);
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'evt_old_plaintext',
          ownerUserId: 'user-a',
          coupleId: 'cpl_old',
          authorDeviceId: 'dev_new',
          recipientDeviceId: 'dev_old_partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'evt_old_plaintext',
            authorDeviceId: 'dev_new',
            answeredCount: 3,
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      quarantined: [],
      nextClientSequence: 2,
    } as never);
    mockRelay.recoverDevice.mockResolvedValue(
      recoveryResponse({
        couple: null,
        recoveryCursor: 0,
        partnerKeyVersion: null,
      })
    );

    await expect(recoverPermanentAccount()).resolves.toEqual({
      kind: 'no-couple',
    });

    expect(useCoupleLinkStore.getState().link).toBeNull();
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useEventQueueStore.getState().quarantined).toEqual([
      expect.objectContaining({
        eventId: 'evt_old_plaintext',
        reason: 'no-couple',
      }),
    ]);
    expect(useCoupleLinkStore.getState().remoteStateNotice).toMatchObject({
      kind: 'no-couple',
      discardedPendingCount: 1,
    });
  });

  it('preserves a same-owner same-device relationship and queue during explicit recovery', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'cpl_1',
        ownerUserId: 'user-a',
        myDeviceId: 'dev_new',
        partnerDeviceId: 'dev_partner',
        partnerSigningPublicKey: 'sign_partner',
        partnerEncryptionPublicKey: 'enc_partner',
        linkedAt: 1,
        lastPulledServerSequence: 11,
        lastSyncedAt: 12,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-a',
      remoteSyncPauseReason: 'signed-out',
    } as never);
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'evt_same_owner',
          ownerUserId: 'user-a',
          coupleId: 'cpl_1',
          authorDeviceId: 'dev_new',
          recipientDeviceId: 'dev_partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'evt_same_owner',
            authorDeviceId: 'dev_new',
            answeredCount: 1,
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      quarantined: [],
      nextClientSequence: 2,
    } as never);
    mockRelay.recoverDevice.mockResolvedValue(recoveryResponse());

    await recoverPermanentAccount({ requireProfileConfirmation: true });

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: {
        ownerUserId: 'user-a',
        coupleId: 'cpl_1',
        myDeviceId: 'dev_new',
        requiresProfileConfirmation: false,
      },
      authenticatedUserId: 'user-a',
      remoteSyncPauseReason: null,
    });
    expect(useEventQueueStore.getState().pending).toHaveLength(1);
    expect(useEventQueueStore.getState().quarantined).toEqual([]);
  });

  it('quarantines old plaintext before recovering the same account into a different couple', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'cpl_old',
        ownerUserId: 'user-a',
        myDeviceId: 'dev_new',
        partnerDeviceId: 'dev_old_partner',
        partnerSigningPublicKey: 'sign_old_partner',
        partnerEncryptionPublicKey: 'enc_old_partner',
        linkedAt: 1,
        lastPulledServerSequence: 2,
        lastSyncedAt: 3,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-a',
    } as never);
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'evt_old_couple',
          ownerUserId: 'user-a',
          coupleId: 'cpl_old',
          authorDeviceId: 'dev_new',
          recipientDeviceId: 'dev_old_partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'evt_old_couple',
            authorDeviceId: 'dev_new',
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
    } as never);
    mockRelay.recoverDevice.mockResolvedValue(recoveryResponse());

    await recoverPermanentAccount({ requireProfileConfirmation: false });

    expect(useCoupleLinkStore.getState().link).toMatchObject({
      ownerUserId: 'user-a',
      coupleId: 'cpl_1',
      requiresProfileConfirmation: true,
    });
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useEventQueueStore.getState().quarantined).toEqual([
      expect.objectContaining({
        eventId: 'evt_old_couple',
        reason: 'couple-changed',
      }),
    ]);
  });

  it('maps member B ownership and partner material during recovery', async () => {
    mockRelay.recoverDevice.mockResolvedValue(
      recoveryResponse({
        couple: {
          ...recoveryResponse().couple,
          memberADeviceId: 'dev_partner',
          memberBDeviceId: 'dev_new',
          memberAPublicKey: 'enc_partner',
          memberBPublicKey: 'enc_new',
          memberASigningPublicKey: 'sign_partner',
          memberBSigningPublicKey: 'sign_new',
          memberAKeyVersion: 3,
          memberBKeyVersion: 4,
        },
        myKeyVersion: 4,
        partnerKeyVersion: 3,
      })
    );

    await recoverPermanentAccount();

    expect(useCoupleLinkStore.getState().link).toMatchObject({
      ownerUserId: 'user-a',
      myDeviceId: 'dev_new',
      myKeyVersion: 4,
      partnerDeviceId: 'dev_partner',
      partnerKeyVersion: 3,
      partnerEncryptionPublicKey: 'enc_partner',
      partnerSigningPublicKey: 'sign_partner',
    });
  });
});
