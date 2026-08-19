import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetGoogleCredential = jest.fn();
const mockGetAppleCredential = jest.fn();
const mockIsAppleAvailable = jest.fn();
const mockGetAccountService = jest.fn();

jest.mock('../lib/auth/providers', () => ({
  getGoogleCredential: (...args: unknown[]) => mockGetGoogleCredential(...args),
  getAppleCredential: (...args: unknown[]) => mockGetAppleCredential(...args),
  isAppleAvailable: (...args: unknown[]) => mockIsAppleAvailable(...args),
}));

jest.mock('../lib/auth/accountService', () => ({
  getAccountService: () => mockGetAccountService(),
}));

const { PartnerAccountGate } =
  require('../components/auth/PartnerAccountGate') as typeof import('../components/auth/PartnerAccountGate');

const googleCredential = {
  provider: 'google' as const,
  token: 'google-id-token',
  accessToken: 'google-access-token',
};

function permanentAccount(userId: string) {
  return {
    status: 'permanent' as const,
    userId,
    providers: ['google' as const],
    error: null,
  };
}

describe('PartnerAccountGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAppleAvailable.mockResolvedValue(false);
  });

  it('does not complete the protected action until Google linking completes', async () => {
    let resolveLink:
      | ((account: ReturnType<typeof permanentAccount>) => void)
      | undefined;
    const linkProvider = jest.fn(
      () =>
        new Promise<ReturnType<typeof permanentAccount>>((resolve) => {
          resolveLink = resolve;
        })
    );
    const onComplete = jest.fn();
    mockGetGoogleCredential.mockResolvedValue(googleCredential);
    mockGetAccountService.mockReturnValue({
      linkProvider,
      signIn: jest.fn(),
      requirePermanentUser: jest.fn().mockResolvedValue('user-1'),
    });

    const screen = render(
      <PartnerAccountGate
        intent="protect"
        onComplete={onComplete}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(linkProvider).toHaveBeenCalledWith(googleCredential)
    );
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      resolveLink?.(permanentAccount('user-1'));
    });

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('treats choosing not to protect as a return to partner setup', () => {
    mockGetAccountService.mockReturnValue({
      linkProvider: jest.fn(),
      signIn: jest.fn(),
      requirePermanentUser: jest.fn(),
    });
    const onCancel = jest.fn();
    const screen = render(
      <PartnerAccountGate
        intent="protect"
        onComplete={jest.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.press(screen.getByText('Not now'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('requires explicit confirmation and a fresh credential before existing-account sign-in', async () => {
    const existingAccountError = Object.assign(new Error('already linked'), {
      code: 'ACCOUNT_EXISTS',
    });
    const firstCredential = { ...googleCredential, token: 'first-token' };
    const freshCredential = { ...googleCredential, token: 'fresh-token' };
    const linkProvider = jest.fn().mockRejectedValue(existingAccountError);
    const signIn = jest
      .fn()
      .mockResolvedValue(permanentAccount('existing-user'));
    const onComplete = jest.fn();
    mockGetGoogleCredential
      .mockResolvedValueOnce(firstCredential)
      .mockResolvedValueOnce(freshCredential);
    mockGetAccountService.mockReturnValue({
      linkProvider,
      signIn,
      requirePermanentUser: jest.fn().mockResolvedValue('existing-user'),
    });
    const screen = render(
      <PartnerAccountGate
        intent="protect"
        onComplete={onComplete}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(screen.getByText('Sign into existing account')).toBeTruthy()
    );
    expect(signIn).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Sign into existing account'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith(freshCredential));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('does not complete a deferred partner action until the account is permanent', async () => {
    const onComplete = jest.fn();
    mockGetGoogleCredential.mockResolvedValue(googleCredential);
    mockGetAccountService.mockReturnValue({
      linkProvider: jest.fn().mockResolvedValue(permanentAccount('user-1')),
      signIn: jest.fn(),
      requirePermanentUser: jest.fn().mockRejectedValue({
        code: 'ACCOUNT_REQUIRED',
      }),
    });
    const screen = render(
      <PartnerAccountGate
        intent="protect"
        onComplete={onComplete}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(
        screen.getByText('Could not protect your connection.')
      ).toBeTruthy()
    );
    expect(onComplete).not.toHaveBeenCalled();
  });
});
