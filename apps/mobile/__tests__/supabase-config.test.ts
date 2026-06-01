describe('Supabase relay config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('is disabled when Supabase URL or anon key are missing', () => {
    const { readSupabaseRelayConfig, isSupabaseRelayConfigured } =
      require('../lib/sync/supabaseConfig');

    expect(readSupabaseRelayConfig()).toBeNull();
    expect(isSupabaseRelayConfigured()).toBe(false);
  });

  it('reads Supabase URL and anon key from Expo public env', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { readSupabaseRelayConfig, isSupabaseRelayConfigured } =
      require('../lib/sync/supabaseConfig');

    expect(readSupabaseRelayConfig()).toEqual({
      url: 'https://project.supabase.co',
      anonKey: 'anon-key',
    });
    expect(isSupabaseRelayConfigured()).toBe(true);
  });
});
