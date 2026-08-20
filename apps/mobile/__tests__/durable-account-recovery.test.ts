import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { recoverPermanentAccount } from '../lib/sync/inviteFlow';

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
  beforeEach(() => {
    jest.clearAllMocks();
    useCoupleLinkStore.setState({
      link: null,
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
