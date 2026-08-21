import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useCoupleLinkStore } from '../lib/sync/coupleLink';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
const mockGetSnapshot = jest.fn();
const mockLinkProvider = jest.fn();
const mockSignOut = jest.fn();
const mockForgetCurrentDevice = jest.fn();
const mockGetIdentityIfExists = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

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
  getAccountService: () => ({
    getSnapshot: mockGetSnapshot,
    linkProvider: mockLinkProvider,
    signOut: mockSignOut,
    forgetCurrentDevice: mockForgetCurrentDevice,
  }),
}));

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: jest.fn(),
  getAppleCredential: jest.fn(),
  isAppleAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock('../lib/sync/identity', () => ({
  getIdentityIfExists: (...args: unknown[]) => mockGetIdentityIfExists(...args),
}));

const AccountSettingsScreen = require('../app/(settings)/account')
  .default as React.ComponentType;

function setPlatform(os: 'ios' | 'android') {
  const descriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
  return () => {
    if (descriptor) Object.defineProperty(Platform, 'OS', descriptor);
  };
}

/**
 * Signing out pauses remote sync with reason `signed-out` and keeps the link.
 * The signed-out user must have a reachable way back: linking a provider to a
 * non-existent session is the wrong operation, so the screen must offer the
 * restore/sign-in route that resumes sync.
 */
describe('signed-out account resume path', () => {
  let restorePlatform: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    restorePlatform = setPlatform('ios');
    mockGetIdentityIfExists.mockResolvedValue(null);
    // Signed out: Supabase reports no session at all.
    mockGetSnapshot.mockResolvedValue({
      status: 'local-only',
      userId: null,
      providers: [],
      error: null,
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
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: null,
      remoteSyncPauseReason: 'signed-out',
      pendingProfileConfirmationOwnerUserId: null,
    });
  });

  afterEach(() => {
    restorePlatform?.();
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
    });
  });

  it('offers a sign-in action that routes to the restore flow', async () => {
    const screen = render(<AccountSettingsScreen />);

    const signIn = await screen.findByText('Sign in and resume sync');
    fireEvent.press(signIn);

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/restore')
    );
    // Linking an identity onto a missing session is not the recovery operation.
    expect(mockLinkProvider).not.toHaveBeenCalled();
  });

  it('does not offer the sign-in action while a permanent session is active', async () => {
    mockGetSnapshot.mockResolvedValue({
      status: 'permanent',
      userId: 'user-1',
      providers: ['apple'],
      error: null,
    });

    const screen = render(<AccountSettingsScreen />);

    await screen.findByText('Sign out');
    expect(screen.queryByText('Sign in and resume sync')).toBeNull();
  });
});
