import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockLocalSearchParams = jest.fn();
const mockRequirePermanentUser = jest.fn();
const mockLinkProvider = jest.fn();
const mockSignIn = jest.fn();
const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();
const mockIsAppleAvailable = jest.fn();
const mockCreateInvite = jest.fn();
const mockAcceptInvite = jest.fn();
const mockLookupInvite = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockLocalSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => ({
    requirePermanentUser: mockRequirePermanentUser,
    linkProvider: mockLinkProvider,
    signIn: mockSignIn,
  }),
}));

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: (...args: unknown[]) => mockIsAppleAvailable(...args),
}));

jest.mock('../lib/sync/inviteFlow', () => ({
  createInvite: (...args: unknown[]) => mockCreateInvite(...args),
  acceptInvite: (...args: unknown[]) => mockAcceptInvite(...args),
  lookupInvite: (...args: unknown[]) => mockLookupInvite(...args),
  finalizePendingInvite: jest.fn(),
  buildInviteShareContent: jest.fn(),
  buildInviteShareUrl: jest.fn(),
  parseInviteUrl: jest.fn(),
}));

jest.mock('../lib/sync/syncLoop', () => ({ startSyncLoop: jest.fn() }));
jest.mock('../lib/sync/voteSync', () => ({
  startVoteSync: jest.fn(),
  useVoteSyncStore: { getState: () => ({ setLocalProfileId: jest.fn() }) },
}));

const PartnerConnect = require('../app/(onboarding)/partner-connect')
  .default as typeof import('../app/(onboarding)/partner-connect').default;

const googleCredential = {
  provider: 'google' as const,
  token: 'google-token',
  accessToken: 'google-access-token',
};

function permanentAccount() {
  return {
    status: 'permanent' as const,
    userId: 'user-1',
    providers: ['google' as const],
    error: null,
  };
}

function pendingInvite() {
  return {
    kind: 'pending' as const,
    inviterProfileName: 'Sam',
    inviterProfileAvatar: 'flame',
  };
}

describe('PartnerConnect account gate controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams.mockReturnValue({});
    mockIsAppleAvailable.mockResolvedValue(false);
    mockGetGoogleCredential.mockResolvedValue(googleCredential);
    mockLinkProvider.mockResolvedValue(permanentAccount());
    mockRequirePermanentUser.mockResolvedValue('user-1');
    mockCreateInvite.mockResolvedValue({
      inviteId: 'invite-1',
      inviteSecret: 'secret',
      inviteUrl: 'https://example.test/invite-1',
      appUrl: 'spicesync://link/invite-1#secret',
    });
    mockAcceptInvite.mockResolvedValue({ coupleId: 'couple-1' });
  });

  it('defers invite creation until the account gate completes', async () => {
    mockRequirePermanentUser
      .mockRejectedValueOnce({ code: 'ACCOUNT_REQUIRED' })
      .mockResolvedValue('user-1');
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Create invite link'));

    await screen.findByText('Continue with Google');
    expect(mockCreateInvite).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockCreateInvite).toHaveBeenCalledTimes(1));
  });

  it('defers invite acceptance until the account gate completes', async () => {
    mockLocalSearchParams.mockReturnValue({
      remoteInviteId: 'invite-1',
      remoteInviteSecret: 'secret',
    });
    mockLookupInvite.mockResolvedValue(pendingInvite());
    mockRequirePermanentUser
      .mockRejectedValueOnce({ code: 'ACCOUNT_REQUIRED' })
      .mockResolvedValue('user-1');
    const screen = render(<PartnerConnect />);

    fireEvent.press(await screen.findByText('Accept invite'));

    await screen.findByText('Continue with Google');
    expect(mockAcceptInvite).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockAcceptInvite).toHaveBeenCalledTimes(1));
  });

  it('ignores duplicate create submissions during the permanent-account check', async () => {
    let resolveCheck: ((userId: string) => void) | undefined;
    mockRequirePermanentUser.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveCheck = resolve;
        })
    );
    const screen = render(<PartnerConnect />);
    const createButton = screen.getByText('Create invite link');

    fireEvent.press(createButton);
    fireEvent.press(createButton);

    expect(mockRequirePermanentUser).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCheck?.('user-1');
    });
    await waitFor(() => expect(mockCreateInvite).toHaveBeenCalledTimes(1));
  });

  it('ignores duplicate accept submissions during the permanent-account check', async () => {
    let resolveCheck: ((userId: string) => void) | undefined;
    mockLocalSearchParams.mockReturnValue({
      remoteInviteId: 'invite-1',
      remoteInviteSecret: 'secret',
    });
    mockLookupInvite.mockResolvedValue(pendingInvite());
    mockRequirePermanentUser.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveCheck = resolve;
        })
    );
    const screen = render(<PartnerConnect />);
    const acceptButton = await screen.findByText('Accept invite');

    fireEvent.press(acceptButton);
    fireEvent.press(acceptButton);

    expect(mockRequirePermanentUser).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCheck?.('user-1');
    });
    await waitFor(() => expect(mockAcceptInvite).toHaveBeenCalledTimes(1));
  });
});
