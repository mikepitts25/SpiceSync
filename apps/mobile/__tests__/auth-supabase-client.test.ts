const mockCreateClient = jest.fn();
const mockProcessLock = jest.fn();
const mockReadSupabaseRelayConfig = jest.fn();
const mockAppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

jest.mock('@supabase/auth-js', () => ({
  processLock: mockProcessLock,
}));

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('react-native', () => ({
  AppState: mockAppState,
}));

jest.mock('../lib/sync/supabaseConfig', () => ({
  readSupabaseRelayConfig: mockReadSupabaseRelayConfig,
}));

function makeSupabaseClient() {
  return {
    auth: {
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  };
}

describe('shared Supabase client', () => {
  let appStateListener: ((state: string) => void) | undefined;
  let appStateSubscription: { remove: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    appStateListener = undefined;
    appStateSubscription = { remove: jest.fn() };
    mockAppState.currentState = 'active';
    mockAppState.addEventListener.mockReset();
    mockAppState.addEventListener.mockImplementation((_, listener) => {
      appStateListener = listener;
      return appStateSubscription;
    });
    mockCreateClient.mockReset();
    mockCreateClient.mockImplementation(makeSupabaseClient);
    mockReadSupabaseRelayConfig.mockReset();
    mockReadSupabaseRelayConfig.mockReturnValue({
      url: 'https://project.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('reuses one client with secure persistent auth configuration', () => {
    const { secureSessionStorage } = require('../lib/auth/secureSessionStorage');
    const { getSupabaseClient } = require('../lib/auth/supabase');

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(second).toBe(first);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      {
        auth: {
          storage: secureSessionStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          lock: mockProcessLock,
        },
      }
    );
    expect(mockAppState.addEventListener).toHaveBeenCalledTimes(1);
    expect(first.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('applies the current AppState and refreshes only while active', () => {
    mockAppState.currentState = 'inactive';
    const { getSupabaseClient } = require('../lib/auth/supabase');

    const client = getSupabaseClient();

    expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    expect(client.auth.startAutoRefresh).not.toHaveBeenCalled();

    appStateListener?.('active');
    appStateListener?.('background');

    expect(client.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
  });

  it('stops refresh and removes the AppState subscription on reset', () => {
    const { _resetSupabaseClientForTests, getSupabaseClient } = require(
      '../lib/auth/supabase'
    );
    const first = getSupabaseClient();

    _resetSupabaseClientForTests();

    expect(first.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    expect(appStateSubscription.remove).toHaveBeenCalledTimes(1);

    const second = getSupabaseClient();
    expect(second).not.toBe(first);
    expect(mockAppState.addEventListener).toHaveBeenCalledTimes(2);
  });
});
