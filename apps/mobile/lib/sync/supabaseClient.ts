import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { readSupabaseRelayConfig } from './supabaseConfig';
import {
  SupabaseRelayClient,
  type SupabaseRelayClientLike,
} from './supabaseRelayClient';

let cachedClient: SupabaseRelayClient | null = null;

export function getConfiguredSupabaseRelayClient(): SupabaseRelayClient {
  const config = readSupabaseRelayConfig();
  if (!config) {
    throw new Error('Supabase relay is not configured');
  }

  if (!cachedClient) {
    const supabase = createClient(config.url, config.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    cachedClient = new SupabaseRelayClient(
      supabase as unknown as SupabaseRelayClientLike,
      {
        publicBaseUrl: config.url,
      }
    );
  }

  return cachedClient;
}

export function _resetConfiguredSupabaseRelayClientForTests(): void {
  cachedClient = null;
}
