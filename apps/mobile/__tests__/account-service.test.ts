import type { AccountService as AccountServiceInstance } from '../lib/auth/accountService';
import type { ProviderCredential } from '../lib/auth/types';
import { AuthSessionMissingError } from '@supabase/supabase-js';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { encodeBase64Url, utf8ToBytes } from '../lib/sync/base64';

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

function idToken(claims: Record<string, unknown>): string {
  return [
    encodeBase64Url(utf8ToBytes(JSON.stringify({ alg: 'none' }))),
    encodeBase64Url(utf8ToBytes(JSON.stringify(claims))),
    'signature',
  ].join('.');
}

function googleDeletionProof() {
  return { googleChallengeId: '35e2df10-8167-4b9d-bb36-59c72d768b33' };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
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
    useCoupleLinkStore.setState({
      link: null,
      authenticatedUserId: null,
      remoteSyncPauseReason: null,
      pendingProfileConfirmationOwnerUserId: null,
      remoteStateNotice: null,
    } as never);
    useEventQueueStore.setState({
      pending: [],
      quarantined: [],
      nextClientSequence: 1,
    } as never);
    usePartnerVotesStore.setState({ byCardId: {}, answeredCount: 0 });
    useRevealConsentStore.setState({ local: {}, partner: {} });
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

    const appleToken = idToken({ sub: 'apple-user', nonce: 'hashed' });
    await expect(
      service.linkProvider({
        provider: 'apple',
        token: appleToken,
        nonce: 'raw',
      })
    ).resolves.toMatchObject({ status: 'permanent', userId: 'user-1' });
    expect(mockClient.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'apple',
      token: appleToken,
      access_token: undefined,
      nonce: 'raw',
    });
  });

  it('maps an Apple authorization code to Supabase access_token during linking', async () => {
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

    const appleToken = idToken({ sub: 'apple-user', nonce: 'hashed' });
    await service.linkProvider({
      provider: 'apple',
      token: appleToken,
      authorizationCode: 'apple-authorization-code',
      nonce: 'raw-nonce',
    });

    expect(mockClient.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'apple',
      token: appleToken,
      access_token: 'apple-authorization-code',
      nonce: 'raw-nonce',
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
      {
        name: 'AuthRetryableFetchError',
        code: 'network_error',
        message: 'offline',
      },
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

  it('never auto-bootstraps anonymous auth for a signed-out protected link', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-protected',
        ownerUserId: 'protected-user',
        myDeviceId: 'device-protected',
        partnerDeviceId: 'device-partner',
        partnerSigningPublicKey: 'sign-partner',
        partnerEncryptionPublicKey: 'enc-partner',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: null,
      remoteSyncPauseReason: 'signed-out',
    } as never);
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    await expect(service.ensureAnonymousUser()).rejects.toMatchObject({
      code: 'ACCOUNT_REQUIRED',
    });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('preserves same-user relationship and queue when anonymous linking upgrades in place', async () => {
    const link = {
      coupleId: 'couple-same-user',
      ownerUserId: 'user-1',
      myDeviceId: 'device-me',
      partnerDeviceId: 'device-partner',
      partnerSigningPublicKey: 'sign-partner',
      partnerEncryptionPublicKey: 'enc-partner',
      linkedAt: 1,
      lastPulledServerSequence: 4,
      lastSyncedAt: 5,
      requiresProfileConfirmation: false,
      status: 'active' as const,
    };
    useCoupleLinkStore.setState({
      link,
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
    } as never);
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'event-owned',
          ownerUserId: 'user-1',
          coupleId: 'couple-same-user',
          authorDeviceId: 'device-me',
          recipientDeviceId: 'device-partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'event-owned',
            authorDeviceId: 'device-me',
            answeredCount: 1,
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      quarantined: [],
      nextClientSequence: 2,
    } as never);
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

    await service.linkProvider({
      provider: 'apple',
      token: idToken({ sub: 'apple-user', nonce: 'hashed' }),
      nonce: 'nonce',
    });

    expect(useCoupleLinkStore.getState().link).toMatchObject(link);
    expect(useEventQueueStore.getState().pending).toHaveLength(1);
    expect(useEventQueueStore.getState().quarantined).toEqual([]);
  });

  it('explicitly quarantines old remote state when sign-in switches account ownership', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-old',
        ownerUserId: 'anonymous-old',
        myDeviceId: 'device-old',
        partnerDeviceId: 'device-old-partner',
        partnerSigningPublicKey: 'sign-old-partner',
        partnerEncryptionPublicKey: 'enc-old-partner',
        linkedAt: 1,
        lastPulledServerSequence: 7,
        lastSyncedAt: 8,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'anonymous-old',
      remoteSyncPauseReason: null,
    } as never);
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'old-plaintext',
          ownerUserId: 'anonymous-old',
          coupleId: 'couple-old',
          authorDeviceId: 'device-old',
          recipientDeviceId: 'device-old-partner',
          envelopeVersion: 2,
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'progress.snapshot',
            eventId: 'old-plaintext',
            authorDeviceId: 'device-old',
            answeredCount: 9,
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      quarantined: [],
      nextClientSequence: 2,
    } as never);
    usePartnerVotesStore.setState({
      byCardId: {
        card: {
          cardId: 'card',
          vote: 'yes',
          updatedAt: 1,
          receivedAt: 1,
        },
      },
      answeredCount: 1,
    });
    useRevealConsentStore.setState({
      local: { mutualMaybe: 1 },
      partner: { mutualMaybe: 2 },
    });
    mockClient.auth.getUser
      .mockResolvedValueOnce({
        data: { user: anonymousUser('anonymous-old') },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: permanentUser('existing-user', 'google') },
        error: null,
      });
    mockClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'existing-bearer' } },
      error: null,
    });

    await expect(service.signIn(googleCredential())).resolves.toMatchObject({
      userId: 'existing-user',
      accountChanged: true,
    });

    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: null,
      authenticatedUserId: 'existing-user',
      remoteSyncPauseReason: 'auth-required',
      pendingProfileConfirmationOwnerUserId: 'existing-user',
      remoteStateNotice: {
        kind: 'account-switched',
        discardedPendingCount: 1,
      },
    });
    expect(useEventQueueStore.getState().pending).toEqual([]);
    expect(useEventQueueStore.getState().quarantined).toEqual([
      expect.objectContaining({
        eventId: 'old-plaintext',
        reason: 'account-switched',
      }),
    ]);
    expect(usePartnerVotesStore.getState()).toMatchObject({
      byCardId: {},
      answeredCount: 0,
    });
    expect(useRevealConsentStore.getState()).toMatchObject({
      local: {},
      partner: {},
    });
  });

  it('reports an account conflict after restart from a signed-out protected link', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-before-restart',
        ownerUserId: 'signed-out-owner',
        myDeviceId: 'device-before-restart',
        partnerDeviceId: 'partner-before-restart',
        partnerSigningPublicKey: 'sign-before-restart',
        partnerEncryptionPublicKey: 'enc-before-restart',
        linkedAt: 1,
        lastPulledServerSequence: 2,
        lastSyncedAt: 3,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: null,
      remoteSyncPauseReason: 'signed-out',
    } as never);
    mockClient.auth.getUser
      .mockResolvedValueOnce({
        data: { user: null },
        error: new AuthSessionMissingError(),
      })
      .mockResolvedValueOnce({
        data: { user: permanentUser('different-owner', 'google') },
        error: null,
      });
    mockClient.auth.signInWithIdToken.mockResolvedValue({
      data: { session: { access_token: 'different-bearer' } },
      error: null,
    });

    await expect(service.signIn(googleCredential())).resolves.toMatchObject({
      userId: 'different-owner',
      accountChanged: true,
    });
    expect(useCoupleLinkStore.getState()).toMatchObject({
      link: null,
      authenticatedUserId: 'different-owner',
      remoteSyncPauseReason: 'auth-required',
      pendingProfileConfirmationOwnerUserId: 'different-owner',
      remoteStateNotice: { kind: 'account-switched' },
    });
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

  it('persists the signed-out pause before ending auth and keeps it after success', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-sign-out',
        ownerUserId: 'user-1',
        myDeviceId: 'device-me',
        partnerDeviceId: 'device-partner',
        partnerSigningPublicKey: 'sign-partner',
        partnerEncryptionPublicKey: 'enc-partner',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
    } as never);
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    const signOut = deferred<{ data: object; error: null }>();
    mockClient.auth.signOut.mockReturnValue(signOut.promise);

    const signingOut = service.signOut();
    await Promise.resolve();

    expect(useCoupleLinkStore.getState()).toMatchObject({
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: 'signed-out',
    });
    signOut.resolve({ data: {}, error: null });
    await signingOut;
    expect(useCoupleLinkStore.getState()).toMatchObject({
      authenticatedUserId: null,
      remoteSyncPauseReason: 'signed-out',
    });
  });

  it('rolls the durable pause back when Supabase sign-out fails', async () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-sign-out',
        ownerUserId: 'user-1',
        myDeviceId: 'device-me',
        partnerDeviceId: 'device-partner',
        partnerSigningPublicKey: 'sign-partner',
        partnerEncryptionPublicKey: 'enc-partner',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        requiresProfileConfirmation: false,
        status: 'active',
      },
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
    } as never);
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });
    mockClient.auth.signOut.mockResolvedValue({
      data: {},
      error: { code: 'network_error', message: 'offline' },
    });

    await expect(service.signOut()).rejects.toMatchObject({
      code: 'network_error',
    });
    expect(useCoupleLinkStore.getState()).toMatchObject({
      authenticatedUserId: 'user-1',
      remoteSyncPauseReason: null,
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
    const appleToken = idToken({ sub: 'user-1', nonce: 'hashed-nonce' });
    await service.deleteAccount({
      provider: 'apple',
      token: appleToken,
      nonce: 'fresh-raw-nonce',
      authorizationCode: 'one-time-apple-code',
    });

    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).toHaveBeenCalledWith({
      provider: 'apple',
      token: appleToken,
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

  it('omits an Apple nonce during deletion when the returned token has no nonce claim', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'apple') },
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
    const appleToken = idToken({ sub: 'user-1' });

    await service.deleteAccount({
      provider: 'apple',
      token: appleToken,
      nonce: 'raw-that-must-not-be-forwarded',
      authorizationCode: 'one-time-apple-code',
    });

    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).toHaveBeenCalledWith({
      provider: 'apple',
      token: appleToken,
    });
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
    mockClient.functions.invoke.mockResolvedValue({
      data: {
        challengeId: '35e2df10-8167-4b9d-bb36-59c72d768b33',
        expiresAt: '2026-08-21T12:05:00.000Z',
      },
      error: null,
      response: { status: 201 },
    });

    await expect(service.getDeletionProvider()).resolves.toBe('google');
    const proof = await service.prepareAccountDeletion('google');
    await service.deleteAccount(googleCredential(), proof);

    expect(mockClient.functions.invoke).toHaveBeenCalledWith(
      'spicesync-delete-account',
      { body: { action: 'create_google_challenge' } }
    );

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
        body: {
          googleChallengeId: '35e2df10-8167-4b9d-bb36-59c72d768b33',
          googleIdToken: 'id-token',
        },
        headers: { Authorization: 'Bearer fresh-bearer' },
      }
    );
    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
    expect(mockClient.auth.signInWithIdToken).not.toHaveBeenCalled();
    expect(
      mockClient.functions.invoke.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockDeletionReauthClient.auth.signInWithIdToken.mock
        .invocationCallOrder[0]
    );
  });

  it('rejects direct Google deletion before isolated reauthentication without a server challenge', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: permanentUser('user-1', 'google') },
      error: null,
    });

    await expect(
      service.deleteAccount(googleCredential())
    ).rejects.toMatchObject({
      code: 'GOOGLE_CHALLENGE_REQUIRED',
    });
    expect(
      mockDeletionReauthClient.auth.signInWithIdToken
    ).not.toHaveBeenCalled();
    expect(mockDeletionReauthClient.functions.invoke).not.toHaveBeenCalled();
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
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
      service.deleteAccount(googleCredential(), googleDeletionProof())
    ).rejects.toMatchObject({ code: 'ACCOUNT_DELETION_FAILED' });
    await expect(
      service.deleteAccount(googleCredential(), googleDeletionProof())
    ).rejects.toThrow('offline');
  });
});
