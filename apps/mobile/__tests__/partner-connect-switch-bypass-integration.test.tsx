import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreateInvite = jest.fn();
const mockSignIn = jest.fn();
const mockLinkProvider = jest.fn();
const mockRequirePermanentUser = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
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
    signIn: mockSignIn,
    linkProvider: mockLinkProvider,
  }),
}));

jest.mock('../lib/sync/inviteFlow', () => ({
  createInvite: (...args: unknown[]) => mockCreateInvite(...args),
  acceptInvite: jest.fn(),
  lookupInvite: jest.fn(),
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

// The real PartnerAccountGate is used. Only the native provider buttons are
// replaced, so the gate's own sign-in/account-switch handling runs for real.
jest.mock('../components/auth/AccountProviderButtons', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AccountProviderButtons: ({
      onCredential,
    }: {
      onCredential: (credential: unknown) => void | Promise<void>;
    }) => (
      <Pressable
        onPress={() => onCredential({ provider: 'apple', token: 'tok' })}
      >
        <Text>Provider sign-in</Text>
      </Pressable>
    ),
  };
});

const { useCoupleLinkStore } = require('../lib/sync/coupleLink');

const PartnerConnect = require('../app/(onboarding)/partner-connect')
  .default as typeof import('../app/(onboarding)/partner-connect').default;

/**
 * End-to-end form of the account-switch bypass, driving the real account gate:
 * the gate reports the switch, the user cancels, and retrying create must still
 * be blocked because recovery has not run.
 */
describe('PartnerConnect account-switch bypass (real gate)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateInvite.mockResolvedValue({
      inviteId: 'invite-1',
      inviteSecret: 'secret',
      inviteUrl: 'https://example.test/invite-1',
      appUrl: 'spicesync://link/invite-1#secret',
    });
    // First press: no permanent account yet, so the gate opens.
    mockRequirePermanentUser
      .mockRejectedValueOnce({ code: 'ACCOUNT_REQUIRED' })
      .mockResolvedValue('user-b');
    // The provider identity already belongs to another account.
    mockLinkProvider.mockRejectedValue({ code: 'ACCOUNT_EXISTS' });
    // Signing into it switches accounts, which is what records pending
    // recovery state via clearRemoteOwnedState('account-switched', ...).
    mockSignIn.mockImplementation(async () => {
      useCoupleLinkStore.setState({
        link: null,
        authenticatedUserId: 'user-b',
        remoteSyncPauseReason: 'auth-required',
        pendingProfileConfirmationOwnerUserId: 'user-b',
        remoteStateNotice: {
          kind: 'account-switched',
          discardedPendingCount: 0,
          occurredAt: 1,
        },
      });
      return {
        status: 'permanent',
        userId: 'user-b',
        providers: ['apple'],
        error: null,
        accountChanged: true,
      };
    });
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      remoteStateNotice: null,
    });
  });

  afterEach(() => {
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      remoteStateNotice: null,
    });
  });

  it('blocks a retried create after cancelling a switched-account gate', async () => {
    const screen = render(<PartnerConnect />);

    // Open the gate.
    fireEvent.press(screen.getByText('Create invite link'));
    const providerButton = await screen.findByText('Provider sign-in');

    // Link fails as ACCOUNT_EXISTS, then sign-in switches accounts.
    fireEvent.press(providerButton);
    await waitFor(() => expect(mockLinkProvider).toHaveBeenCalled());
    fireEvent.press(screen.getByText('Provider sign-in'));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());

    // Cancel out of the gate, then retry the original action.
    fireEvent.press(screen.getByText('Not now'));
    fireEvent.press(screen.getByText('Create invite link'));

    await screen.findByText('Finish restoring your account');
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });
});
