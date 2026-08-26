describe('Supabase relay config', () => {
  it('is disabled when Supabase URL or anon key are missing', () => {
    const { readSupabaseRelayConfig, isSupabaseRelayConfigured } =
      require('../lib/sync/supabaseConfig');

    expect(readSupabaseRelayConfig({})).toBeNull();
    expect(isSupabaseRelayConfigured({})).toBe(false);
  });

  it('reads Supabase URL and anon key from Expo public env', () => {
    const { readSupabaseRelayConfig, isSupabaseRelayConfigured } =
      require('../lib/sync/supabaseConfig');
    const environment = {
      EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co/',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    };

    expect(readSupabaseRelayConfig(environment)).toEqual({
      url: 'https://project.supabase.co',
      anonKey: 'anon-key',
    });
    expect(isSupabaseRelayConfigured(environment)).toBe(true);
  });
});
