import Constants from 'expo-constants';

export type SupabaseRelayConfig = {
  url: string;
  anonKey: string;
};

export type SupabasePublicEnvironment = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
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

export function readSupabaseRelayConfig(
  environment?: SupabasePublicEnvironment
): SupabaseRelayConfig | null {
  const extra = readExtra();
  const supabaseUrl =
    environment === undefined
      ? process.env.EXPO_PUBLIC_SUPABASE_URL
      : environment.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    environment === undefined
      ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : environment.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const url = clean(extra.supabaseUrl || supabaseUrl);
  const anonKey = clean(
    extra.supabaseAnonKey || supabaseAnonKey
  );

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseRelayConfigured(
  environment?: SupabasePublicEnvironment
): boolean {
  return readSupabaseRelayConfig(environment) !== null;
}
