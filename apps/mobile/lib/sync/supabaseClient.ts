import 'react-native-url-polyfill/auto';

import { getSupabaseClient } from '../auth/supabase';
import { getAccountService } from '../auth/accountService';
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
    const supabase = getSupabaseClient();
    cachedClient = new SupabaseRelayClient(
      supabase as unknown as SupabaseRelayClientLike,
      () => getAccountService().ensureAnonymousUser(),
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
