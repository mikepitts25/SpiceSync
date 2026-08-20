import { getSupabaseClient } from './supabase';
import { clearForgottenDeviceState } from '../safety/localDataControls';
import { clearIdentity, getIdentityIfExists } from '../sync/identity';
import { getRelayClient } from '../sync/relayConfig';
import type {
  AccountServiceLike,
  AccountSnapshot,
  ProviderCredential,
} from './types';

type AuthError = {
  code?: string;
  message?: string;
};

type AuthUser = {
  id: string;
  is_anonymous?: boolean;
  identities?: { provider?: string }[] | null;
};

type AuthResult<T> = {
  data: T;
  error: AuthError | null;
};

type AccountAuthClient = {
  auth: {
    getUser: () => Promise<AuthResult<{ user: AuthUser | null }>>;
    signInAnonymously: () => Promise<
      AuthResult<{ user?: Pick<AuthUser, 'id'> | null }>
    >;
    linkIdentity: (input: {
      provider: ProviderCredential['provider'];
      token: string;
      access_token?: string;
      nonce?: string;
    }) => Promise<AuthResult<unknown>>;
    signInWithIdToken: (input: {
      provider: ProviderCredential['provider'];
      token: string;
      access_token?: string;
      nonce?: string;
    }) => Promise<AuthResult<unknown>>;
    signOut: () => Promise<AuthResult<unknown>>;
  };
};

type DeviceRemovalDependencies = {
  getCurrentDevice: () => Promise<{ deviceId: string } | null>;
  revokeDevice: (deviceId: string) => Promise<void>;
  clearIdentity: () => Promise<void>;
  clearForgottenDeviceState: () => void;
};

const defaultDeviceRemovalDependencies: DeviceRemovalDependencies = {
  async getCurrentDevice() {
    const current = await getIdentityIfExists();
    return current ? { deviceId: current.identity.deviceId } : null;
  },
  revokeDevice: (deviceId) => getRelayClient().revokeDevice(deviceId),
  clearIdentity,
  clearForgottenDeviceState,
};

export class AccountServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AccountServiceError';
    this.code = code;
  }
}

const LOCAL_ONLY_SNAPSHOT: AccountSnapshot = {
  status: 'local-only',
  userId: null,
  providers: [],
  error: null,
};

function toProviders(
  identities: AuthUser['identities']
): ('apple' | 'google')[] {
  const providers = new Set<'apple' | 'google'>();
  for (const identity of identities ?? []) {
    if (identity.provider === 'apple' || identity.provider === 'google') {
      providers.add(identity.provider);
    }
  }
  return [...providers];
}

function credentialPayload(input: ProviderCredential) {
  return {
    provider: input.provider,
    token: input.token,
    access_token: input.accessToken ?? input.authorizationCode,
    nonce: input.nonce,
  };
}

function throwForAuthError(error: AuthError, fallbackCode: string): never {
  if (error.code === 'identity_already_exists') {
    throw new AccountServiceError('ACCOUNT_EXISTS', error.message || '');
  }
  throw new AccountServiceError(
    error.code || fallbackCode,
    error.message || 'Supabase authentication failed'
  );
}

export class AccountService implements AccountServiceLike {
  constructor(
    private readonly client: AccountAuthClient,
    private readonly deviceRemovalDependencies: DeviceRemovalDependencies = defaultDeviceRemovalDependencies
  ) {}

  async getSnapshot(): Promise<AccountSnapshot> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      return {
        ...LOCAL_ONLY_SNAPSHOT,
        status: 'error',
        error: {
          code: error.code || 'SUPABASE_AUTH_ERROR',
          message: error.message || 'Could not read Supabase user',
        },
      };
    }

    const user = data.user;
    if (!user) return LOCAL_ONLY_SNAPSHOT;

    const providers = toProviders(user.identities);
    return {
      status:
        user.is_anonymous === false && providers.length > 0
          ? 'permanent'
          : 'anonymous',
      userId: user.id,
      providers,
      error: null,
    };
  }

  async ensureAnonymousUser(): Promise<string> {
    const snapshot = await this.getSnapshot();
    if (snapshot.userId) return snapshot.userId;
    if (snapshot.error) {
      throw new AccountServiceError(
        snapshot.error.code,
        snapshot.error.message
      );
    }

    const { data, error } = await this.client.auth.signInAnonymously();
    if (error) throwForAuthError(error, 'SUPABASE_AUTH_ERROR');
    if (!data.user?.id) {
      throw new AccountServiceError(
        'SUPABASE_AUTH_ERROR',
        'Supabase auth user id is unavailable'
      );
    }
    return data.user.id;
  }

  async requirePermanentUser(): Promise<string> {
    const snapshot = await this.getSnapshot();
    if (snapshot.status !== 'permanent' || !snapshot.userId) {
      throw new AccountServiceError(
        'ACCOUNT_REQUIRED',
        'A permanent account is required for this action'
      );
    }
    return snapshot.userId;
  }

  async linkProvider(input: ProviderCredential): Promise<AccountSnapshot> {
    await this.ensureAnonymousUser();
    const { error } = await this.client.auth.linkIdentity(
      credentialPayload(input)
    );
    if (error) throwForAuthError(error, 'ACCOUNT_LINK_FAILED');

    const snapshot = await this.getSnapshot();
    if (snapshot.status !== 'permanent') {
      throw new AccountServiceError(
        'ACCOUNT_LINK_FAILED',
        'Provider identity was not linked to this account'
      );
    }
    return snapshot;
  }

  async signIn(input: ProviderCredential): Promise<AccountSnapshot> {
    const { error } = await this.client.auth.signInWithIdToken(
      credentialPayload(input)
    );
    if (error) throwForAuthError(error, 'ACCOUNT_SIGN_IN_FAILED');

    const snapshot = await this.getSnapshot();
    if (snapshot.status !== 'permanent') {
      throw new AccountServiceError(
        'ACCOUNT_SIGN_IN_FAILED',
        'Provider sign-in did not return a permanent account'
      );
    }
    return snapshot;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throwForAuthError(error, 'ACCOUNT_SIGN_OUT_FAILED');
  }

  async forgetCurrentDevice(): Promise<void> {
    const currentDevice =
      await this.deviceRemovalDependencies.getCurrentDevice();
    if (!currentDevice) {
      throw new AccountServiceError(
        'DEVICE_NOT_FOUND',
        'The current device identity is unavailable'
      );
    }

    // The authenticated relay call is the point of no return. Do not end the
    // session or clear local keys/state until it has completed successfully.
    await this.requirePermanentUser();
    await this.deviceRemovalDependencies.revokeDevice(currentDevice.deviceId);
    await this.signOut();
    await this.deviceRemovalDependencies.clearIdentity();
    this.deviceRemovalDependencies.clearForgottenDeviceState();
  }
}

let cachedAccountService: AccountService | null = null;

export function getAccountService(): AccountService {
  if (!cachedAccountService) {
    cachedAccountService = new AccountService(
      getSupabaseClient() as unknown as AccountAuthClient
    );
  }
  return cachedAccountService;
}

export function _resetAccountServiceForTests(): void {
  cachedAccountService = null;
}
