import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCoupleLinkStore } from '../lib/sync/coupleLink';
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
      securityNotice: null,
      pendingInviteId: null,
      pendingInviteExpiresAt: null,
      coupleRecoveryEnabled: true,
    });
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

  it('hydrates a legacy link with recovery defaults without losing its security notice', async () => {
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
      myDeviceId: 'dev_new',
      partnerDeviceId: 'dev_partner',
      myKeyVersion: 2,
      partnerKeyVersion: 1,
      lastPulledServerSequence: 42,
      requiresProfileConfirmation: false,
    });
  });

  it('does not manufacture a couple link when device registration has no couple', async () => {
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
  });
});
