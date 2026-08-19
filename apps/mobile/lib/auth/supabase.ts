import 'react-native-url-polyfill/auto';

import { processLock } from '@supabase/auth-js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { readSupabaseRelayConfig } from '../sync/supabaseConfig';
import { secureSessionStorage } from './secureSessionStorage';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const config = readSupabaseRelayConfig();
  if (!config) {
    throw new Error('Supabase relay is not configured');
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      storage: secureSessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  cachedClient = supabase;
  return cachedClient;
}

export function _resetSupabaseClientForTests(): void {
  cachedClient = null;
}
