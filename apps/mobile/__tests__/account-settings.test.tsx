import React from 'react';
import { Alert, Platform, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useSettingsStore } from '../src/stores/settingsStore';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
const mockGetSnapshot = jest.fn();
const mockLinkProvider = jest.fn();
const mockSignOut = jest.fn();
const mockForgetCurrentDevice = jest.fn();
const mockGetIdentityIfExists = jest.fn();
const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();
const mockIsAppleAvailable = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
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
  getAccountService: () => ({
    getSnapshot: mockGetSnapshot,
    linkProvider: mockLinkProvider,
    signOut: mockSignOut,
    forgetCurrentDevice: mockForgetCurrentDevice,
  }),
}));

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: (...args: unknown[]) => mockIsAppleAvailable(...args),
}));

jest.mock('../lib/sync/identity', () => ({
  getIdentityIfExists: (...args: unknown[]) => mockGetIdentityIfExists(...args),
}));

function loadAccountSettingsScreen(): React.ComponentType {
  try {
    return require('../app/(settings)/account').default as React.ComponentType;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      String(error.message).includes('../app/(settings)/account')
    ) {
      return () => <Text>Account settings unavailable</Text>;
    }
    throw error;
  }
}

function loadPartnerSyncScreen(): React.ComponentType {
  return require('../app/(settings)/partner-sync')
    .default as React.ComponentType;
}

const AccountSettingsScreen = loadAccountSettingsScreen();
const PartnerSyncScreen = loadPartnerSyncScreen();

function accountSnapshot(
  overrides: Partial<{
    status: 'local-only' | 'anonymous' | 'permanent';
    providers: ('apple' | 'google')[];
  }> = {}
) {
  return {
    status: 'permanent' as const,
    userId: 'account-1',
    providers: [] as ('apple' | 'google')[],
    error: null,
    ...overrides,
  };
}

function setPlatform(os: 'ios' | 'android') {
  const descriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
  return () => {
    if (descriptor) Object.defineProperty(Platform, 'OS', descriptor);
  };
}

async function confirmLatestAlert(label: string) {
  const alert = jest.mocked(Alert.alert);
  const buttons = alert.mock.calls.at(-1)?.[2] ?? [];
  const button = buttons.find((candidate) => candidate.text === label);
  await act(async () => {
    await button?.onPress?.();
  });
}

