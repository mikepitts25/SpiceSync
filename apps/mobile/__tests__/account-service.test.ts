const mockClient = {
  auth: {
    getUser: jest.fn(),
    signInAnonymously: jest.fn(),
    linkIdentity: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
  },
};

jest.mock('../lib/auth/supabase', () => ({
  getSupabaseClient: () => mockClient,
}));

import { AccountService } from '../lib/auth/accountService';
import type { ProviderCredential } from '../lib/auth/types';

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

function googleCredential(): ProviderCredential {
  return {
    provider: 'google',
    token: 'id-token',
    accessToken: 'native-access-token',
  };
}

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AccountService(mockClient);
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

  it('requires a permanent provider-backed user for protected actions', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: anonymousUser('user-1') },
      error: null,
    });

    await expect(service.requirePermanentUser()).rejects.toMatchObject({
      code: 'ACCOUNT_REQUIRED',
    });
  });
});
