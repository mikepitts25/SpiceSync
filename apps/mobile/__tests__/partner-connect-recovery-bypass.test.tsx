import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockRequirePermanentUser = jest.fn();
const mockCreateInvite = jest.fn();
const mockAcceptInvite = jest.fn();

type MockGateProps = {
  onComplete: () => void | Promise<void>;
  onCancel: () => void;
};

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
  getAccountService: () => ({ requirePermanentUser: mockRequirePermanentUser }),
}));

jest.mock('../lib/sync/inviteFlow', () => ({
  createInvite: (...args: unknown[]) => mockCreateInvite(...args),
  acceptInvite: (...args: unknown[]) => mockAcceptInvite(...args),
  lookupInvite: jest.fn().mockResolvedValue({
    kind: 'pending',
    inviterPublicKey: 'pk',
    inviterSigningPublicKey: 'spk',
    inviterProfileName: 'Partner',
    inviterProfileAvatar: null,
    expiresAt: 4102444800000,
  }),
  finalizePendingInvite: jest.fn(),
  buildInviteShareContent: jest.fn(),
  buildInviteShareUrl: jest.fn(),
  parseInviteUrl: (value: string) =>
    value.includes('invite')
      ? { inviteId: 'invite-9', inviteSecret: 'secret-9' }
      : null,
}));

jest.mock('../lib/sync/syncLoop', () => ({ startSyncLoop: jest.fn() }));
jest.mock('../lib/sync/voteSync', () => ({
  startVoteSync: jest.fn(),
  useVoteSyncStore: { getState: () => ({ setLocalProfileId: jest.fn() }) },
}));

jest.mock('../components/auth/PartnerAccountGate', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    PartnerAccountGate: ({ onCancel }: MockGateProps) => (
      <View>
        <Pressable onPress={onCancel}>
          <Text>Not now</Text>
        </Pressable>
      </View>
    ),
  };
});

const { useCoupleLinkStore } = require('../lib/sync/coupleLink');

const PartnerConnect = require('../app/(onboarding)/partner-connect')
  .default as typeof import('../app/(onboarding)/partner-connect').default;

/**
 * An account switch leaves a pending profile-confirmation owner. Recovery must
 * resolve that state before any new relationship can be created or accepted.
 * Cancelling the gate and retrying must not reach create/accept.
 */
describe('PartnerConnect pending-recovery enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The switched-to account is a real permanent user, so the permanent-account
    // gate alone passes. Only pending recovery state should block the action.
    mockRequirePermanentUser.mockResolvedValue('switched-user');
    mockCreateInvite.mockResolvedValue({
      inviteId: 'invite-1',
      inviteSecret: 'secret',
      inviteUrl: 'https://example.test/invite-1',
      appUrl: 'spicesync://link/invite-1#secret',
    });
    mockAcceptInvite.mockResolvedValue({ coupleId: 'couple-1' });
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: 'switched-user',
      remoteSyncPauseReason: 'auth-required',
      pendingProfileConfirmationOwnerUserId: 'switched-user',
      profileConfirmationInProgress: null,
      remoteStateNotice: {
        kind: 'account-switched',
        discardedPendingCount: 0,
        occurredAt: 1,
      },
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

  it('blocks creating an invite while recovery confirmation is pending', async () => {
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Create invite link'));

    // The blocked action surfaces the restore path instead of an invite.
    await screen.findByText('Finish restoring your account');
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it('still blocks creating after the account gate is cancelled and retried', async () => {
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Create invite link'));
    const notNow = screen.queryByText('Not now');
    if (notNow) fireEvent.press(notNow);

    // Retrying after a cancelled gate must not reach create.
    await screen.findByText('Finish restoring your account');
    expect(screen.queryByText('Create invite link')).toBeNull();
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it('clears the notice once recovery resolves', async () => {
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Create invite link'));
    await screen.findByText('Finish restoring your account');

    // Recovery completed elsewhere while this screen stayed mounted.
    await act(async () => {
      useCoupleLinkStore.setState({
        pendingProfileConfirmationOwnerUserId: null,
        remoteSyncPauseReason: null,
      });
    });

    // The screen must not stay stuck on the notice.
    await screen.findByText('Create invite link');
    expect(screen.queryByText('Finish restoring your account')).toBeNull();
  });

  it('blocks accepting a pasted invite while recovery confirmation is pending', async () => {
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Paste link'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Paste invite link'),
      'spicesync://link/invite-9#secret-9'
    );
    fireEvent.press(screen.getByText('Continue'));

    const accept = await screen.findByText('Accept invite');
    fireEvent.press(accept);

    await screen.findByText('Finish restoring your account');
    expect(mockAcceptInvite).not.toHaveBeenCalled();
  });
});
