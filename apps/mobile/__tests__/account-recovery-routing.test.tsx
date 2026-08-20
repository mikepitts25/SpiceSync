import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useProfilesStore } from '../lib/state/profiles';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { _resetForTests, useVoteSyncStore } from '../lib/sync/voteSync';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockSignIn = jest.fn();
const mockRecoverPermanentAccount = jest.fn();
const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();
const mockIsAppleAvailable = jest.fn();
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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => ({ signIn: mockSignIn }),
}));

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: (...args: unknown[]) => mockIsAppleAvailable(...args),
}));

jest.mock('../lib/sync/inviteFlow', () => ({
  recoverPermanentAccount: (...args: unknown[]) =>
    mockRecoverPermanentAccount(...args),
}));

jest.mock('../lib/sync/syncLoop', () => ({
  startSyncLoop: (...args: unknown[]) => mockStartSyncLoop(...args),
}));

function loadRoute(path: string): React.ComponentType {
  try {
    return require(path).default as React.ComponentType;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      String(error.message).includes(path)
    ) {
      return () => null;
    }
    throw error;
  }
}

function getRecoveryDestination(input: {
  profileCount: number;
  requiresConfirmation: boolean;
}) {
  try {
    const module = require('../lib/auth/recoveryRouting') as {
      getRecoveryDestination?: (value: typeof input) => unknown;
    };
    return module.getRecoveryDestination?.(input);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      String(error.message).includes('../lib/auth/recoveryRouting')
    ) {
      return undefined;
    }
    throw error;
  }
}

const RestoreScreen = loadRoute('../app/(auth)/restore');
const ConfirmProfileScreen = loadRoute('../app/(auth)/confirm-profile');

const googleCredential = {
  provider: 'google' as const,
  token: 'google-token',
  accessToken: 'google-access-token',
};

function profile(id: string, name: string) {
  return {
    id,
    name,
    displayName: name,
    emoji: 'cherries',
    createdAt: 1,
    updatedAt: 1,
  };
}

function activeRecoveryLink() {
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

describe('account recovery routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetForTests();
    useProfilesStore.setState({
      profiles: [],
      activeProfileId: null,
      currentUserId: null,
      hydrated: true,
    });
    useCoupleLinkStore.setState({ link: null });
    mockIsAppleAvailable.mockResolvedValue(false);
    mockGetGoogleCredential.mockResolvedValue(googleCredential);
    mockSignIn.mockResolvedValue({
      status: 'permanent',
      userId: 'account-1',
      providers: ['google'],
      error: null,
    });
  });

  afterEach(() => {
    _resetForTests();
  });

  it('routes a recovered account with no profile to profile creation', () => {
    expect(
      getRecoveryDestination({
        profileCount: 0,
        requiresConfirmation: true,
      })
    ).toEqual({
      pathname: '/(settings)/profiles/new',
      params: { from: 'account-recovery' },
    });
  });

  it('routes populated devices to explicit profile confirmation', () => {
    expect(
      getRecoveryDestination({
        profileCount: 2,
        requiresConfirmation: true,
      })
    ).toBe('/(auth)/confirm-profile');
  });

  it('restores a signed-in account and asks an existing device to confirm its local profile', async () => {
    useProfilesStore.setState({
      profiles: [profile('profile-1', 'Alex')],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });
    mockRecoverPermanentAccount.mockImplementation(async () => {
      useCoupleLinkStore.setState({ link: activeRecoveryLink() });
      return { kind: 'recovered', coupleId: 'couple-1' };
    });

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(googleCredential)
    );
    await waitFor(() =>
      expect(mockRecoverPermanentAccount).toHaveBeenCalledWith({
        requireProfileConfirmation: true,
      })
    );
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/confirm-profile');
  });

  it('keeps a recovered account without a couple in normal partner setup', async () => {
    mockRecoverPermanentAccount.mockResolvedValue({ kind: 'no-couple' });

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/(onboarding)/partner-connect'
      )
    );
    expect(useCoupleLinkStore.getState().link).toBeNull();
  });

  it('treats native provider cancellation as a safe non-error outcome', async () => {
    mockGetGoogleCredential.mockRejectedValue({ code: 'CANCELLED' });

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockGetGoogleCredential).toHaveBeenCalled());
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(screen.queryByText('Could not restore your account.')).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('disables Back while a provider credential is in flight', async () => {
    const credential = deferred<typeof googleCredential>();
    mockGetGoogleCredential.mockReturnValue(credential.promise);

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Back' }).props.accessibilityState
          .disabled
      ).toBe(true)
    );
    fireEvent.press(screen.getByText('Back'));
    expect(mockRouter.back).not.toHaveBeenCalled();

    await act(async () => {
      credential.resolve(googleCredential);
      await Promise.resolve();
    });
  });

  it('ignores a credential that resolves after the restore screen unmounts', async () => {
    const credential = deferred<typeof googleCredential>();
    mockGetGoogleCredential.mockReturnValue(credential.promise);

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));
    await waitFor(() => expect(mockGetGoogleCredential).toHaveBeenCalled());
    screen.unmount();

    credential.resolve(googleCredential);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockRecoverPermanentAccount).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('ignores recovery completion after the restore screen unmounts', async () => {
    const signingIn = deferred<{
      status: string;
      userId: string;
      providers: string[];
      error: null;
    }>();
    mockSignIn.mockReturnValue(signingIn.promise);

    const screen = render(<RestoreScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(googleCredential)
    );
    screen.unmount();

    signingIn.resolve({
      status: 'permanent',
      userId: 'account-1',
      providers: ['google'],
      error: null,
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(mockRecoverPermanentAccount).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('routes profile confirmation through creation when the device has no local profile', async () => {
    useCoupleLinkStore.setState({ link: activeRecoveryLink() });

    render(<ConfirmProfileScreen />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: '/(settings)/profiles/new',
        params: { from: 'account-recovery' },
      })
    );
  });

  it('confirms the selected local profile before starting sync and opening the deck', async () => {
    useProfilesStore.setState({
      profiles: [profile('profile-1', 'Alex')],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });
    useCoupleLinkStore.setState({ link: activeRecoveryLink() });

    const screen = render(<ConfirmProfileScreen />);
    fireEvent.press(screen.getByText('Alex'));

    await waitFor(() =>
      expect(
        useCoupleLinkStore.getState().link?.requiresProfileConfirmation
      ).toBe(false)
    );
    expect(useVoteSyncStore.getState().localProfileId).toBe('profile-1');
    expect(mockStartSyncLoop).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/deck');
  });
});
