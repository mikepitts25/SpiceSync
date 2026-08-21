import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSignIn = jest.fn();
const mockRecoverPermanentAccount = jest.fn();
const mockStartVoteSync = jest.fn();
const mockStartSyncLoop = jest.fn();
const mockSetLocalProfileId = jest.fn();
const mockHydrate = jest.fn();
const mockGetProfiles = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => ({ signIn: mockSignIn }),
}));

jest.mock('../lib/sync/inviteFlow', () => ({
  recoverPermanentAccount: (...args: unknown[]) =>
    mockRecoverPermanentAccount(...args),
}));

jest.mock('../lib/sync/syncLoop', () => ({
  startSyncLoop: (...args: unknown[]) => mockStartSyncLoop(...args),
}));

jest.mock('../lib/sync/voteSync', () => ({
  startVoteSync: (...args: unknown[]) => mockStartVoteSync(...args),
  useVoteSyncStore: {
    getState: () => ({ setLocalProfileId: mockSetLocalProfileId }),
  },
}));

jest.mock('../lib/state/profiles', () => ({
  useProfilesStore: {
    getState: () => ({
      hydrate: mockHydrate,
      getProfiles: mockGetProfiles,
      getActiveProfileId: () => 'profile-1',
    }),
  },
}));

jest.mock('../components/auth/AccountProviderButtons', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AccountProviderButtons: ({
      onCredential,
    }: {
      onCredential: (credential: unknown) => void;
    }) => (
      <Pressable
        onPress={() => onCredential({ provider: 'apple', token: 'tok' })}
      >
        <Text>Continue with Apple</Text>
      </Pressable>
    ),
  };
});

const { useCoupleLinkStore } = require('../lib/sync/coupleLink');

const RestoreScreen = require('../app/(auth)/restore')
  .default as React.ComponentType;

/**
 * Signing back into the same account recovers a link that needs no profile
 * confirmation, so the confirm-profile screen — which is what normally restarts
 * sync — is skipped. Restore must resume the vote subscription itself, or votes
 * stay unsent until an AppState transition.
 */
describe('restore resumes sync without confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ status: 'permanent', userId: 'user-1' });
    mockHydrate.mockResolvedValue(undefined);
    mockGetProfiles.mockReturnValue([{ id: 'profile-1' }]);
    mockStartVoteSync.mockResolvedValue(true);
    mockRecoverPermanentAccount.mockResolvedValue({
      kind: 'recovered',
      coupleId: 'couple-1',
    });
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        ownerUserId: 'user-1',
        myDeviceId: 'device-1',
        myKeyVersion: 1,
        partnerDeviceId: 'device-2',
        partnerKeyVersion: 1,
        partnerSigningPublicKey: 'spk',
        partnerEncryptionPublicKey: 'epk',
        partnerProfileName: 'Partner',
        partnerProfileAvatar: null,
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        // Same owned relationship — no confirmation required.
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
    });
  });

  afterEach(() => {
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
    });
  });

  it('restarts vote sync and the sync loop when routing straight to the deck', async () => {
    const screen = render(<RestoreScreen />);

    fireEvent.press(screen.getByText('Continue with Apple'));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/deck')
    );
    expect(mockStartVoteSync).toHaveBeenCalled();
    expect(mockStartSyncLoop).toHaveBeenCalled();
  });

  it('leaves the sync restart to confirmation when confirmation is required', async () => {
    useCoupleLinkStore.setState({
      link: {
        ...useCoupleLinkStore.getState().link!,
        requiresProfileConfirmation: true,
      },
    });

    const screen = render(<RestoreScreen />);

    fireEvent.press(screen.getByText('Continue with Apple'));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/confirm-profile')
    );
    // The confirmation screen owns that handoff after its vote bootstrap.
    expect(mockStartSyncLoop).not.toHaveBeenCalled();
  });
});