describe('account settings', () => {
  let restorePlatform: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    restorePlatform = setPlatform('ios');
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockGetSnapshot.mockResolvedValue(accountSnapshot());
    mockLinkProvider.mockResolvedValue(
      accountSnapshot({ providers: ['google'] })
    );
    mockSignOut.mockResolvedValue(undefined);
    mockForgetCurrentDevice.mockResolvedValue(undefined);
    mockGetIdentityIfExists.mockResolvedValue(null);
    mockGetGoogleCredential.mockResolvedValue({
      provider: 'google',
      token: 'google-token',
      accessToken: 'google-access-token',
    });
    mockGetAppleCredential.mockResolvedValue({
      provider: 'apple',
      token: 'apple-token',
      nonce: 'nonce',
    });
    mockIsAppleAvailable.mockResolvedValue(true);
    useSettingsStore.setState({ language: 'en' });
    useCoupleLinkStore.setState({ link: null, securityNotice: null });
  });

  afterEach(() => {
    restorePlatform?.();
    jest.restoreAllMocks();
  });

  it('warns an Apple-only account to link Google for Android recovery', async () => {
    mockGetSnapshot.mockResolvedValue(
      accountSnapshot({ providers: ['apple'] })
    );

    const screen = render(<AccountSettingsScreen />);

    expect(
      await screen.findByText('Link Google for Android recovery')
    ).toBeTruthy();
  });

  it('offers both missing providers on iOS and links the selected one', async () => {
    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Link Google')).toBeTruthy();
    expect(await screen.findByText('Link Apple')).toBeTruthy();

    fireEvent.press(screen.getByText('Link Google'));

    await waitFor(() =>
      expect(mockLinkProvider).toHaveBeenCalledWith({
        provider: 'google',
        token: 'google-token',
        accessToken: 'google-access-token',
      })
    );
  });

  it('exposes Google only when the device is Android', async () => {
    restorePlatform?.();
    restorePlatform = setPlatform('android');

    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Link Google')).toBeTruthy();
    expect(screen.queryByText('Link Apple')).toBeNull();
  });

  it('treats a cancelled provider operation as a non-error', async () => {
    mockGetGoogleCredential.mockRejectedValue({ code: 'CANCELLED' });
    const screen = render(<AccountSettingsScreen />);

    fireEvent.press(await screen.findByText('Link Google'));

    await waitFor(() => expect(mockGetGoogleCredential).toHaveBeenCalled());
    expect(mockLinkProvider).not.toHaveBeenCalled();
    expect(screen.queryByText('Could not link this provider.')).toBeNull();
  });

  it('signs out without invoking the forget-device operation', async () => {
    const screen = render(<AccountSettingsScreen />);

    fireEvent.press(await screen.findByText('Sign out'));
    await confirmLatestAlert('Sign out');

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockForgetCurrentDevice).not.toHaveBeenCalled();
  });

  it('keeps the protected session visible when this device cannot be found for revocation', async () => {
    mockForgetCurrentDevice.mockRejectedValue(
      Object.assign(new Error('missing device'), { code: 'DEVICE_NOT_FOUND' })
    );
    const screen = render(<AccountSettingsScreen />);

    await screen.findByText('Protected account');
    fireEvent.press(screen.getByText('Forget this device'));
    await confirmLatestAlert('Forget this device');

    await waitFor(() =>
      expect(
        screen.getByText(
          'This device cannot be found. You are still signed in. Try again.'
        )
      ).toBeTruthy()
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(screen.getByText('Protected account')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Forget this device' }).props
        .accessibilityState?.disabled
    ).not.toBe(true);
  });

  it('labels the latest sync as local activity instead of server last seen', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        ownerUserId: 'user-1',
        myDeviceId: 'device-1',
        partnerDeviceId: 'device-2',
        partnerSigningPublicKey: 'partner-signing',
        partnerEncryptionPublicKey: 'partner-encryption',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: 1_700_000_000_000,
        status: 'active',
      },
    });
    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Last local sync')).toBeTruthy();
    expect(screen.queryByText('Last seen')).toBeNull();
  });

  it('labels the identity timestamp as when the device was added', async () => {
    mockGetIdentityIfExists.mockResolvedValue({
      identity: { createdAt: 1_700_000_000_000 },
    });
    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Device added')).toBeTruthy();
    expect(screen.queryByText('Last seen')).toBeNull();
  });

  it('does not claim server activity when no local activity is available', async () => {
    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Server activity')).toBeTruthy();
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.queryByText('Last seen')).toBeNull();
  });

  it('localizes unavailable server activity in Spanish', async () => {
    useSettingsStore.setState({ language: 'es' });
    const screen = render(<AccountSettingsScreen />);

    expect(await screen.findByText('Actividad del servidor')).toBeTruthy();
    expect(screen.getByText('No disponible')).toBeTruthy();
  });

  it('renders and acknowledges a partner device-key security notice', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        ownerUserId: 'user-1',
        myDeviceId: 'device-1',
        partnerDeviceId: 'device-2',
        partnerSigningPublicKey: 'partner-signing',
        partnerEncryptionPublicKey: 'partner-encryption',
        partnerProfileName: 'Sam',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
      securityNotice: {
        kind: 'partner-device-restored',
        occurredAt: 1,
        acknowledged: false,
        partnerName: 'Sam',
      },
    });

    const screen = render(<PartnerSyncScreen />);

    await waitFor(() => expect(mockGetSnapshot).toHaveBeenCalled());

    expect(screen.getByText('Partner security update')).toBeTruthy();
    fireEvent.press(screen.getByText('I understand'));
    expect(useCoupleLinkStore.getState().securityNotice?.acknowledged).toBe(
      true
    );
  });
});
