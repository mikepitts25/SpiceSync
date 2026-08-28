import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useProfilesStore } from '../lib/state/profiles';
import {
  shouldStartRemoteSyncForLinkTransition,
  useCoupleLinkStore,
} from '../lib/sync/coupleLink';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
const mockStartVoteSync = jest.fn();
const mockSetLocalProfileId = jest.fn();
const mockStartSyncLoop = jest.fn();

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../lib/sync/voteSync', () => ({
  startVoteSync: (...args: unknown[]) => mockStartVoteSync(...args),
  useVoteSyncStore: {
    getState: () => ({ setLocalProfileId: mockSetLocalProfileId }),
  },
}));

jest.mock('../lib/sync/syncLoop', () => ({
  startSyncLoop: (...args: unknown[]) => mockStartSyncLoop(...args),
}));

const ConfirmProfileScreen = require('../app/(auth)/confirm-profile')
  .default as typeof import('../app/(auth)/confirm-profile').default;

function recoveryLink() {
  return {
    coupleId: 'couple-1',
    ownerUserId: 'user-1',
    myDeviceId: 'device-1',
    partnerDeviceId: 'device-2',
    partnerSigningPublicKey: 'partner-signing-key',
    partnerEncryptionPublicKey: 'partner-encryption-key',
    linkedAt: 1,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    requiresProfileConfirmation: true,
    status: 'active' as const,
  };
}

describe('recovered profile confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-1',
          name: 'Alex',
          displayName: 'Alex',
          emoji: 'cherries',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });
    useCoupleLinkStore.setState({
      link: recoveryLink(),
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: 'auth-required',
      pendingProfileConfirmationOwnerUserId: 'user-1',
    });
  });

  it('releases the persisted pause before starting vote bootstrap and remote sync', async () => {
    const bootstrap = deferred<boolean>();
    mockStartVoteSync.mockReturnValue(bootstrap.promise);

    const screen = render(<ConfirmProfileScreen />);
    fireEvent.press(screen.getByText('Alex'));

    await waitFor(() =>
      expect(mockStartVoteSync).toHaveBeenCalledWith('profile-1')
    );
    expect(mockSetLocalProfileId).toHaveBeenCalledWith('profile-1');
    expect(
      useCoupleLinkStore.getState().link?.requiresProfileConfirmation
    ).toBe(false);
    expect(mockStartSyncLoop).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await act(async () => {
      bootstrap.resolve(true);
    });

    await waitFor(() => expect(mockStartSyncLoop).toHaveBeenCalledTimes(1));
    expect(
      useCoupleLinkStore.getState().link?.requiresProfileConfirmation
    ).toBe(false);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/deck');
    expect(mockStartSyncLoop.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockStartVoteSync.mock.invocationCallOrder[0]
    );
  });

  it('restores the recovery pause when vote bootstrap throws', async () => {
    mockStartVoteSync.mockRejectedValue(new Error('bootstrap failed'));

    const screen = render(<ConfirmProfileScreen />);
    fireEvent.press(screen.getByText('Alex'));

    await waitFor(() =>
      expect(screen.getByText('bootstrap failed')).toBeTruthy()
    );
    expect(
      useCoupleLinkStore.getState().link?.requiresProfileConfirmation
    ).toBe(true);
    expect(mockStartSyncLoop).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('does not make a confirmation-release link transition an automatic loop trigger', () => {
    expect(
      shouldStartRemoteSyncForLinkTransition(recoveryLink(), {
        ...recoveryLink(),
        requiresProfileConfirmation: false,
      })
    ).toBe(false);
  });

  it('does not restart remote sync for routine updates to an active link', () => {
    const current = {
      ...recoveryLink(),
      requiresProfileConfirmation: false,
      lastPulledServerSequence: 4,
      lastSyncedAt: 1_700_000_000_000,
    };
    useCoupleLinkStore.setState({
      link: current,
      authenticatedUserId: current.ownerUserId,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
    });

    expect(
      shouldStartRemoteSyncForLinkTransition(current, {
        ...current,
        lastPulledServerSequence: 5,
        lastSyncedAt: 1_700_000_001_000,
      })
    ).toBe(false);
  });
});
