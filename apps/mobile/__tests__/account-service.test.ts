import type { AccountService as AccountServiceInstance } from '../lib/auth/accountService';
import type { ProviderCredential } from '../lib/auth/types';
import { AuthSessionMissingError } from '@supabase/supabase-js';

const mockClient = {
  auth: {
    getUser: jest.fn(),
    signInAnonymously: jest.fn(),
    linkIdentity: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
  },
  functions: {
    invoke: jest.fn(),
  },
};

const mockDeletionReauthClient = {
  auth: {
    getUser: jest.fn(),
    signInWithIdToken: jest.fn(),
  },
  functions: {
    invoke: jest.fn(),
  },
};
const mockCreateDeletionReauthClient = jest.fn();

jest.mock('../lib/auth/supabase', () => ({
  getSupabaseClient: () => mockClient,
}));

const { AccountService } =
  require('../lib/auth/accountService') as typeof import('../lib/auth/accountService');

type AccountServiceWithDeletionReauthFactory = new (
  client: typeof mockClient,
  deviceDependencies: undefined,
  createDeletionReauthClient: () => typeof mockDeletionReauthClient
) => AccountServiceInstance;

function anonymousUser(id: string) {
  return { id, is_anonymous: true, identities: [] };
}

function permanentUser(id: string, provider: 'apple' | 'google') {
  return {
    id,
    is_anonymous: false,
    identities: [{ provider }],
  };
}

function permanentUserWithProviders(
  id: string,
  providers: ('apple' | 'google')[]
) {
  return {
    id,
    is_anonymous: false,
    identities: providers.map((provider) => ({ provider })),
  };
}

function googleCredential(): ProviderCredential {
  return {
    provider: 'google',
    token: 'id-token',
    accessToken: 'native-access-token',
  };
}

