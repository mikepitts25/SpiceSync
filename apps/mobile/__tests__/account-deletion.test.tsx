import React from 'react';
import { Alert, Platform, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
const mockGetSnapshot = jest.fn();
const mockGetDeletionProvider = jest.fn();
const mockPrepareAccountDeletion = jest.fn();
const mockDeleteAccount = jest.fn();
const mockGetIdentityIfExists = jest.fn();
const mockResetAppOnDevice = jest.fn();
const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();

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
    getDeletionProvider: mockGetDeletionProvider,
    prepareAccountDeletion: mockPrepareAccountDeletion,
    deleteAccount: mockDeleteAccount,
    linkProvider: jest.fn(),
    signOut: jest.fn(),
    forgetCurrentDevice: jest.fn(),
  }),
}));

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: async () => false,
}));

jest.mock('../lib/sync/identity', () => ({
  getIdentityIfExists: (...args: unknown[]) => mockGetIdentityIfExists(...args),
}));

jest.mock('../lib/safety/localDataControls', () => ({
  resetAppOnDevice: (...args: unknown[]) => mockResetAppOnDevice(...args),
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

const AccountSettingsScreen = loadAccountSettingsScreen();

function permanentSnapshot(providers: ('apple' | 'google')[] = ['google']) {
  return {
    status: 'permanent' as const,
    userId: 'account-1',
    providers,
    error: null,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

async function confirmDelete(): Promise<void> {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  const button = buttons.find(
    (candidate) => candidate.text === 'Delete account'
  );
  await act(async () => {
    await button?.onPress?.();
  });
}

async function pressDelete(screen: ReturnType<typeof render>): Promise<void> {
  await waitFor(() =>
    expect(
      screen.getByLabelText('Delete account').props.accessibilityState?.disabled
    ).toBe(false)
  );
  fireEvent.press(screen.getByLabelText('Delete account'));
}

describe('account deletion', () => {
  let restorePlatform: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    const descriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    restorePlatform = () => {
      if (descriptor) Object.defineProperty(Platform, 'OS', descriptor);
    };
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockGetSnapshot.mockResolvedValue(permanentSnapshot());
    mockGetDeletionProvider.mockResolvedValue('google');
    mockPrepareAccountDeletion.mockImplementation(async (provider) =>
      provider === 'google' ? { googleChallengeId: 'challenge-1' } : {}
    );
    mockDeleteAccount.mockResolvedValue(undefined);
    mockGetIdentityIfExists.mockResolvedValue(null);
    mockResetAppOnDevice.mockResolvedValue(undefined);
    mockGetGoogleCredential.mockResolvedValue({
      provider: 'google',
      token: 'fresh-google-id-token',
      accessToken: 'fresh-google-access-token',
    });
    mockGetAppleCredential.mockResolvedValue({
      provider: 'apple',
      token: 'fresh-apple-id-token',
      nonce: 'fresh-raw-nonce',
      authorizationCode: 'one-time-apple-code',
    });
  });

  afterEach(() => {
    restorePlatform?.();
    jest.restoreAllMocks();
  });

  it('requires a destructive confirmation before reauthenticating and clears local state only after deletion succeeds', async () => {
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete account?',
      expect.stringContaining('cannot be undone'),
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Delete account',
          style: 'destructive',
        }),
      ])
    );
    expect(mockGetGoogleCredential).not.toHaveBeenCalled();

    await confirmDelete();

    await waitFor(() => expect(mockResetAppOnDevice).toHaveBeenCalledTimes(1));
    expect(mockPrepareAccountDeletion).toHaveBeenCalledWith('google');
    expect(mockPrepareAccountDeletion.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetGoogleCredential.mock.invocationCallOrder[0]
    );
    expect(mockDeleteAccount.mock.invocationCallOrder[0]).toBeLessThan(
      mockResetAppOnDevice.mock.invocationCallOrder[0]
    );
    expect(mockResetAppOnDevice.mock.invocationCallOrder[0]).toBeLessThan(
      mockRouter.replace.mock.invocationCallOrder[0]
    );
    expect(mockRouter.replace).toHaveBeenCalledWith('/welcome');
  });

  it('uses an Apple credential when the verified account has Apple linked', async () => {
    mockGetDeletionProvider.mockResolvedValue('apple');
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    expect(mockGetAppleCredential).toHaveBeenCalledTimes(1);
    expect(mockGetGoogleCredential).not.toHaveBeenCalled();
    expect(mockDeleteAccount).toHaveBeenCalledWith(
      {
        provider: 'apple',
        token: 'fresh-apple-id-token',
        nonce: 'fresh-raw-nonce',
        authorizationCode: 'one-time-apple-code',
      },
      {}
    );
  });

  it('uses Google reauthentication for a Google-only account without local revocation', async () => {
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    expect(mockGetGoogleCredential).toHaveBeenCalledTimes(1);
    expect(mockGetAppleCredential).not.toHaveBeenCalled();
    expect(mockResetAppOnDevice).toHaveBeenCalledTimes(1);
  });

  it('silently leaves the account untouched when provider reauthentication is cancelled', async () => {
    mockGetGoogleCredential.mockRejectedValue({ code: 'CANCELLED' });
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() =>
      expect(mockGetGoogleCredential).toHaveBeenCalledTimes(1)
    );
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(mockResetAppOnDevice).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Could not delete your account. Try again.')
    ).toBeNull();
  });

  it('tells Android users with an Apple-linked account that deletion requires Apple sign-in on iOS without falling back to Google', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    mockGetSnapshot.mockResolvedValue(permanentSnapshot(['apple', 'google']));
    mockGetDeletionProvider.mockResolvedValue('apple');
    mockGetAppleCredential.mockRejectedValue({ code: 'PROVIDER_UNAVAILABLE' });
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() =>
      expect(
        screen.getByText(
          'This account is linked to Apple. To delete it, sign in with Apple on an iPhone or iPad, then try again.'
        )
      ).toBeTruthy()
    );
    expect(mockGetAppleCredential).toHaveBeenCalledTimes(1);
    expect(mockGetGoogleCredential).not.toHaveBeenCalled();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(mockResetAppOnDevice).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText('Delete account').props.accessibilityState?.disabled
    ).toBe(true);
  });

  it('keeps local state and navigation unchanged when server deletion fails', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('offline'));
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() =>
      expect(
        screen.getByText('Could not delete your account. Try again.')
      ).toBeTruthy()
    );
    expect(mockResetAppOnDevice).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('reports a local cleanup failure truthfully after the server has deleted the account', async () => {
    mockResetAppOnDevice.mockRejectedValue(new Error('storage failure'));
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    await confirmDelete();

    await waitFor(() =>
      expect(
        screen.getByText(
          'Your account was deleted, but this device could not finish clearing its data. Reset the app on this device to finish.'
        )
      ).toBeTruthy()
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('runs only one deletion attempt when the destructive confirmation is invoked twice', async () => {
    const deletion = deferred<void>();
    mockDeleteAccount.mockReturnValue(deletion.promise);
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
    const button = buttons.find(
      (candidate) => candidate.text === 'Delete account'
    );
    await act(async () => {
      button?.onPress?.();
      button?.onPress?.();
    });

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    await act(async () => {
      deletion.resolve();
      await deletion.promise;
    });

    expect(mockResetAppOnDevice).toHaveBeenCalledTimes(1);
  });

  it('resets confirmed deletion data without navigating after the screen unmounts', async () => {
    const deletion = deferred<void>();
    mockDeleteAccount.mockReturnValue(deletion.promise);
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
    const button = buttons.find(
      (candidate) => candidate.text === 'Delete account'
    );
    await act(async () => {
      button?.onPress?.();
    });
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    screen.unmount();

    await act(async () => {
      deletion.resolve();
      await deletion.promise;
    });

    await waitFor(() => expect(mockResetAppOnDevice).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('does not start deletion when the screen unmounts while a native credential is pending', async () => {
    const credential = deferred<{
      provider: 'google';
      token: string;
      accessToken: string;
    }>();
    mockGetGoogleCredential.mockReturnValue(credential.promise);
    const screen = render(<AccountSettingsScreen />);

    await pressDelete(screen);
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
    const button = buttons.find(
      (candidate) => candidate.text === 'Delete account'
    );
    await act(async () => {
      button?.onPress?.();
    });
    await waitFor(() =>
      expect(mockGetGoogleCredential).toHaveBeenCalledTimes(1)
    );
    screen.unmount();

    await act(async () => {
      credential.resolve({
        provider: 'google',
        token: 'late-google-id-token',
        accessToken: 'late-google-access-token',
      });
      await credential.promise;
    });

    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(mockResetAppOnDevice).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
