import { AuthSessionMissingError } from '@supabase/supabase-js';

const mockClient = {
  auth: {
    getUser: jest.fn(),
    signInAnonymously: jest.fn(),
    linkIdentity: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
  },
  functions: { invoke: jest.fn() },
};

jest.mock('../lib/auth/supabase', () => ({
  getSupabaseClient: () => mockClient,
}));

const { bootstrapAccountState, useAccountStore } =
  require('../lib/auth/accountStore') as typeof import('../lib/auth/accountStore');
const { _resetAccountServiceForTests } =
  require('../lib/auth/accountService') as typeof import('../lib/auth/accountService');

const FAST_RETRIES = [1, 1, 1] as const;

function permanentUser(id: string) {
  return { id, is_anonymous: false, identities: [{ provider: 'apple' }] };
}

/**
 * A transient network/server Auth failure at cold start must not strand the
 * process. `bootstrapAccountState` runs once at startup, so without an
 * in-process retry an owned link stays paused for the process lifetime and only
 * an AppState background/foreground transition can recover it.
 */
describe('cold-start account bootstrap retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetAccountServiceForTests();
    useAccountStore.setState({
      status: 'local-only',
      userId: null,
      providers: [],
      error: null,
    });
  });

  it('retries a transient auth failure and resolves the real user', async () => {
    mockClient.auth.getUser
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'network request failed', code: 'network_error' },
      })
      .mockResolvedValue({
        data: { user: permanentUser('user-1') },
        error: null,
      });

    const snapshot = await bootstrapAccountState(FAST_RETRIES);

    expect(mockClient.auth.getUser.mock.calls.length).toBeGreaterThan(1);
    expect(snapshot.status).toBe('permanent');
    expect(snapshot.userId).toBe('user-1');
    expect(useAccountStore.getState().userId).toBe('user-1');
  });

  it('does not retry a genuine missing session', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    const snapshot = await bootstrapAccountState(FAST_RETRIES);

    // Empty local storage is a real terminal answer, not a transient failure.
    expect(mockClient.auth.getUser).toHaveBeenCalledTimes(1);
    expect(snapshot.status).toBe('local-only');
  });

  it('surfaces an error snapshot after exhausting retries', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'still down', code: 'network_error' },
    });

    const snapshot = await bootstrapAccountState(FAST_RETRIES);

    expect(mockClient.auth.getUser.mock.calls.length).toBeGreaterThan(1);
    expect(snapshot.status).toBe('error');
  });
});
