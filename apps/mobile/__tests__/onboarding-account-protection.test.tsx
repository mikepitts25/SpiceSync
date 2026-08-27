import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();
const mockIsAppleAvailable = jest.fn();
const mockLinkProvider = jest.fn();

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: (...args: unknown[]) => mockIsAppleAvailable(...args),
}));

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => ({ linkProvider: mockLinkProvider }),
}));

const { OnboardingAccountProtection } =
  require('../components/auth/OnboardingAccountProtection') as typeof import('../components/auth/OnboardingAccountProtection');

const googleCredential = {
  provider: 'google' as const,
  token: 'google-id-token',
  accessToken: 'google-access-token',
};

describe('OnboardingAccountProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAppleAvailable.mockResolvedValue(false);
    mockGetGoogleCredential.mockResolvedValue(googleCredential);
  });

  it('finishes onboarding only after the selected provider is linked', async () => {
    mockLinkProvider.mockResolvedValue({
      status: 'permanent',
      userId: 'user-1',
      providers: ['google'],
      error: null,
    });
    const onComplete = jest.fn();
    const screen = render(
      <OnboardingAccountProtection
        onComplete={onComplete}
        onRestore={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(mockLinkProvider).toHaveBeenCalledWith(googleCredential)
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('directs an already-linked credential to explicit account restoration', async () => {
    mockLinkProvider.mockRejectedValue(
      Object.assign(new Error('already linked'), { code: 'ACCOUNT_EXISTS' })
    );
    const onComplete = jest.fn();
    const onRestore = jest.fn();
    const screen = render(
      <OnboardingAccountProtection
        onComplete={onComplete}
        onRestore={onRestore}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(
      await screen.findByText(
        'This sign-in already belongs to an existing account. Restore it instead.'
      )
    ).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Already have an account? Restore it'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('does not advance when linking reports that the underlying account changed', async () => {
    mockLinkProvider.mockResolvedValue({
      status: 'permanent',
      userId: 'existing-user',
      providers: ['google'],
      error: null,
      accountChanged: true,
    });
    const onComplete = jest.fn();
    const screen = render(
      <OnboardingAccountProtection
        onComplete={onComplete}
        onRestore={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(
      await screen.findByText(
        'This sign-in already belongs to an existing account. Restore it instead.'
      )
    ).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it.each([
    ['Google', 'CANCELLED'],
    ['Apple', 'ERR_REQUEST_CANCELED'],
  ])(
    'stays on the optional screen when %s authentication is cancelled',
    async (provider, code) => {
      if (provider === 'Apple') {
        mockIsAppleAvailable.mockResolvedValue(true);
        mockGetAppleCredential.mockRejectedValue({ code });
      } else {
        mockGetGoogleCredential.mockRejectedValue({ code });
      }
      const onComplete = jest.fn();
      const onRestore = jest.fn();
      const screen = render(
        <OnboardingAccountProtection
          onComplete={onComplete}
          onRestore={onRestore}
        />
      );

      const button = await screen.findByText(`Continue with ${provider}`);
      fireEvent.press(button);

      await waitFor(() =>
        expect(screen.getByText('Protect your account')).toBeTruthy()
      );
      expect(
        screen.queryByText('Could not protect your account. Try again.')
      ).toBeNull();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onRestore).not.toHaveBeenCalled();
    }
  );

  it('lets people skip protection or choose restoration explicitly', () => {
    const onComplete = jest.fn();
    const onRestore = jest.fn();
    const screen = render(
      <OnboardingAccountProtection
        onComplete={onComplete}
        onRestore={onRestore}
      />
    );

    fireEvent.press(screen.getByText('Not now'));
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('Already have an account? Restore it'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('shows Apple Sign In when it is available on the device', async () => {
    mockIsAppleAvailable.mockResolvedValue(true);
    const screen = render(
      <OnboardingAccountProtection
        onComplete={jest.fn()}
        onRestore={jest.fn()}
      />
    );

    expect(await screen.findByText('Continue with Apple')).toBeTruthy();
  });
});