describe('AccountService', () => {
  let service: AccountServiceInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    mockCreateDeletionReauthClient.mockReturnValue(mockDeletionReauthClient);
    const AccountServiceForDeletion =
      AccountService as unknown as AccountServiceWithDeletionReauthFactory;
    service = new AccountServiceForDeletion(
      mockClient,
      undefined,
      mockCreateDeletionReauthClient
    );
  });

  it('classifies no Supabase user as local-only', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(service.getSnapshot()).resolves.toEqual({
      status: 'local-only',
      userId: null,
      providers: [],
      error: null,
    });
  });

  it('classifies a provider-backed user as permanent', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });

    await expect(service.getSnapshot()).resolves.toMatchObject({
      status: 'permanent',
      userId: 'user-1',
      providers: ['google'],
    });
  });

  it('links the provider without changing the anonymous user id', async () => {
    mockClient.auth.getUser
      .mockResolvedValueOnce({
        data: { user: anonymousUser('user-1') },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: permanentUser('user-1', 'apple') },
        error: null,
      });
    mockClient.auth.linkIdentity.mockResolvedValue({ data: {}, error: null });

    await expect(
      service.linkProvider({
        provider: 'apple',
        token: 'id-token',
        nonce: 'raw',
      })
    ).resolves.toMatchObject({ status: 'permanent', userId: 'user-1' });
    expect(mockClient.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'id-token',
      access_token: undefined,
      nonce: 'raw',
    });
  });

  it('maps an identity-already-exists response to ACCOUNT_EXISTS', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: anonymousUser('user-1') },
      error: null,
    });
    mockClient.auth.linkIdentity.mockResolvedValue({
      data: null,
      error: { code: 'identity_already_exists', message: 'linked' },
    });

    await expect(
      service.linkProvider(googleCredential())
    ).rejects.toMatchObject({
      code: 'ACCOUNT_EXISTS',
    });
  });

  it('maps native credentials to Supabase access_token when signing in', async () => {
    mockClient.auth.signInWithIdToken.mockResolvedValue({
      data: {},
      error: null,
    });
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('existing-user', 'google') },
      error: null,
    });

    await expect(service.signIn(googleCredential())).resolves.toMatchObject({
      status: 'permanent',
      userId: 'existing-user',
    });
    expect(mockClient.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'id-token',
      access_token: 'native-access-token',
      nonce: undefined,
    });
  });

  it('creates an anonymous user only when a remote flow requests one', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { user: { id: 'anonymous-user' } },
      error: null,
    });

    await expect(service.ensureAnonymousUser()).resolves.toBe('anonymous-user');
  });

  it('treats the installed Supabase missing-session result as local-only and bootstraps anonymous auth', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { user: { id: 'fresh-anonymous-user' } },
      error: null,
    });

    await expect(service.ensureAnonymousUser()).resolves.toBe(
      'fresh-anonymous-user'
    );
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('does not mistake network or validation failures for a missing session', async () => {
    for (const error of [
      { name: 'AuthRetryableFetchError', code: 'network_error', message: 'offline' },
      { name: 'AuthApiError', code: 'validation_failed', message: 'invalid' },
    ]) {
      mockClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error,
      });

      await expect(service.ensureAnonymousUser()).rejects.toMatchObject({
        code: error.code,
      });
    }
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('requires a permanent provider-backed user for protected actions', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: anonymousUser('user-1') },
      error: null,
    });

    await expect(service.requirePermanentUser()).rejects.toMatchObject({
      code: 'ACCOUNT_REQUIRED',
    });
  });

  it('revokes the active device before signing out or clearing device state', async () => {
    const calls: string[] = [];
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockClient.auth.signOut.mockImplementation(async () => {
      calls.push('sign-out');
      return { data: {}, error: null };
    });
    const serviceWithDevice = new AccountService(mockClient, {
      getCurrentDevice: async () => ({ deviceId: 'device-1' }),
      revokeDevice: async (deviceId) => {
        expect(deviceId).toBe('device-1');
        calls.push('revoke-device');
      },
      clearIdentity: async () => {
        calls.push('clear-identity');
      },
      clearForgottenDeviceState: () => {
        calls.push('clear-remote-state');
      },
    });

    const forget = (
      serviceWithDevice as AccountServiceInstance & {
        forgetCurrentDevice?: () => Promise<void>;
      }
    ).forgetCurrentDevice;
    expect(forget).toEqual(expect.any(Function));

    await forget?.call(serviceWithDevice);

    expect(calls).toEqual([
      'revoke-device',
      'sign-out',
      'clear-identity',
      'clear-remote-state',
    ]);
  });

  it('preserves the authenticated session and local state when revocation fails', async () => {
    const clearIdentity = jest.fn();
    const clearForgottenDeviceState = jest.fn();
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockClient.auth.signOut.mockResolvedValue({ data: {}, error: null });
    const serviceWithDevice = new AccountService(mockClient, {
      getCurrentDevice: async () => ({ deviceId: 'device-1' }),
      revokeDevice: async () => {
        throw new Error('offline');
      },
      clearIdentity,
      clearForgottenDeviceState,
    });
    const forget = (
      serviceWithDevice as AccountServiceInstance & {
        forgetCurrentDevice?: () => Promise<void>;
      }
    ).forgetCurrentDevice;

    await expect(forget?.call(serviceWithDevice)).rejects.toThrow('offline');

    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
    expect(clearIdentity).not.toHaveBeenCalled();
    expect(clearForgottenDeviceState).not.toHaveBeenCalled();
  });

  it('rejects a missing current device without signing out or clearing local state', async () => {
    const revokeDevice = jest.fn();
    const clearIdentity = jest.fn();
    const clearForgottenDeviceState = jest.fn();
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockClient.auth.signOut.mockResolvedValue({ data: {}, error: null });
    const serviceWithMissingDevice = new AccountService(mockClient, {
      getCurrentDevice: async () => null,
      revokeDevice,
      clearIdentity,
      clearForgottenDeviceState,
    });

    await expect(
      serviceWithMissingDevice.forgetCurrentDevice()
    ).rejects.toMatchObject({
      code: 'DEVICE_NOT_FOUND',
    });

    expect(revokeDevice).not.toHaveBeenCalled();
    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
    expect(clearIdentity).not.toHaveBeenCalled();
    expect(clearForgottenDeviceState).not.toHaveBeenCalled();
  });

  it('prefers Apple and keeps its one-time authorization code out of Supabase reauthentication', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: {
        user: permanentUserWithProviders('user-1', ['google', 'apple']),
      },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'apple') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'fresh-bearer' } },
      error: null,
    });
    mockDeletionReauthClient.functions.invoke.mockResolvedValue({
      data: '',
      error: null,
      response: { status: 204 },
    });

    await expect(service.getDeletionProvider()).resolves.toBe('apple');
    await service.deleteAccount({
      provider: 'apple',
      token: 'fresh-apple-id-token',
      nonce: 'fresh-raw-nonce',
      authorizationCode: 'one-time-apple-code',
    });

    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'fresh-apple-id-token',
      nonce: 'fresh-raw-nonce',
    });
    expect(
      mockDeletionReauthClient.auth.signInWithIdToken.mock.calls[0][0]
    ).not.toHaveProperty('access_token');
    expect(mockDeletionReauthClient.functions.invoke).toHaveBeenCalledWith(
      'spicesync-delete-account',
      {
        body: { appleAuthorizationCode: 'one-time-apple-code' },
        headers: { Authorization: 'Bearer fresh-bearer' },
      }
    );
    expect(
      mockDeletionReauthClient.auth.signInWithIdToken.mock
        .invocationCallOrder[0]
    ).toBeLessThan(
      mockDeletionReauthClient.functions.invoke.mock.invocationCallOrder[0]
    );
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
    expect(mockClient.functions.invoke).not.toHaveBeenCalled();
  });

  it('uses a fresh Google credential for a Google-only account without signing out before server confirmation', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'fresh-bearer' } },
      error: null,
    });
    mockDeletionReauthClient.functions.invoke.mockResolvedValue({
      data: '',
      error: null,
      response: { status: 204 },
    });

    await expect(service.getDeletionProvider()).resolves.toBe('google');
    await service.deleteAccount(googleCredential());

    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).toHaveBeenCalledWith({
      provider: 'google',
      token: 'id-token',
      access_token: 'native-access-token',
    });
    expect(mockDeletionReauthClient.functions.invoke).toHaveBeenCalledWith(
      'spicesync-delete-account',
      {
        body: {},
        headers: { Authorization: 'Bearer fresh-bearer' },
      }
    );
    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('rejects an Apple deletion attempt before reauthentication when the one-time code is missing', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'apple') },
      error: null,
    });

    await expect(
      service.deleteAccount({
        provider: 'apple',
        token: 'fresh-apple-id-token',
        nonce: 'fresh-raw-nonce',
      })
    ).rejects.toMatchObject({ code: 'APPLE_AUTHORIZATION_CODE_REQUIRED' });

    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).not.toHaveBeenCalled();
    expect(mockClient.functions.invoke).not.toHaveBeenCalled();
  });

  it('does not invoke deletion after a reauthenticated credential belongs to another user', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('other-user', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'fresh-bearer' } },
      error: null,
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'ACCOUNT_MISMATCH' });

    expect(mockDeletionReauthClient.functions.invoke).not.toHaveBeenCalled();
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('keeps the shared persisted session byte-for-byte unchanged when reauthentication is for another account', async () => {
    const sharedSession = {
      access_token: 'persisted-access-token',
      refresh_token: 'persisted-refresh-token',
      user: permanentUser('user-1', 'google'),
    };
    const secureStore = new Map([
      ['supabase.auth.token', JSON.stringify(sharedSession)],
    ]);
    const persistedSnapshot = secureStore.get('supabase.auth.token');

    mockClient.auth.getUser.mockImplementation(async () => ({
      data: { user: sharedSession.user },
      error: null,
    }));
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('other-user', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'ephemeral-bearer' } },
      error: null,
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'ACCOUNT_MISMATCH' });

    expect(secureStore.get('supabase.auth.token')).toBe(persistedSnapshot);
    expect(sharedSession.user.id).toBe('user-1');
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
    expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    expect(mockDeletionReauthClient.functions.invoke).not.toHaveBeenCalled();
  });

  it('fails closed before deletion when the reauthenticated bearer is unavailable', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'REFRESHED_BEARER_UNAVAILABLE' });

    expect(mockDeletionReauthClient.functions.invoke).not.toHaveBeenCalled();
  });

  it('fails closed when the deletion function does not positively return 204', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'fresh-bearer' } },
      error: null,
    });
    mockDeletionReauthClient.functions.invoke.mockResolvedValue({
      data: '',
      error: null,
      response: { status: 202 },
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'ACCOUNT_DELETION_FAILED' });
  });

  it('keeps the shared persisted session byte-for-byte unchanged when deletion confirmation fails', async () => {
    const sharedSession = {
      access_token: 'persisted-access-token',
      refresh_token: 'persisted-refresh-token',
      user: permanentUser('user-1', 'google'),
    };
    const secureStore = new Map([
      ['supabase.auth.token', JSON.stringify(sharedSession)],
    ]);
    const persistedSnapshot = secureStore.get('supabase.auth.token');

    mockClient.auth.getUser.mockImplementation(async () => ({
      data: { user: sharedSession.user },
      error: null,
    }));
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'ephemeral-bearer' } },
      error: null,
    });
    mockDeletionReauthClient.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('offline'),
      response: { status: 500 },
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'ACCOUNT_DELETION_FAILED' });

    expect(secureStore.get('supabase.auth.token')).toBe(persistedSnapshot);
    expect(sharedSession.user.id).toBe('user-1');
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
    expect(mockClient.functions.invoke).not.toHaveBeenCalled();
    expect(mockDeletionReauthClient.functions.invoke).toHaveBeenCalledWith(
      'spicesync-delete-account',
      expect.objectContaining({
        headers: { Authorization: 'Bearer ephemeral-bearer' },
      })
    );
  });

  it('does not confirm deletion when the function reports an error or the network rejects', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockDeletionReauthClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'fresh-bearer' } },
      error: null,
    });
    mockDeletionReauthClient.functions.invoke
      .mockResolvedValueOnce({
        data: null,
        error: new Error('function failure'),
        response: { status: 500 },
      })
      .mockRejectedValueOnce(new Error('offline'));

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({ code: 'ACCOUNT_DELETION_FAILED' });
    await expect(service.deleteAccount(googleCredential())).rejects.toThrow(
      'offline'
    );
  });
});
