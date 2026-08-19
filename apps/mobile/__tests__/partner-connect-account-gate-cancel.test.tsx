import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRequirePermanentUser = jest.fn();
const mockCreateInvite = jest.fn();
let staleGateCompletion: (() => void | Promise<void>) | undefined;

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

jest.mock('../components/auth/PartnerAccountGate', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    PartnerAccountGate: ({ onComplete, onCancel }: MockGateProps) => (
      <View>
        <Pressable onPress={() => (staleGateCompletion = onComplete)}>
          <Text>Begin provider operation</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text>Not now</Text>
        </Pressable>
      </View>
    ),
  };
});

const PartnerConnect = require('../app/(onboarding)/partner-connect')
  .default as typeof import('../app/(onboarding)/partner-connect').default;

describe('PartnerConnect account gate cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    staleGateCompletion = undefined;
    mockRequirePermanentUser
      .mockRejectedValueOnce({ code: 'ACCOUNT_REQUIRED' })
      .mockResolvedValue('user-1');
    mockCreateInvite.mockResolvedValue({
      inviteId: 'invite-1',
      inviteSecret: 'secret',
      inviteUrl: 'https://example.test/invite-1',
      appUrl: 'spicesync://link/invite-1#secret',
    });
  });

  it('invalidates a deferred create when its in-flight account gate is cancelled', async () => {
    const screen = render(<PartnerConnect />);

    fireEvent.press(screen.getByText('Create invite link'));
    await screen.findByText('Begin provider operation');
    fireEvent.press(screen.getByText('Begin provider operation'));
    fireEvent.press(screen.getByText('Not now'));

    await staleGateCompletion?.();

    await waitFor(() => expect(mockCreateInvite).not.toHaveBeenCalled());
  });
});
