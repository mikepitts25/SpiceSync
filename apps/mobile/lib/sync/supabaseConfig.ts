import Constants from 'expo-constants';

export type SupabaseRelayConfig = {
  url: string;
  anonKey: string;
};

function readExtra(): { supabaseUrl?: string; supabaseAnonKey?: string } {
  return (
    (Constants.expoConfig?.extra as
      | { supabaseUrl?: string; supabaseAnonKey?: string }
      | undefined) ?? {}
  );
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

export function readSupabaseRelayConfig(): SupabaseRelayConfig | null {
  const extra = readExtra();
  const url = clean(extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL);
  const anonKey = clean(
    extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseRelayConfigured(): boolean {
  return readSupabaseRelayConfig() !== null;
}
